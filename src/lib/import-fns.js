import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { resolveLink } from "@/lib/link-resolve.server";

const API = "https://www.googleapis.com/youtube/v3";
const MAX_FILE_BYTES = 180 * 1024 * 1024;

function videoIdFrom(raw) {
  const value = String(raw || "").trim();
  const match = value.match(
    /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  return "";
}

function secondsFromIso(value) {
  const match = String(value || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, d, h, m, s] = match;
  return (
    (Number(d) || 0) * 86400 + (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0)
  );
}

function fileNameFrom(url) {
  const path = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
  const clean = decodeURIComponent(path).replace(/[^\w.\- ]+/g, "").slice(-80);
  return /\.(mp4|mov|m4v|webm|mkv)$/i.test(clean) ? clean : "video.mp4";
}

// What the connected account can tell us about the video. Read-only access gives
// the title, channel and length, never a downloadable file.
export const readVideo = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ url: z.string().min(1).max(2000) }))
  .handler(async ({ data, context }) => {
    const id = videoIdFrom(data.url);
    if (!id) {
      throw new Error("That isn't a video link. Paste the address of the video you want to import.");
    }

    const base44 = context.getBase44();
    let token = "";
    try {
      const connection = await base44.asServiceRole.connectors.getConnection("youtube");
      token = connection?.accessToken || "";
    } catch {
      token = "";
    }

    const url = `https://www.youtube.com/watch?v=${id}`;
    let found = null;

    if (token) {
      const response = await fetch(`${API}/videos?part=snippet,contentDetails&id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        const item = payload?.items?.[0];
        if (item) {
          found = {
            videoId: id,
            url,
            title: item.snippet?.title || "",
            channel: item.snippet?.channelTitle || "",
            channelId: item.snippet?.channelId || "",
            duration: secondsFromIso(item.contentDetails?.duration),
            thumbnail:
              item.snippet?.thumbnails?.medium?.url ||
              item.snippet?.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          };
        }
      }
    }

    // A connection that cannot answer still shouldn't block the import.
    if (!found) {
      try {
        const resolved = await resolveLink(url);
        found = {
          videoId: id,
          url,
          title: resolved.title || "",
          channel: resolved.channel || "",
          channelId: "",
          duration: Number(resolved.duration) || 0,
          thumbnail: resolved.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
      } catch {
        found = {
          videoId: id,
          url,
          title: "",
          channel: "",
          channelId: "",
          duration: 0,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
      }
    }

    let owned = false;
    if (token && found.channelId) {
      try {
        const mine = await fetch(`${API}/channels?part=id&mine=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mine.ok) {
          const payload = await mine.json().catch(() => ({}));
          owned = payload?.items?.[0]?.id === found.channelId;
        }
      } catch {
        owned = false;
      }
    }

    return {
      ...found,
      owned,
      note: "Paste this link into a new clip job and the video downloads itself, ready to clip. This page is for a file you already have.",
    };
  });

// A direct link to a video file the creator has handed over. Pages, private
// addresses and anything that isn't a video are refused.
export const importFileLink = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ url: z.string().min(8).max(2000) }))
  .handler(async ({ data, context }) => {
    let parsed;
    try {
      parsed = new URL(data.url.trim());
    } catch {
      throw new Error("That isn't a link. Paste the direct address of the video file.");
    }

    if (parsed.protocol !== "https:") throw new Error("The link has to start with https://.");

    const host = parsed.hostname.toLowerCase();
    const privateHost =
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.includes(":") ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (privateHost) throw new Error("That address can't be read. Paste a public link to the file.");

    const response = await fetch(parsed.toString(), { headers: { Accept: "video/*" } });
    if (!response.ok) {
      throw new Error(`That link answered ${response.status}. Check it opens the file directly.`);
    }

    const type = String(response.headers.get("content-type") || "").toLowerCase();
    if (!type.startsWith("video/")) {
      throw new Error("That link is a page, not a video file. Use a direct link that ends in .mp4 or .mov.");
    }

    const declared = Number(response.headers.get("content-length")) || 0;
    if (declared > MAX_FILE_BYTES) {
      throw new Error("That file is over 180 MB. Upload it from your computer instead.");
    }

    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) throw new Error("That file came back empty.");
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new Error("That file is over 180 MB. Upload it from your computer instead.");
    }

    const name = fileNameFrom(parsed.toString());
    const { file_uri } = await context
      .getBase44()
      .integrations.Core.UploadPrivateFile({ file: new File([bytes], name, { type }) });

    return { file_uri, name, size: bytes.byteLength };
  });

export const startImportJob = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      file_uri: z.string().min(1).max(2000),
      title: z.string().max(300).optional(),
      channel: z.string().max(200).optional(),
      source_url: z.string().max(2000).optional(),
      duration: z.number().min(0).max(60 * 60 * 12).optional(),
      source_note: z.string().max(600).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const job = await base44.entities.ClipJob.create({
      title: data.title || "Imported video",
      channel: data.channel || "",
      source_type: "upload",
      source_url: data.source_url || "",
      file_uri: data.file_uri,
      duration: data.duration || 0,
      clip_count: 8,
      clip_length: 45,
      layout: "fill",
      captions: "spoken",
      hook: "english",
      status: "draft",
      source_note: data.source_note || "",
      stage_note: "Video stored. Ready to read the transcript.",
    });
    return { jobId: job.id };
  });