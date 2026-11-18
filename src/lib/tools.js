import {
  Image as ImageIcon,
  Shapes,
  Mic,
  Lightbulb,
  Scissors,
  Library,
  FileVideo,
} from "lucide-react";

export const TOOL_TINT = {
  blue: "bg-[#EEF3FF] text-[#2962FF]",
  purple: "bg-[#F4EEFF] text-[#6D28D9]",
  green: "bg-[#EAF7EF] text-[#137A45]",
  yellow: "bg-[#FFF6D9] text-[#8A6A00]",
  black: "bg-black text-white",
  gray: "bg-black/[0.05] text-black/60",
};

export const TOOLS = [
  {
    id: "image",
    name: "AI Image Generator",
    blurb: "Generate high quality images from a prompt in seconds.",
    to: "/tools/image",
    Icon: ImageIcon,
    tint: "blue",
    group: "Generate",
  },
  {
    id: "icons",
    name: "Icon Generator",
    blurb: "Four branded marks for your channel in one pass.",
    to: "/tools/icons",
    Icon: Shapes,
    tint: "purple",
    group: "Generate",
    badge: "New",
  },
  {
    id: "voice",
    name: "AI Voiceover",
    blurb: "Turn a script into narration you can drop under a clip.",
    to: "/tools/voice",
    Icon: Mic,
    tint: "green",
    group: "Generate",
  },
  {
    id: "brainstorm",
    name: "AI Brainstormer",
    blurb: "Clip ideas, hooks and opening lines for your niche.",
    to: "/tools/brainstorm",
    Icon: Lightbulb,
    tint: "yellow",
    group: "Plan",
  },
  {
    id: "import",
    name: "Video import",
    blurb: "Bring a video you own into a clip job, or save it to your computer.",
    to: "/tools/import",
    Icon: FileVideo,
    tint: "black",
    group: "Clip",
    badge: "New",
  },
  {
    id: "new",
    name: "New clip job",
    blurb: "Drop a source and let the picker find the postable moments.",
    to: "/",
    Icon: Scissors,
    tint: "black",
    group: "Clip",
  },
  {
    id: "library",
    name: "Clip library",
    blurb: "Every job and clip you have made, in one place.",
    to: "/library",
    Icon: Library,
    tint: "gray",
    group: "Clip",
  },
];

export const STYLE_OPTIONS = [
  { value: "none", label: "Auto" },
  { value: "photo", label: "Photo" },
  { value: "cinematic", label: "Cinematic" },
  { value: "illustration", label: "Illustration" },
  { value: "three_d", label: "3D" },
  { value: "anime", label: "Anime" },
  { value: "product", label: "Product" },
];

export const RATIO_OPTIONS = [
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
];

export const VIBE_OPTIONS = [
  { value: "bold", label: "Bold" },
  { value: "playful", label: "Playful" },
  { value: "minimal", label: "Minimal" },
  { value: "retro", label: "Retro" },
  { value: "premium", label: "Premium" },
];

export const VOICE_OPTIONS = [
  { value: "river", label: "River · calm" },
  { value: "honey", label: "Honey · warm" },
  { value: "sunny", label: "Sunny · bright" },
  { value: "storm", label: "Storm · formal" },
  { value: "spark", label: "Spark · quick" },
];

export const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "reels", label: "Reels" },
  { value: "shorts", label: "Shorts" },
  { value: "x", label: "X" },
];

export const TONE_OPTIONS = [
  { value: "punchy", label: "Punchy" },
  { value: "funny", label: "Funny" },
  { value: "hype", label: "Hype" },
  { value: "calm", label: "Calm" },
  { value: "analytical", label: "Analytical" },
];