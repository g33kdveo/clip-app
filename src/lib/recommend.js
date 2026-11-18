import { TEMPLATE_STYLE } from "@/lib/design";

// The playbook: what short-form clips of each kind actually get watched.
// Ordered best first. This is the baseline the recommendations start from;
// once real view data is flowing in, those numbers are meant to override it.
const PLAYBOOK = {
  action: ["reaction", "pop", "comic"],
  talking: ["fill", "band", "comic"],
  no_talking: ["cinema", "letterbox", "split"],
  podcast: ["podcast", "glow", "italic"],
  interview: ["guest", "cinema", "split"],
  auto: ["band", "fill", "pop"],
};

const WHY = {
  reaction: "The face is the clip, so the reaction cam keeps it on screen while the moment plays out.",
  pop: "One word on a colour block. Reads instantly with the sound off, which is how most of the feed meets a clip.",
  comic: "Each word gets its own block, so a shouted line lands like a punchline.",
  band: "The headline stays up top the whole clip, so the reason to stop is always on screen.",
  fill: "Nothing competes with the footage, which is what keeps a reaction watchable.",
  stacked: "A title card above the picture separates the headline from a busy frame.",
  cinema: "Wide frame and a thin headline, so a visual beat can breathe.",
  letterbox: "Clean frame with plain captions. Safest when the picture carries the moment.",
  split: "Wide shot on top, a close crop under it. Two angles in one frame.",
  podcast: "Warm window with italic lines: reads as a conversation, not a performance.",
  glow: "Warm soft framing stops a long conversation feeling flat.",
  italic: "A few words at a time, calmer pacing for talk-heavy moments.",
  guest: "The guest is framed like a call, which is what interview clips already look like.",
  streamer: "Gameplay with a face cam card, the shape stream clips are already known for.",
  neon: "Glowing captions light up word by word, which holds the eye on fast beats.",
  cutout: "Big words across the middle name the subject while the face stays readable.",
};

export function recommendTemplates(contentType = "auto") {
  const ids = PLAYBOOK[contentType] || PLAYBOOK.auto;
  return ids
    .filter((id) => TEMPLATE_STYLE[id])
    .map((id, index) => ({
      ...TEMPLATE_STYLE[id],
      rank: index + 1,
      reason: WHY[id] || TEMPLATE_STYLE[id].note,
    }));
}

export function recommendedIds(contentType = "auto") {
  return recommendTemplates(contentType).map((template) => template.id);
}

// A cheap read on what kind of moment a clip is, from how much is actually said.
export function readContentType(words, duration) {
  const total = Number(duration) || 0;
  if (!total) return "auto";
  return Number(words) / total < 1.2 ? "action" : "talking";
}