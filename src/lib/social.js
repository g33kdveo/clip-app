export const PLATFORMS = [
  {
    id: "youtube",
    heading: "Long-form",
    label: "YouTube",
    attribution: "YouTube",
    blurb: "Thumbnail and title carry the click.",
    layout: "wide",
    placeholder: "channel handle or channel link",
  },
  {
    id: "instagram",
    heading: "Instagram",
    label: "Instagram",
    blurb: "A square grid, the way the profile shows it.",
    layout: "square",
    placeholder: "username or profile link",
  },
  {
    id: "tiktok",
    heading: "TikTok",
    label: "TikTok",
    blurb: "Vertical cards, views in the corner.",
    layout: "tall",
    placeholder: "username or profile link",
  },
  {
    id: "x",
    heading: "X",
    label: "X",
    blurb: "A timeline, newest first.",
    layout: "timeline",
    placeholder: "username or profile link",
  },
];

export const PLATFORM = PLATFORMS.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});

export function formatViews(value) {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n < 1000) return String(n);
  if (n < 1000000) {
    const k = n / 1000;
    return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}K`;
  }
  if (n < 1000000000) {
    const m = n / 1000000;
    return `${m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)}M`;
  }
  return `${(n / 1000000000).toFixed(1).replace(/\.0$/, "")}B`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}