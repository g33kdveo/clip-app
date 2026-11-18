// YouTube Data API reads. Statistics only — the analytics API is not reachable
// through this connection, and uploads are never touched.

const API = "https://www.googleapis.com/youtube/v3";

async function call(path, token) {
  const response = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const reason = payload?.error?.errors?.[0]?.reason || "";
    if (/quota|LimitExceeded/i.test(reason)) {
      throw new Error("That isn't available right now, please try again later.");
    }
    if (
      /insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(reason) ||
      response.status === 403
    ) {
      throw new Error(
        "Google approved the sign-in but not access to channels. Reconnect and leave the channel permission ticked."
      );
    }
    if (response.status === 404) throw new Error("That channel could not be found.");
    throw new Error(payload?.error?.message || `YouTube answered ${response.status}.`);
  }
  return response.json();
}

// handle is optional: without one this reads the connected channel.
export async function readChannel(token, handle) {
  const query = handle
    ? handle.length >= 20 && handle.startsWith("UC")
      ? `id=${encodeURIComponent(handle)}`
      : `forHandle=${encodeURIComponent(`@${handle}`)}`
    : "mine=true";

  const found = await call(
    `channels?part=snippet,statistics,contentDetails&${query}`,
    token
  );
  const channel = found.items?.[0];
  if (!channel) throw new Error("YouTube has no channel under that username.");

  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  const videos = [];

  if (uploads) {
    const playlist = await call(
      `playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploads}`,
      token
    );
    const ids = (playlist.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter(Boolean)
      .slice(0, 50);

    if (ids.length) {
      const stats = await call(
        `videos?part=statistics,snippet,contentDetails&id=${ids.join(",")}`,
        token
      );
      for (const item of stats.items || []) {
        videos.push({
          title: item.snippet?.title || "Untitled",
          url: `https://www.youtube.com/watch?v=${item.id}`,
          thumbnail_url:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            "",
          views: Number(item.statistics?.viewCount) || 0,
          likes: Number(item.statistics?.likeCount) || 0,
          comments: Number(item.statistics?.commentCount) || 0,
          posted_at: String(item.snippet?.publishedAt || "").slice(0, 10),
        });
      }
    }
  }

  return {
    channel: {
      handle:
        channel.snippet?.customUrl?.replace(/^@/, "") ||
        channel.snippet?.title ||
        handle ||
        "channel",
      display_name: channel.snippet?.title || "",
      avatar_url:
        channel.snippet?.thumbnails?.medium?.url ||
        channel.snippet?.thumbnails?.default?.url ||
        "",
      profile_url: `https://www.youtube.com/channel/${channel.id}`,
      bio: channel.snippet?.description || "",
      followers: Number(channel.statistics?.subscriberCount) || 0,
      posts_count: Number(channel.statistics?.videoCount) || 0,
    },
    videos,
  };
}