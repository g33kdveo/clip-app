import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { recommendTemplates, readContentType } from "@/lib/recommend";
import { timedLines, wordsFor } from "@/lib/transcript.server";
import { TWITCH_CONNECTOR_ID } from "@/lib/twitch";

const HELIX = "https://api.twitch.tv/helix";

// Helix wants both the bearer token and the client id, and the client id only
// comes back from the validate endpoint, so every request starts there.
async function twitchClient(connection) {
  const check = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: { Authorization: `Bearer ${connection.accessToken}` },
  });
  // 401 means the grant was revoked or has expired: Twitch has to be connected again.
  if (check.status === 401) return null;
  if (!check.ok) throw new Error(`Twitch could not verify the connection (${check.status}).`);
  const { client_id, user_id } = await check.json();

  const call = async (path, method = "GET") => {
    const response = await fetch(`${HELIX}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Client-Id": client_id,
      },
    });
    if (response.status === 401) {
      throw new Error("The Twitch connection expired. Connect Twitch again.");
    }
    if (response.status === 403) {
      throw new Error("Twitch refused that request for this connection.");
    }
    if (response.status === 404) {
      throw new Error("Twitch has nothing there right now.");
    }
    if (!response.ok) throw new Error(`Twitch request failed (${response.status}).`);
    return response.json();
  };

  return { call, userId: user_id };
}

async function connectionFor(context) {
  return context
    .getBase44()
    .asServiceRole.connectors.getCurrentAppUserConnection(TWITCH_CONNECTOR_ID)
    .catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
}

async function readyClient(context) {
  const connection = await connectionFor(context);
  if (!connection) throw new Error("Connect Twitch first.");
  const client = await twitchClient(connection);
  if (!client) throw new Error("The Twitch connection expired. Connect Twitch again.");
  return client;
}

// Accepts a name, an @name or a link to the channel, and returns the login.
function normalizeLogin(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return "";
  const withoutAt = raw.replace(/^@/, "");
  const fromUrl = withoutAt.match(/twitch\.tv\/([a-z0-9_]{3,25})/);
  if (fromUrl) return fromUrl[1];
  return withoutAt.split(/[/?#\s]/)[0].replace(/[^a-z0-9_]/g, "").slice(0, 25);
}

function clipRow(clip) {
  return {
    id: clip.id,
    title: clip.title || "Untitled clip",
    url: clip.url || "",
    thumbnail: clip.thumbnail_url || "",
    // Twitch sends durations like "0h1m30s"
    duration: String(clip.duration || "").replace(/^0h/, "").replace(/^0m/, ""),
    views: Number(clip.view_count) || 0,
    creator: clip.creator_name || "",
    created_at: clip.created_at || "",
  };
}

// The board: every creator you clip, with their live status read fresh.
export const twitchStatus = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const creators = await base44.entities.TwitchCreator.list("created_date", 40);
    const connection = await connectionFor(context);
    if (!connection) return { connected: false, creators };

    const client = await twitchClient(connection);
    if (!client) return { connected: false, creators };
    if (!creators.length) return { connected: true, creators: [] };

    const logins = creators.map((creator) => creator.login).filter(Boolean);
    const query = logins.map((login) => `user_login=${encodeURIComponent(login)}`).join("&");
    const streams = await client.call(`streams?${query}`);
    const byLogin = new Map(
      (streams.data || []).map((stream) => [String(stream.user_login).toLowerCase(), stream])
    );

    const now = new Date().toISOString();
    const rows = creators.map((creator) => {
      const stream = byLogin.get(String(creator.login).toLowerCase());
      return {
        ...creator,
        live: Boolean(stream),
        live_title: stream?.title || "",
        live_game: stream?.game_name || "",
        viewers: Number(stream?.viewer_count) || 0,
        started_at: stream?.started_at || "",
        thumbnail_url: stream?.thumbnail_url || "",
        last_checked_at: now,
      };
    });

    const changed = rows
      .filter((row) => {
        const before = creators.find((creator) => creator.id === row.id) || {};
        return (
          Boolean(before.live) !== row.live ||
          before.live_title !== row.live_title ||
          before.viewers !== row.viewers ||
          before.thumbnail_url !== row.thumbnail_url
        );
      })
      .map((row) => ({
        id: row.id,
        live: row.live,
        live_title: row.live_title,
        live_game: row.live_game,
        viewers: row.viewers,
        started_at: row.started_at,
        thumbnail_url: row.thumbnail_url,
        last_checked_at: row.last_checked_at,
      }));

    if (changed.length) await base44.entities.TwitchCreator.bulkUpdate(changed);

    return { connected: true, creators: rows };
  });

export const addCreator = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      input: z.string().min(1).max(300),
      campaign_id: z.string().max(120).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const login = normalizeLogin(data.input);
    if (!login) throw new Error("Enter a Twitch name or a link to the channel.");

    const client = await readyClient(context);
    const found = await client.call(`users?login=${encodeURIComponent(login)}`);
    const user = found.data?.[0];
    if (!user) throw new Error(`Twitch has no channel called ${login}.`);

    const base44 = context.getBase44();
    const existing = await base44.entities.TwitchCreator.filter({ login: user.login });
    const row = {
      login: user.login,
      twitch_id: user.id,
      display_name: user.display_name || user.login,
      avatar_url: user.profile_image_url || "",
      profile_url: `https://www.twitch.tv/${user.login}`,
      campaign_id: data.campaign_id || "",
    };

    if (existing[0]) return base44.entities.TwitchCreator.update(existing[0].id, row);
    return base44.entities.TwitchCreator.create(row);
  });

export const removeCreator = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.TwitchCreator.delete(data.id);
    return { ok: true };
  });

// Any creator's clips, not just your own channel.
export const creatorClips = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const creator = await base44.entities.TwitchCreator.get(data.id).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!creator) throw new Error("That creator is no longer on the list.");
    if (!creator.twitch_id) throw new Error("Twitch has no id stored for that creator. Add them again.");

    const client = await readyClient(context);
    const clips = await client.call(
      `clips?broadcaster_id=${encodeURIComponent(creator.twitch_id)}&first=12`
    );
    return { clips: (clips.data || []).map(clipRow), creator };
  });

const TWITCH_GQL = "https://gql.twitch.tv/gql";
// The public web client id the clip page itself uses. No secret, no user token.
const TWITCH_WEB_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

function twitchSeconds(value) {
  const text = String(value || "");
  const hours = Number((text.match(/(\d+)h/) || [])[1] || 0);
  const minutes = Number((text.match(/(\d+)m/) || [])[1] || 0);
  const seconds = Number((text.match(/([\d.]+)s/) || [])[1] || 0);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 100) / 100;
}

// Twitch has no Helix endpoint for a clip's file, so ask the same place the clip
// page asks. This works for anyone's clip, not just the connected account's.
async function clipFileUrl(clipId) {
  try {
    const response = await fetch(TWITCH_GQL, {
      method: "POST",
      headers: { "Client-Id": TWITCH_WEB_CLIENT_ID, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query { clip(slug: "${clipId}") { videoQualities { sourceURL } } }`,
      }),
    });
    if (response.ok) {
      const payload = await response.json();
      const url = payload?.data?.clip?.videoQualities?.[0]?.sourceURL;
      if (url) return url;
    }
  } catch {
    // fall through to the clip page
  }

  const page = await fetch(`https://clips.twitch.tv/${clipId}`);
  const html = page.ok ? await page.text() : "";
  const match = html.match(/"sourceURL":"(https:[^"]+?\.mp4)"/);
  if (match) return match[1].replace(/\\u002F/g, "/").replace(/\\\//g, "/");
  throw new Error(
    "Twitch would not hand over the clip file. Download it from Twitch and upload it as a video instead."
  );
}

export const importTwitchClip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ clipId: z.string().regex(/^[A-Za-z0-9_-]{4,120}$/) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const client = await readyClient(context);

    const found = await client.call(`clips?id=${data.clipId}`);
    const clip = found.data?.[0];
    if (!clip) throw new Error("Twitch no longer has that clip.");

    const duration = twitchSeconds(clip.duration);
    if (!duration) throw new Error("Twitch did not report how long that clip is.");

    const fileUrl = await clipFileUrl(clip.id);
    const download = await fetch(fileUrl);
    if (!download.ok) throw new Error("The clip file could not be downloaded from Twitch.");
    const bytes = await download.arrayBuffer();
    if (!bytes.byteLength) throw new Error("Twitch sent an empty clip file.");

    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
      file: new File([bytes], `${clip.id}.mp4`, { type: "video/mp4" }),
    });

    // Captions come from the clip's own audio, so nothing is invented.
    const service = base44.asServiceRole;
    const { signed_url } = await service.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 1800,
    });
    let transcript = "";
    try {
      transcript = await service.integrations.Core.TranscribeAudio({ audio_url: signed_url });
    } catch {
      transcript = "";
    }

    const text = String(transcript || "").trim();
    const spoken = text.split(/\s+/).filter(Boolean).length;
    const lines = timedLines(text, duration);
    const contentType = readContentType(spoken, duration);
    const layout = recommendTemplates(contentType)[0].id;
    const credit = `Source: ${clip.broadcaster_name || "the creator"}`;

    const job = await base44.entities.ClipJob.create({
      title: clip.title || "Twitch clip",
      channel: clip.broadcaster_name || "",
      source_type: "link",
      source_url: clip.url || "",
      file_uri,
      duration,
      transcript: text.slice(0, 90000),
      timed_lines: lines,
      word_count: spoken,
      clip_count: 1,
      clip_length: Math.round(duration),
      content_type: contentType,
      language: "auto",
      audio_level: "original",
      voice: "punchy",
      layout,
      captions: "spoken",
      hook: "english",
      status: "ready",
      clip_total: 1,
      stage_note: "Twitch clip stored and captioned. Pick a template and render.",
    });

    const created = await base44.entities.Clip.create({
      job_id: job.id,
      rank: 1,
      title: String(clip.title || "Twitch clip").slice(0, 120),
      first_line: lines[0]?.text || "",
      start: 0,
      end: duration,
      duration,
      score: 8,
      reason: `Pulled from Twitch · ${Number(clip.view_count) || 0} views there.`,
      post_caption: `${clip.title || "Twitch clip"}\n\n${credit}`,
      hook: String(clip.title || "").slice(0, 45),
      hook_options: [],
      layout,
      cam: "br",
      zoom: 1,
      bg: "#FED50C",
      audio_level: "original",
      captions_mode: "spoken",
      words: wordsFor(lines, 0, duration),
      caption_lines: lines.map((line) => line.text),
      keep: true,
      render_version: 0,
    });

    return {
      jobId: job.id,
      clipId: created.id,
      title: clip.title || "Twitch clip",
      layout,
    };
  });