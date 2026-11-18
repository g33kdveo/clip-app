export const YELLOW = "#FED50C";
export const MARK = "#FF9900";

// Real photography, cropped to 9:16 with face-aware cropping, chosen to match
// what each look is actually for. Used inside the template previews.
// The real 9:16 clip frames crayo.ai shows on its own site, used exactly as
// they are: each one already carries that look's captions, so the preview is
// the frame itself, not a mock-up of it.
const CR = (name) => `https://cdn-crayo.com/lp/public/features/home-clips/${name}.jpg`;

const SHOTS = {
  talker: CR("bold-italic"),
  presser: CR("dana-presser"),
  desk: CR("auto-musa-desk"),
  studio: CR("style-ich-hat"),
  hosts: CR("style-ich-real"),
  gaming: CR("auto-musa-talk"),
  cam: CR("auto-musa-talk"),
  shock: CR("bloom-title"),
  shockCam: CR("bloom-title"),
  warm: CR("neon-karaoke"),
  guest: CR("hook-title"),
  yell: CR("daniel-hero"),
  crowd: CR("style-ich-real"),
  boardroom: CR("auto-musa-talk"),
  duo: CR("style-ich-offer"),
  window: CR("source-episode"),
  neonPortrait: CR("auto-musa-pov"),
  mic: CR("bold-italic"),
};

// Every look the renderer can bake.
//   render    which frame layout drawTemplate builds
//   style     how the spoken words are drawn
//   hook      how the headline sits in the frame
//   captionY  where the spoken words sit, in canvas pixels of 1920
//   headlineMax  longest on-screen headline the look can hold
//   shot / camShot / sample  the preview inside the picker
export const TEMPLATES = [
  {
    id: "fill",
    name: "Full screen",
    note: "Fills the whole frame. The safe default for talking and reactions.",
    render: "fill",
    style: "default",
    hook: "plain",
    captionY: 1250,
    headlineMax: 45,
    shot: SHOTS.talker,
    sample: "they absolutely do",
  },
  {
    id: "band",
    name: "POV title band",
    note: "A solid band across the top holds the headline for the whole clip.",
    render: "band",
    style: "default",
    hook: "band",
    captionY: 1350,
    headlineMax: 45,
    shot: SHOTS.presser,
    sample: "why a million is a bad day",
  },
  {
    id: "stacked",
    name: "Stacked title card",
    note: "A colour card sits above the footage, so the headline is set apart from the picture.",
    render: "stacked",
    style: "default",
    hook: "band",
    captionY: 1520,
    headlineMax: 42,
    shot: SHOTS.desk,
    sample: "number six's brutal mixup",
  },
  {
    id: "italic",
    name: "Italic word focus",
    note: "A few words at a time, italic, mid frame. Editorial and calm.",
    render: "italic",
    style: "italic",
    hook: "plain",
    captionY: 1010,
    headlineMax: 30,
    shot: SHOTS.studio,
    sample: "feel the craving",
  },
  {
    id: "podcast",
    name: "Podcast italic",
    note: "Warm window on a blurred bed with italic lines underneath. For long talk.",
    render: "glow",
    style: "italic",
    hook: "plain",
    captionY: 1560,
    headlineMax: 40,
    shot: SHOTS.hosts,
    sample: "the truth about friday",
  },
  {
    id: "streamer",
    name: "Streamer",
    note: "Gameplay on top, your face cam in a card. Made for stream clips.",
    render: "streamer",
    style: "default",
    hook: "band",
    captionY: 1610,
    headlineMax: 32,
    shot: SHOTS.gaming,
    camShot: SHOTS.cam,
    sample: "one shot",
  },
  {
    id: "reaction",
    name: "Reaction cam",
    note: "Full frame with your face in a circle. For the moment your reaction is the clip.",
    render: "reaction",
    style: "default",
    hook: "plain",
    captionY: 1450,
    headlineMax: 22,
    shot: SHOTS.shock,
    camShot: SHOTS.shockCam,
    sample: "no way",
  },
  {
    id: "glow",
    name: "Soft glow conversation",
    note: "Blurred bed behind a rounded frame with a warm glow. Podcast look.",
    render: "glow",
    style: "default",
    hook: "plain",
    captionY: 1560,
    headlineMax: 40,
    shot: SHOTS.warm,
    sample: "a cab driver",
  },
  {
    id: "guest",
    name: "Guest window",
    note: "The guest sits in a window up top, captions on a solid panel below.",
    render: "guest",
    style: "clean",
    hook: "clean",
    captionY: 1690,
    headlineMax: 40,
    shot: SHOTS.guest,
    sample: "you're an oncologist",
  },
  {
    id: "pop",
    name: "Single word pop",
    note: "One word at a time on a colour block. Loud and fast.",
    render: "fill",
    style: "pop",
    hook: "plain",
    captionY: 1180,
    headlineMax: 18,
    shot: SHOTS.yell,
    sample: "wow",
  },
  {
    id: "comic",
    name: "Comic blocks",
    note: "Each word on its own block, the active one in your colour. Comic-book punch.",
    render: "fill",
    style: "comic",
    hook: "plain",
    captionY: 1300,
    headlineMax: 24,
    shot: SHOTS.crowd,
    sample: "boxing match",
  },
  {
    id: "cinema",
    name: "Cinematic glow",
    note: "Wide frame on black, warm light, headline in a thin cap line.",
    render: "cinema",
    style: "clean",
    hook: "clean",
    captionY: 1400,
    headlineMax: 45,
    shot: SHOTS.boardroom,
    sample: "much fewer",
  },
  {
    id: "split",
    name: "Split",
    note: "Wide shot on top, a close crop underneath.",
    render: "split",
    style: "default",
    hook: "plain",
    captionY: 1620,
    headlineMax: 40,
    shot: SHOTS.duo,
    sample: "he's talking",
  },
  {
    id: "letterbox",
    name: "Letterbox",
    note: "Clean 16:9 frame on black with plain captions.",
    render: "letterbox",
    style: "clean",
    hook: "clean",
    captionY: 1500,
    headlineMax: 45,
    fit: "contain",
    shot: SHOTS.window,
    sample: "the last light",
  },
  {
    id: "neon",
    name: "Neon glow karaoke",
    note: "Glowing captions that light up word by word.",
    render: "fill",
    style: "neon",
    hook: "plain",
    captionY: 1250,
    headlineMax: 22,
    shot: SHOTS.neonPortrait,
    sample: "oncologist",
  },
  {
    id: "cutout",
    name: "Name cutouts",
    note: "Big outlined words across the middle of the frame, over the subject.",
    render: "fill",
    style: "default",
    hook: "none",
    captionY: 980,
    headlineMax: 24,
    shot: SHOTS.mic,
    sample: "obese feel",
  },
];

export const LAYOUTS = TEMPLATES;

export const LAYOUT_IDS = TEMPLATES.map((template) => template.id);

export const LAYOUT_LABEL = TEMPLATES.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {});

export const TEMPLATE_STYLE = TEMPLATES.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }),
  {}
);

export const CLIP_LENGTHS = [
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
];

export const CLIP_COUNTS = [3, 5, 8, 10, 15];

export const LANGUAGES = [
  { value: "auto", label: "Auto detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "sv", label: "Swedish" },
  { value: "tr", label: "Turkish" },
  { value: "ru", label: "Russian" },
  { value: "hi", label: "Hindi" },
  { value: "id", label: "Indonesian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
];

export const CONTENT_TYPES = [
  { value: "auto", label: "Auto detect" },
  { value: "talking", label: "Talking" },
  { value: "action", label: "Action" },
  { value: "no_talking", label: "No talking" },
  { value: "podcast", label: "Podcast" },
  { value: "interview", label: "Interview" },
];

export const LEAD_INS = [
  { value: 0, label: "Off" },
  { value: 2, label: "2s" },
  { value: 4, label: "4s" },
];

export const AUDIO_LEVELS = [
  { value: "original", label: "Original" },
  { value: "boosted", label: "Louder" },
  { value: "soft", label: "Softer" },
];

export const VOICES = [
  { value: "punchy", label: "Punchy" },
  { value: "hype", label: "Hype" },
  { value: "calm", label: "Calm" },
  { value: "analytical", label: "Analytical" },
];

export const CAM_POSITIONS = [
  { value: "br", label: "Bottom right" },
  { value: "bl", label: "Bottom left" },
  { value: "tr", label: "Top right" },
  { value: "tl", label: "Top left" },
  { value: "none", label: "No cam card" },
];

export const CAPTION_MODES = [
  { value: "spoken", label: "Spoken words" },
  { value: "english", label: "English" },
  { value: "none", label: "No captions" },
];

export const HOOK_MODES = [
  { value: "english", label: "English" },
  { value: "spoken", label: "Spoken language" },
  { value: "none", label: "No hook" },
];

export const BG_SWATCHES = ["#FED50C", "#FF9900", "#0A0A0A", "#FFFFFF", "#E8E4DA"];

export const FORM_DEFAULTS = {
  clipCount: 8,
  clipLength: 45,
  language: "auto",
  layout: "fill",
  captions: "spoken",
  hook: "english",
  contentType: "auto",
  leadIn: 0,
  focus: "",
  audioLevel: "original",
  voice: "punchy",
};

export function clipEstimate(duration, clipLength) {
  const minutes = Math.round((Number(duration) || 0) / 60);
  if (!minutes) return "Paste a link or upload a file and we'll work out how many clips fit.";
  const fits = Math.max(1, Math.floor((Number(duration) || 0) / (Number(clipLength) || 45)));
  return `${minutes} minute${minutes === 1 ? "" : "s"} of footage allows about ${fits} clip${
    fits === 1 ? "" : "s"
  } at ${clipLength} seconds each.`;
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export const CONSENT_LINE =
  "Clip only videos you own, or ones whose creator has said yes in writing.";