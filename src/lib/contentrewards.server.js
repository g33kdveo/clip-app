import { secrets } from "base44:runtime";

const BASE = "https://api.contentrewards.com/v1";
const API_VERSION = "2026-10-01";

const PLATFORMS = ["youtube", "instagram", "tiktok", "x"];

const PLATFORM_ALIASES = { twitter: "x", youtube_shorts: "youtube", instagram_reels: "instagram" };

const CAMPAIGN_STATUS = {
  active: "live",
  scheduled: "live",
  paused: "paused",
  archived: "ended",
  draft: "draft",
};

const SUBMISSION_STATUS = {
  approved: "approved",
  paid: "paid",
  rejected: "rejected",
  declined: "rejected",
};

export function contentRewardsKey() {
  return secrets.get("CONTENT_REWARDS_API_KEY");
}

function messageFor(code, status, detail) {
  switch (code) {
    case "invalid_api_key":
      return "Content Rewards rejected the key. Create a fresh one in Settings → Developers and update CONTENT_REWARDS_API_KEY.";
    case "insufficient_scope":
      return "This key can't read campaigns and submissions. It needs the Campaigns and Submissions read scopes.";
    case "permission_denied":
      return "This key isn't allowed to read that data. Check the scopes on the key.";
    case "rate_limited":
      return "Content Rewards is rate limiting requests. Try the sync again in a minute.";
    case "service_unavailable":
      return "Content Rewards is briefly unavailable. Try again in a minute.";
    default:
      return detail || `Content Rewards returned ${status}.`;
  }
}

async function request(path, key, params = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(name, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${key}`,
      "api-version": API_VERSION,
      accept: "application/json",
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const problem = new Error(messageFor(body?.code, response.status, body?.detail));
    problem.status = response.status;
    problem.code = body?.code;
    throw problem;
  }
  return body;
}

async function readEveryPage(path, key) {
  const items = [];
  let cursor;
  for (let page = 0; page < 5; page += 1) {
    const body = await request(path, key, { limit: 100, cursor });
    if (Array.isArray(body?.data)) items.push(...body.data);
    if (!body?.has_more || !body?.next_cursor) break;
    cursor = body.next_cursor;
  }
  return items;
}

// The clipper side of the API: the campaigns this account joined.
// If that surface isn't open to the key, fall back to the documented list.
export async function fetchMyCampaigns(key) {
  try {
    return await readEveryPage("/me/campaigns", key);
  } catch (problem) {
    if (problem.status !== 404) throw problem;
    return readEveryPage("/campaigns", key);
  }
}

export async function fetchMySubmissions(key) {
  try {
    return await readEveryPage("/me/submissions", key);
  } catch (problem) {
    if (problem.status === 404) return [];
    throw problem;
  }
}

function money(value) {
  return value && typeof value.value === "number" ? value.value / 100 : null;
}

function dateOnly(value) {
  if (!value) return "";
  const stamp = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(stamp) ? stamp.slice(0, 10) : "";
}

export function mapPlatform(value) {
  const name = String(value || "").toLowerCase();
  const resolved = PLATFORM_ALIASES[name] || name;
  return PLATFORMS.includes(resolved) ? resolved : null;
}

export function mapCampaign(raw) {
  const rows = Array.isArray(raw?.platforms) ? raw.platforms : [];
  const platforms = [...new Set(rows.map((row) => mapPlatform(row?.platform)).filter(Boolean))];
  const rates = rows.map((row) => money(row?.rate)).filter((value) => typeof value === "number");

  return {
    external_id: String(raw?.id || ""),
    name: String(raw?.name || "Untitled campaign").slice(0, 160),
    brand: String(raw?.brand_account_name || raw?.organization_name || "").slice(0, 160),
    brief: String(raw?.description || "").slice(0, 2000),
    platforms,
    rate_per_1k: rates.length ? Math.max(...rates) : 0,
    status: CAMPAIGN_STATUS[String(raw?.status || "").toLowerCase()] || "draft",
    starts_on: dateOnly(raw?.planned_launch_at || raw?.starts_at),
    ends_on: dateOnly(raw?.ends_at),
    source: "contentrewards",
  };
}

export function mapSubmission(raw) {
  const post = raw?.post || {};
  return {
    external_id: String(raw?.id || ""),
    campaign_external_id: String(
      typeof raw?.campaign === "string" ? raw.campaign : raw?.campaign?.id || ""
    ),
    platform: mapPlatform(post?.platform || raw?.platform),
    post_url: String(post?.url || post?.link || "").slice(0, 2000),
    title: String(post?.caption || post?.title || "").slice(0, 600),
    views: Math.max(0, Number(post?.views ?? raw?.views ?? 0) || 0),
    likes: Math.max(0, Number(post?.likes ?? raw?.likes ?? 0) || 0),
    status: SUBMISSION_STATUS[String(raw?.status || "").toLowerCase()] || "submitted",
    posted_at: dateOnly(post?.posted_at || raw?.created_at),
  };
}