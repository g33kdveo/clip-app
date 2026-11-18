// Moment selection.
//
// The old pass asked one model for N clips and trusted whatever came back: bad
// boundaries, mid-sentence starts, two picks on top of each other, everything
// piled at the start of the video. This one separates the two jobs.
//
//   1. The model proposes candidates with separate scores (hook, standalone,
//      payoff, energy) and is told to spread them across the whole source.
//   2. Code does the deciding: snap every boundary onto a real sentence edge,
//      clamp the length, drop overlaps, drop near-duplicates, spread the picks
//      across the timeline, and only then take the best ones. If it still comes
//      up short it asks a second time for the gaps it skipped.

import { CLIP_DOCTRINE } from "@/lib/clip-knowledge";
import { TEMPLATE_STYLE } from "@/lib/design";

const CONTENT_GUIDE = {
  auto: "Mix the best of what the transcript has: reactions, banter, strong opinions, impressive beats.",
  talking:
    "Prefer moments where the speaker makes a point, tells a story, or reacts out loud. Skip dead air.",
  action:
    "Prefer the loudest, highest-energy beats: shouting, fast reactions, a big play and the line right after it.",
  no_talking:
    "Prefer the stretches with the fewest words, where the gaps in the transcript leave room for the action itself. Keep any short line that lands.",
  podcast:
    "Prefer back-and-forth exchanges, disagreements, hot takes and stories between hosts.",
  interview:
    "Prefer question-and-answer exchanges, where a single answer stands on its own.",
};

const VOICE_GUIDE = {
  punchy: "short and blunt, no wasted words.",
  hype: "loud and all in, big energy.",
  calm: "understated and even, no hype.",
  analytical: "concrete and specific, like a breakdown.",
};

const LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  tr: "Turkish",
  ru: "Russian",
  hi: "Hindi",
  id: "Indonesian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
};

const MIN_GAP = 4; // seconds of clean air between two clips
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const round2 = (value) => Math.round(value * 100) / 100;

// Move a boundary onto the sentence it falls inside, so nothing starts or ends
// in the middle of a thought.
function snapStart(lines, t) {
  for (const line of lines) {
    if (t >= line.t && t <= line.e) return line.t;
    if (line.t > t) return line.t;
  }
  return t;
}

function snapEnd(lines, t) {
  for (const line of lines) {
    if (t >= line.t && t <= line.e) return line.e;
    if (line.t > t) return line.e;
  }
  return t;
}

function firstLineIn(lines, start, end) {
  const hit = lines.find((line) => line.t >= start - 0.5 && line.t <= end);
  return hit ? hit.text : "";
}

function bucketOf(start, span) {
  return Math.floor(start / Math.max(60, span));
}

function overlap(a, b) {
  return a.start < b.end + MIN_GAP && b.start < a.end + MIN_GAP;
}

function similar(a, b) {
  const words = (text) => new Set(String(text || "").toLowerCase().match(/[a-z']+/g) || []);
  const one = words(a.first_line || a.title);
  const two = words(b.first_line || b.title);
  if (!one.size || !two.size) return false;
  let shared = 0;
  one.forEach((word) => {
    if (two.has(word)) shared += 1;
  });
  return shared / Math.min(one.size, two.size) > 0.6;
}

function score(candidate) {
  const hook = clamp(Number(candidate.hook_score) || 5, 1, 10);
  const alone = clamp(Number(candidate.standalone_score) || 5, 1, 10);
  const payoff = clamp(Number(candidate.payoff_score) || 5, 1, 10);
  const energy = clamp(Number(candidate.energy_score) || 5, 1, 10);
  return round2(hook * 0.34 + alone * 0.3 + payoff * 0.24 + energy * 0.12);
}

function normalise(candidate, lines, bounds) {
  const total = bounds.total || 1;
  const minLen = bounds.minLen;
  const maxLen = bounds.maxLen;

  let start = clamp(Number(candidate.start) || 0, 0, total);
  let end = clamp(Number(candidate.end) || 0, 0, total);
  if (end <= start) return null;

  start = snapStart(lines, start);
  end = snapEnd(lines, end);

  // too short: grow onto the next sentences until it clears the floor
  if (end - start < minLen) {
    const next = lines.find((line) => line.t >= end - 0.1 && line.e > end);
    if (next) end = next.e;
  }
  if (end - start > maxLen) end = snapEnd(lines, start + maxLen);
  if (end - start < 15) return null;

  return {
    start: round2(start),
    end: round2(end),
    score: score(candidate),
    title: String(candidate.title || "").slice(0, 120) || "Untitled moment",
    reason: String(candidate.reason || "").slice(0, 400),
    first_line: String(candidate.first_line || firstLineIn(lines, start, end)).slice(0, 400),
    hook_options: (candidate.hook_options || [])
      .map((option) => String(option || "").slice(0, 60))
      .filter(Boolean)
      .slice(0, 3),
    post_caption: String(candidate.post_caption || "").slice(0, 1200),
  };
}

// Greedy pick over the ranked candidates, refusing overlaps, near-duplicates and
// crowding: no more than two picks from the same slice of the timeline until the
// request can't be filled any other way.
function select(candidates, want, span) {
  const ranked = candidates.slice().sort((a, b) => b.score - a.score);
  const chosen = [];
  const perBucket = new Map();

  const bucketCap = want <= 3 ? 2 : 3;

  const take = (candidate, ignoreCap) => {
    if (chosen.some((other) => overlap(candidate, other))) return false;
    if (chosen.some((other) => similar(candidate, other))) return false;
    const bucket = bucketOf(candidate.start, span);
    if (!ignoreCap && (perBucket.get(bucket) || 0) >= bucketCap) return false;
    chosen.push(candidate);
    perBucket.set(bucket, (perBucket.get(bucket) || 0) + 1);
    return true;
  };

  for (const candidate of ranked) {
    if (chosen.length >= want) break;
    take(candidate, false);
  }
  // still short: allow a second pass that ignores the crowding rule
  if (chosen.length < want) {
    for (const candidate of ranked) {
      if (chosen.length >= want) break;
      if (chosen.includes(candidate)) continue;
      take(candidate, true);
    }
  }

  return chosen.sort((a, b) => a.start - b.start).slice(0, want);
}

function prompt({
  job,
  body,
  want,
  bounds,
  contentGuide,
  voiceGuide,
  languageLine,
  credit,
  gaps,
  templateBrief,
  headlineMax,
}) {
  const gapLine = gaps
    ? `Only look inside these stretches, and do not repeat anything already picked:\n${gaps
        .map((gap) => `- ${Math.round(gap.from)}s to ${Math.round(gap.to)}s`)
        .join("\n")}`
    : "Cover the whole video evenly. Do not put more than two picks inside the same ten minutes unless the source is short.";

  return `You are choosing short vertical clips from a stream VOD transcript. Be strict: it is better to return six postable moments than twelve mediocre ones.

Video: "${job.title}" by ${job.channel || "the creator"}.
Length: ${Math.round((bounds.total || 0) / 60)} minutes. Timestamps are seconds.

Transcript lines, formatted as [start-end] text:
${body}

Propose up to ${want} moments.

A moment qualifies only if all of these are true:
- Its first sentence is a hook on its own: a claim, a question, a surprising number, a conflict, a confession, or a story opening. Never mid-thought, never "so yeah anyway".
- Someone who never saw the stream understands it. If it needs earlier context to make sense, it is not a clip.
- It pays off: a laugh, a result, a reveal, a point landed. A clip that just trails off does not count.
- It runs about ${bounds.clipLength} seconds (hard limits ${bounds.minLen} and ${bounds.maxLen}).
- It contains one idea. Cut before the subject changes.

What to look for: ${contentGuide}

The look these clips are rendered in: ${templateBrief}

${CLIP_DOCTRINE}

${job.focus ? `The user asked for this specifically, follow it closely: "${job.focus}"` : ""}
Write the headline and post caption ${voiceGuide}${languageLine}

${gapLine}

Score each moment on four separate scales, 1-10, and be honest. A 5 means "fine, not posting it".
- hook_score: how hard the first line grabs.
- standalone_score: how well it makes sense with zero context.
- payoff_score: how satisfying the ending is.
- energy_score: how much happens in it.

Reject these outright: intros, sponsor reads, countdowns, sub-only thank-yous, gameplay with nothing said, and any moment whose best part is a single word.

For each moment return:
- title: at most 60 characters, curiosity not clickbait
- start and end: seconds, matching the transcript timing
- hook_score, standalone_score, payoff_score, energy_score
- reason: one sentence on why this one works
- first_line: the exact first spoken sentence of the moment
- hook_options: exactly three on-screen headlines, each at most ${headlineMax} characters
- post_caption: 1-2 lines for the post, then 3-5 hashtags, ending with the exact credit line "${credit}"`;
}

const MOMENT_SCHEMA = {
  type: "object",
  properties: {
    moments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          start: { type: "number" },
          end: { type: "number" },
          hook_score: { type: "number" },
          standalone_score: { type: "number" },
          payoff_score: { type: "number" },
          energy_score: { type: "number" },
          reason: { type: "string" },
          first_line: { type: "string" },
          hook_options: { type: "array", items: { type: "string" } },
          post_caption: { type: "string" },
        },
        required: ["title", "start", "end", "hook_score", "standalone_score", "payoff_score", "post_caption"],
      },
    },
  },
  required: ["moments"],
};

export async function pickMoments({ invoke, job, lines, kept, credit }) {
  if (!lines.length) throw new Error("No timed transcript to pick from.");

  const clipLength = clamp(Number(job.clip_length) || 45, 20, 120);
  const bounds = {
    total: Number(job.duration) || lines[lines.length - 1].e || 0,
    clipLength,
    minLen: Math.max(15, clipLength - 15),
    maxLen: clipLength + 25,
  };
  const want = clamp(Number(job.clip_count) || 5, 1, 15);
  const lead = clamp(Number(job.lead_in) || 0, 0, 10);

  const body = kept.map((line) => `[${Math.round(line.t)}-${Math.round(line.e)}] ${line.text}`).join("\n");
  const contentGuide = CONTENT_GUIDE[job.content_type] || CONTENT_GUIDE.auto;
  const voiceGuide = VOICE_GUIDE[job.voice] || VOICE_GUIDE.punchy;
  // The template the clips are rendered in decides how much headline the frame can hold.
  const template = TEMPLATE_STYLE[job.layout] || TEMPLATE_STYLE.fill;
  const headlineMax = job.hook === "none" ? 45 : template.headlineMax;
  const templateBrief =
    job.hook === "none"
      ? `"${template.name}". ${template.note} No headline is drawn on this look, so the first spoken line has to carry the whole hook.`
      : `"${template.name}". ${template.note} The headline sits on screen, so it has to land at a glance and stay under ${headlineMax} characters.`;
  const languageName = LANGUAGE_NAMES[job.language] || "";
  const languageLine =
    job.language && job.language !== "auto" && languageName
      ? ` The audio is in ${languageName}: keep the quoted wording as spoken, headlines in English.`
      : "";

  const run = async (askFor, gaps) => {
    const result = await invoke({
      prompt: prompt({
        job,
        body,
        want: askFor,
        bounds,
        contentGuide,
        voiceGuide,
        languageLine,
        credit,
        gaps,
        templateBrief,
        headlineMax,
      }),
      response_json_schema: MOMENT_SCHEMA,
    });
    return (result?.moments || [])
      .map((candidate) => normalise(candidate, lines, bounds))
      .filter(Boolean);
  };

  // ask for more than needed: the strict filtering will throw plenty away
  let candidates = await run(Math.min(want * 2, 24), null);
  let chosen = select(candidates, want, bounds.total);

  if (chosen.length < want) {
    const gaps = [];
    const edges = [0, ...chosen.map((clip) => clip.start), ...chosen.map((clip) => clip.end), bounds.total]
      .sort((a, b) => a - b);
    for (let i = 0; i < edges.length - 1; i += 1) {
      if (edges[i + 1] - edges[i] > 90) gaps.push({ from: edges[i], to: edges[i + 1] });
    }
    if (gaps.length) {
      const extra = await run(Math.min((want - chosen.length) * 2, 12), gaps.slice(0, 8));
      candidates = candidates.concat(extra);
      chosen = select(candidates, want, bounds.total);
    }
  }

  if (!chosen.length) throw new Error("No postable moments came back from this transcript.");

  return chosen.map((moment, index) => {
    const start = Math.max(0, moment.start - lead);
    return {
      ...moment,
      rank: index + 1,
      start: round2(start),
      end: round2(moment.end),
    };
  });
}