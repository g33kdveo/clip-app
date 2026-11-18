// Reads a public profile and the posts it shows, straight from the platform.
// Instagram, TikTok and X refuse a plain server request, so they are read
// through a public page reader that renders them server-side. Only what is
// visible without a login is read; when something is hidden the lookup says so
// in `note` instead of failing.

import { readChannel } from "@/lib/youtube.server";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BROWSER_HEADERS = {
  "User-Agent": UA,
  "Accept-Language": "en-US,en;q=0.9",
};

// Public reader that fetches a page and hands back its text. It is the way past
// the login walls and bot checks on the three closed platforms.
async function reader(target) {
  try {
    const response = await fetch(`https://r.jina.ai/${target}`, {
      headers: { "User-Agent": UA, Accept: "text/plain" },
    });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}

// "686M" / "8,649" / "112.4K" → a number.
function count(value) {
  const raw = String(value || "").replace(/,/g, "").trim().toUpperCase();
  const hit = raw.match(/^([\d.]+)\s*([KMB])?$/);
  if (!hit) return 0;
  const mult = hit[2] === "B" ? 1e9 : hit[2] === "M" ? 1e6 : hit[2] === "K" ? 1e3 : 1;
  return Math.round(Number(hit[1]) * mult);
}

function clean(value, limit = 300) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

async function instagram(handle) {
  // The embed page is the one view Instagram serves without a login.
  const page = await reader(`https://www.instagram.com/${handle}/embed/`);
  const followers = page.match(/([\d.,]+[KMB]?)\s+followers/i);
  if (!followers) {
    throw new Error(
      "Instagram put a check in front of that profile this time. Try again in a moment."
    );
  }

  const name = page.match(
    /\[([^\]]+)\]\(https:\/\/www\.instagram\.com\/[^)]*\)\n\n[\d.,]+[KMB]?\s+followers/i
  );
  const avatar = page.match(/!\[Image \d+: [^\]]*?profile picture\]\((https?:\/\/[^)\s]+)\)/);
  const postsTotal = page.match(/([\d.,]+[KMB]?)\s+posts\b/i);

  const posts = [];
  for (const hit of page.matchAll(/\[!\[Image \d+: ([^\]]*?)\]\((https?:\/\/[^)\s]+)\)\]\(/g)) {
    const label = clean(hit[1]);
    if (!hit[2].includes("cdninstagram") || /profile picture$/i.test(label)) continue;
    posts.push({
      title: label || "Instagram post",
      url: "",
      thumbnail_url: hit[2],
      views: 0,
      likes: 0,
      comments: 0,
      posted_at: "",
    });
  }

  return {
    handle,
    display_name: clean(name?.[1], 80),
    avatar_url: avatar?.[1] || "",
    profile_url: `https://www.instagram.com/${handle}/`,
    bio: "",
    followers: count(followers[1]),
    posts_count: postsTotal ? count(postsTotal[1]) : posts.length,
    note: posts.length
      ? "Read from Instagram's public embed, so it shows the newest posts and no like counts."
      : "Instagram served the profile head but no posts.",
    posts,
  };
}

async function tiktok(handle) {
  const page = await reader(`https://www.tiktok.com/@${handle}`);
  const followers = page.match(/\*\*([\d.,]+[KMB]?)\*\*Followers/);
  if (!followers) {
    throw new Error(
      "TikTok put a check in front of that profile this time. Try again in a moment."
    );
  }

  const user = page.match(/^## ([^\s#]+)\r?$/m);
  const avatar = page.match(/!\[Image \d+\]\((https:\/\/[^)\s]*tiktokcdn[^)\s]*)\)/);
  const likesAt = page.search(/\*\*[\d.,]+[KMB]?\*\*Likes/);
  const bio = likesAt > -1 ? page.slice(likesAt).match(/^## ([^\n]+)\r?$/m)?.[1] || "" : "";

  const posts = [
    ...page.matchAll(
      /\[!\[Image \d+: ([^\]]*?)\]\([^)\s]*\)\s*\*\*([\d.,]+[KMB]?)\*\*\]\((https:\/\/www\.tiktok\.com\/[^)\s]*\/video\/\d+)\)/g
    ),
  ].map((hit) => ({
    title: clean(hit[1]) || "TikTok video",
    url: hit[3],
    thumbnail_url: "",
    views: count(hit[2]),
    likes: 0,
    comments: 0,
    posted_at: "",
  }));

  return {
    handle: user?.[1] || handle,
    display_name: "",
    avatar_url: avatar?.[1] || "",
    profile_url: `https://www.tiktok.com/@${user?.[1] || handle}`,
    bio: clean(bio),
    followers: count(followers[1]),
    posts_count: posts.length,
    note: posts.length
      ? "Read from the public profile: views per video, no covers or like counts."
      : "TikTok served the profile head but no videos.",
    posts,
  };
}

async function x(handle) {
  const page = await reader(`https://x.com/${handle}`);
  const postsTotal = page.match(/([\d.,]+[KMB]?)\s+posts\b/);
  if (!postsTotal) {
    throw new Error("X served nothing for that username. Check it and try again.");
  }

  const name = page.match(/Markdown Content:\n+([^\n]+)/);
  const avatar = page.match(
    /\[!\[Image \d+: @[^\]]+\]\((https?:\/\/pbs\.twimg\.com\/profile_images\/[^)\s]+)\)\]/
  );

  const posts = page
    .split(/\n\*   /)
    .slice(1)
    .map((chunk) => {
      const link = chunk.match(/https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+/)?.[0];
      const body = clean(
        chunk
          .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
          .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"),
        400
      );
      return {
        title: body,
        url: link || `https://x.com/${handle}`,
        thumbnail_url: "",
        views: 0,
        likes: 0,
        comments: 0,
        posted_at: "",
      };
    })
    .filter((post) => post.title.length > 3);

  return {
    handle,
    display_name: clean(name?.[1], 80),
    avatar_url: avatar?.[1]?.replace("_normal.", "_400x400.") || "",
    profile_url: `https://x.com/${handle}`,
    bio: "",
    followers: 0,
    posts_count: count(postsTotal[1]),
    note: "Read through a public reader: post text and count, no follower or view numbers.",
    posts,
  };
}

async function youtube(handle, token) {
  if (!token) {
    throw new Error(
      "The channel connection needs re-approving before a channel can be read."
    );
  }
  const { channel, videos } = await readChannel(token, handle);

  return {
    handle: channel.handle,
    display_name: channel.display_name,
    avatar_url: channel.avatar_url,
    profile_url: channel.profile_url,
    bio: channel.bio || "",
    followers: channel.followers,
    posts_count: channel.posts_count || videos.length,
    note: videos.length ? "" : "That channel has no uploads to show.",
    posts: videos.map((video) => ({
      title: video.title,
      url: video.url,
      thumbnail_url: video.thumbnail_url,
      views: video.views,
      likes: video.likes,
      comments: video.comments,
      posted_at: video.posted_at,
    })),
  };
}

export async function lookUp({ platform, handle, token }) {
  if (platform === "instagram") return instagram(handle);
  if (platform === "tiktok") return tiktok(handle);
  if (platform === "x") return x(handle);
  return youtube(handle, token);
}