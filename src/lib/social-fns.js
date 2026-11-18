import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { lookUp } from "@/lib/lookup.server";

const PLATFORMS = ["youtube", "instagram", "tiktok", "x"];

// Accepts a bare username or a pasted profile link.
function cleanHandle(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?/i, "")
    .replace(
      /^(instagram\.com|tiktok\.com|twitter\.com|x\.com|youtube\.com|m\.youtube\.com)\//i,
      ""
    );
  const path = raw.split(/[?#]/)[0];
  const parts = path.split("/").filter(Boolean);
  return String(parts[parts.length - 1] || path)
    .replace(/^@/, "")
    .trim();
}

// A read that fails is reported, never saved as an empty profile: a hollow row
// with zero followers looks like the account is broken rather than unreadable.
async function readProfile(base44, platform, handle) {
  const token = platform === "youtube" ? await youtubeToken(base44) : "";
  return lookUp({ platform, handle, token });
}

async function youtubeToken(base44) {
  try {
    const connection = await base44.asServiceRole.connectors.getConnection("youtube");
    return connection?.accessToken || "";
  } catch {
    return "";
  }
}

async function store(base44, platform, profile) {
  const samePlatform = await base44.entities.SocialAccount.filter({ platform });
  const existing = samePlatform.filter(
    (account) => String(account.handle).toLowerCase() === String(profile.handle).toLowerCase()
  );

  const row = {
    platform,
    handle: profile.handle,
    display_name: profile.display_name || "",
    avatar_url: profile.avatar_url || "",
    profile_url: profile.profile_url || "",
    bio: profile.bio || "",
    followers: Number(profile.followers) || 0,
    posts_count: Number(profile.posts_count) || 0,
    note: profile.note || "",
    synced_at: new Date().toISOString(),
  };

  const account = existing.length
    ? await base44.entities.SocialAccount.update(existing[0].id, row)
    : await base44.entities.SocialAccount.create(row);

  await base44.entities.SocialPost.deleteMany({ account_id: account.id });

  const posts = (profile.posts || []).filter((post) => post.title || post.thumbnail_url);
  if (posts.length) {
    await base44.entities.SocialPost.bulkCreate(
      posts.map((post) => ({
        account_id: account.id,
        platform,
        title: String(post.title || "").slice(0, 600),
        url: post.url || "",
        thumbnail_url: post.thumbnail_url || "",
        views: Number(post.views) || 0,
        likes: Number(post.likes) || 0,
        comments: Number(post.comments) || 0,
        posted_at: post.posted_at || new Date().toISOString().slice(0, 10),
        source: "synced",
      }))
    );
  }

  return account;
}

export const loadOverview = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const accounts = await base44.entities.SocialAccount.list("-created_date", 60);
    return { accounts };
  });

export const loadPlatform = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ platform: z.enum(PLATFORMS) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const accounts = await base44.entities.SocialAccount.filter({ platform: data.platform });
    const ids = accounts.map((account) => account.id);
    const posts = ids.length
      ? await base44.entities.SocialPost.filter({ account_id: { $in: ids } })
      : [];
    return { accounts, posts };
  });

export const lookupAccount = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      platform: z.enum(PLATFORMS),
      handle: z.string().min(1).max(300),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const handle = cleanHandle(data.handle);
    if (!handle) throw new Error("Type the account's username.");

    const profile = await readProfile(base44, data.platform, handle);
    const account = await store(base44, data.platform, profile);

    return {
      account,
      count: (profile.posts || []).length,
      note: profile.note || "",
    };
  });

export const refreshAccount = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const account = await base44.entities.SocialAccount.get(data.id);
    if (!account) throw new Error("That account is no longer tracked.");

    const profile = await readProfile(base44, account.platform, account.handle);
    const saved = await store(base44, account.platform, profile);
    return { account: saved, note: profile.note || "" };
  });

export const removeAccount = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    await base44.entities.SocialPost.deleteMany({ account_id: data.id });
    await base44.entities.SocialAccount.delete(data.id);
    return { ok: true };
  });