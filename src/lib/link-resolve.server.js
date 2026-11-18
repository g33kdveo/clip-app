// Reading a pasted link.
//
// Each source gives what it can honestly give, and nothing more:
//
//   Twitch clip   the clip's own mp4, plus title, channel and length. The whole
//                 pipeline runs on it.
//   YouTube       the caption track with the real timings, plus title, channel
//                 and length. The file itself comes down through the
//                 downloader, which the job runs in its own passes.
//   Twitch VOD    title, channel and length only. Hours of video is far past
//                 what the transcriber accepts, so the file has to be supplied.

const TWITCH_GQL = "https://gql.twitch.tv/gql";
// The public web client id the clip page itself uses. No secret, no user token.
const TWITCH_WEB_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

const round2 = (value) => Math.round(value * 100) / 100;

// The transcriber accepts ~25 MB, so aim comfortably under it.
const TRANSCRIBE_BUDGET = 20 * 1024 * 1024;

export function classifyLink(raw) {
  const url = String(raw || "").trim();
  if (!url) return { kind: "unknown" };

  const clip =
    url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]{4,})/) ||
    url.match(/twitch\.tv\/[^/]+\/clip\/([A-Za-z0-9_-]{4,})/);
  if (clip) return { kind: "twitch_clip", id: clip[1] };

  const vod = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (vod) return { kind: "twitch_vod", id: vod[1] };

  const youtube = url.match(
    /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  if (youtube) return { kind: "youtube", id: youtube[1] };

  return { kind: "unknown" };
}

async function twitchGql(query) {
  const response = await fetch(TWITCH_GQL, {
    method: "POST",
    headers: { "Client-Id": TWITCH_WEB_CLIENT_ID, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`Twitch could not be read (${response.status}).`);
  const payload = await response.json().catch(() => ({}));
  return payload?.data || {};
}

// The clip file is signed, so the mp4 only opens with this pair on the query.
function signedClipUrl(sourceUrl, token) {
  const query = `sig=${encodeURIComponent(token.signature)}&token=${encodeURIComponent(token.value)}`;
  return `${sourceUrl}?${query}`;
}

async function fileSize(url) {
  try {
    const response = await fetch(url, {
      headers: { ...BROWSER_HEADERS, Range: "bytes=0-1" },
    });
    if (!response.ok) return 0;
    const range = response.headers.get("content-range") || "";
    return Number(range.split("/")[1]) || 0;
  } catch {
    return 0;
  }
}

async function twitchClip(id) {
  const data = await twitchGql(
    `query { clip(slug: "${id}") { title durationSeconds thumbnailURL broadcaster { displayName } videoQualities { quality sourceURL } playbackAccessToken(params: {platform: "web", playerBackend: "mediaplayer", playerType: "clips"}) { signature value } } }`
  );
  const clip = data.clip;
  if (!clip) throw new Error("Twitch has no clip at that link. Check it, or upload the video instead.");

  const token = clip.playbackAccessToken;
  const qualities = (clip.videoQualities || []).filter((item) => item?.sourceURL);
  if (!token || !qualities.length) {
    throw new Error(
      "Twitch did not hand over a playable file for that clip. Download it from Twitch and upload it instead."
    );
  }

  // The source file of a one-minute clip runs past the transcriber's size limit,
  // so measure the qualities and take the best one that still fits.
  const measured = [];
  for (const item of qualities) {
    const url = signedClipUrl(item.sourceURL, token);
    measured.push({ quality: Number(item.quality) || 0, url, size: await fileSize(url) });
  }

  const usable = measured.filter((item) => item.size);
  if (!usable.length) {
    throw new Error(
      "Twitch would not send the clip file. Download it from Twitch and upload it instead."
    );
  }

  const fits = usable
    .filter((item) => item.size <= TRANSCRIBE_BUDGET)
    .sort((a, b) => b.quality - a.quality);
  const chosen = fits[0] || usable.sort((a, b) => a.size - b.size)[0];

  return {
    kind: "twitch_clip",
    title: clip.title || "Twitch clip",
    channel: clip.broadcaster?.displayName || "",
    duration: Number(clip.durationSeconds) || 0,
    thumbnail: clip.thumbnailURL || "",
    fileUrl: chosen.url,
    note: `Clip pulled from Twitch at ${chosen.quality}p. Reading its audio next.`,
  };
}

async function twitchVod(id) {
  let video = null;
  try {
    const data = await twitchGql(
      `query { video(id: "${id}") { title lengthSeconds owner { displayName } } }`
    );
    video = data.video;
  } catch {
    video = null;
  }

  return {
    kind: "twitch_vod",
    title: video?.title || "Twitch VOD",
    channel: video?.owner?.displayName || "",
    duration: Number(video?.lengthSeconds) || 0,
    note: "A Twitch VOD is hours long and Twitch serves no file for it from a link, so upload the stretch you want clipped. Only individual clips download straight in.",
  };
}

// Titles and authors sit in the player payload as JSON strings, so read them as JSON.
function jsonField(html, key) {

  const match = html.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`));
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

// Title, author and length live together in the player's videoDetails block, so
// read from there rather than the first "title" anywhere on the page.
function videoDetails(html) {
  const start = html.indexOf('"videoDetails":');
  return start === -1 ? html : html.slice(start, start + 12000);
}

function captionTracks(html) {
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed.filter((track) => track?.baseUrl) : [];
  } catch {
    return [];
  }
}

// Caption events arrive as short chunks; stitch them into sentences so the
// moment picker sees whole thoughts with the timing YouTube recorded.
function toLines(events) {
  const chunks = [];
  for (const event of events) {
    const text = (event.segs || [])
      .map((seg) => seg.utf8 || "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const start = (Number(event.tStartMs) || 0) / 1000;
    const end = start + (Number(event.dDurationMs) || 0) / 1000;
    const last = chunks[chunks.length - 1];
    if (
      last &&
      start - last.e <= 1.5 &&
      !/[.!?]$/.test(last.text) &&
      last.text.length + text.length < 160
    ) {
      last.text = `${last.text} ${text}`.replace(/\s+/g, " ");
      last.e = end;
    } else {
      chunks.push({ t: start, e: end, text });
    }
  }

  // rolling captions repeat the previous line; keep the first of each
  const lines = [];
  for (const chunk of chunks) {
    const previous = lines[lines.length - 1];
    if (previous && previous.text === chunk.text) continue;
    lines.push({ t: round2(chunk.t), e: round2(chunk.e), text: chunk.text });
  }
  return lines;
}

async function captionLines(track) {
  const response = await fetch(`${track.baseUrl}&fmt=json3`, { headers: BROWSER_HEADERS });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => null);
  return toLines(payload?.events || []);
}

async function youtube(id) {
  const response = await fetch(
    `https://www.youtube.com/watch?v=${id}&hl=en&has_verified=1&bpctr=9999999999`,
    { headers: BROWSER_HEADERS }
  );
  if (!response.ok) throw new Error(`YouTube could not be read (${response.status}).`);
  const html = await response.text();
  if (!html.includes('"videoDetails"')) {
    throw new Error(
      "YouTube would not serve this video to the server. Download the file and upload it instead."
    );
  }

  const details = videoDetails(html);
  const title = jsonField(details, "title") || "YouTube video";
  const channel = jsonField(details, "author") || "";
  const duration = Number(jsonField(details, "lengthSeconds")) || 0;
  const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  const tracks = captionTracks(html);

  // A hand-written track beats the auto-generated one when both exist.
  const track = tracks.length
    ? tracks.find((item) => item.kind !== "asr" && item.languageCode?.startsWith("en")) ||
      tracks.find((item) => item.kind !== "asr") ||
      tracks.find((item) => item.languageCode?.startsWith("en")) ||
      tracks[0]
    : null;

  // YouTube usually answers a server-side caption request with an empty body, so
  // this is a try, not a promise: when it works the moments come from the words.
  const lines = track ? await captionLines(track) : [];
  const transcript = lines.map((line) => line.text).join(" ");

  return {
    kind: "youtube",
    title,
    channel,
    duration: Math.max(duration, lines[lines.length - 1]?.e || 0),
    thumbnail,
    lines,
    transcript,
    note: lines.length
      ? `Read ${lines.length} caption lines from YouTube. The video file is pulled down next.`
      : "Read the title, channel and length from YouTube. The video file is pulled down next.",
  };
}

export async function resolveLink(raw) {
  const source = classifyLink(raw);
  if (source.kind === "twitch_clip") return twitchClip(source.id);
  if (source.kind === "twitch_vod") return twitchVod(source.id);
  if (source.kind === "youtube") return youtube(source.id);
  throw new Error(
    "That link isn't a Twitch clip, a Twitch VOD or a YouTube video. Paste one of those, or upload the file."
  );
}