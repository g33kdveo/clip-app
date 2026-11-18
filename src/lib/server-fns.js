import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { LAYOUT_IDS } from "@/lib/design";
import { classifyLink, resolveLink } from "@/lib/link-resolve.server";
import {
  checkYouTubeDownload,
  downloadNote,
  finishedNote,
  queueYouTubeDownload,
} from "@/lib/youtube-download.server";
import { pickMoments } from "@/lib/picking.server";
import { timedLines, wordsFor } from "@/lib/transcript.server";

const MAX_TRANSCRIPT_CHARS = 60000;
const MAX_LINK_BYTES = 100 * 1024 * 1024;

const CONTENT_TYPES = ["auto", "talking", "action", "no_talking", "podcast", "interview"];
const VOICES = ["punchy", "hype", "calm", "analytical"];

// Keep a very long transcript inside the prompt budget without losing the spread across the video.
function thin(lines, budget) {
  let kept = lines.slice();
  while (kept.reduce((sum, l) => sum + l.text.length + 14, 0) > budget && kept.length > 40) {
    kept = kept.filter((_, i) => i % 2 === 0);
  }
  return kept;
}

function captionFor(channel) {
  return channel ? `Source: ${channel}` : "Source: original creator";
}

// Pull a file the source handed us into private storage.
async function storeRemote(base44, url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("The source would not hand over the video file.");

  // Read the declared size before buffering, so a huge file is refused instead
  // of filling the worker's memory.
  const declared = Number(response.headers.get("content-length")) || 0;
  if (declared > MAX_LINK_BYTES) {
    throw new Error(
      "That video is too long to pull in one go. Paste a link to a shorter stretch of it."
    );
  }

  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength) throw new Error("The source sent an empty video file.");
  if (bytes.byteLength > MAX_LINK_BYTES) {
    throw new Error(
      "That video is too long to pull in one go. Paste a link to a shorter stretch of it."
    );
  }
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
    file: new File([bytes], filename, { type: "video/mp4" }),
  });
  return file_uri;
}

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      title: z.string().max(300).optional(),
      channel: z.string().max(200).optional(),
      source_type: z.enum(["link", "upload", "vod", "live"]),
      source_url: z.string().max(2000).optional(),
      file_uri: z.string().max(2000).optional(),
      duration: z.number().min(0).max(60 * 60 * 12).optional(),
      clip_count: z.number().int().min(1).max(15),
      clip_length: z.number().int().min(15).max(120).optional(),
      language: z.string().max(20).optional(),
      content_type: z.enum(CONTENT_TYPES).optional(),
      lead_in: z.number().min(0).max(10).optional(),
      focus: z.string().max(500).optional(),
      audio_level: z.enum(["original", "boosted", "soft"]).optional(),
      voice: z.enum(VOICES).optional(),
      layout: z.enum(LAYOUT_IDS),
      captions: z.enum(["spoken", "english", "none"]),
      hook: z.enum(["english", "spoken", "none"]),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const fromFile = Boolean(data.file_uri);
    const fromLink = Boolean(data.source_url);

    const job = await base44.entities.ClipJob.create({
      title: data.title || "Untitled source",
      channel: data.channel || "",
      source_type: data.source_type,
      source_url: data.source_url || "",
      source_note: fromLink ? "Nothing read from the link yet." : "",
      file_uri: data.file_uri || "",
      duration: data.duration || 0,
      clip_count: data.clip_count,
      clip_length: data.clip_length || 45,
      language: data.language || "auto",
      content_type: data.content_type || "auto",
      lead_in: data.lead_in || 0,
      focus: data.focus || "",
      audio_level: data.audio_level || "original",
      voice: data.voice || "punchy",
      layout: data.layout,
      captions: data.captions,
      hook: data.hook,
      status: fromFile || fromLink ? "draft" : "needs_file",
      stage_note: fromFile
        ? "Video stored. Ready to read the transcript."
        : fromLink
          ? "Link stored. Reading the source now."
          : "No source yet. Paste a link or upload the video.",
    });
    return job;
  });

export const processJob = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ jobId: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const job = await base44.entities.ClipJob.get(data.jobId);
    if (!job) throw new Error("Job not found");

    const service = base44.asServiceRole;
    const patch = (values) => base44.entities.ClipJob.update(job.id, values);

    let fileUri = job.file_uri || "";
    let transcript = String(job.transcript || "").trim();
    let lines = Array.isArray(job.timed_lines) ? job.timed_lines.filter((line) => line?.text) : [];
    let duration = Number(job.duration) || 0;
    let title = job.title || "";
    let channel = job.channel || "";
    let sourceNote = job.source_note || "";
    let clipCount = Number(job.clip_count) || 5;

    try {
      const link = job.source_url ? classifyLink(job.source_url) : { kind: "unknown" };

      // 1 · A YouTube link: read its words, then pull the file down. The
      // downloader's queue runs for minutes, so the job comes back for the file
      // in its own passes instead of holding one request open.
      if (!fileUri && link.kind === "youtube") {
        if (!job.download_job_id) {
          await patch({
            status: "resolving",
            stage_note: "Reading the YouTube link, then queueing the download.",
          });

          const resolved = await resolveLink(job.source_url);
          title = resolved.title || title;
          channel = resolved.channel || channel;
          duration = resolved.duration || duration;
          sourceNote = resolved.note || sourceNote;
          lines = resolved.lines || [];
          transcript = resolved.transcript || "";

          // A 54-second clip cannot hold eight 45-second moments.
          if (duration) {
            const fits = Math.max(
              1,
              Math.floor(duration / Math.max(15, Number(job.clip_length) || 45))
            );
            if (fits < clipCount) clipCount = fits;
          }

          const queued = await queueYouTubeDownload(job.source_url, { duration });

          await patch({
            title: title || "Untitled source",
            channel,
            duration,
            clip_count: clipCount,
            source_note: sourceNote,
            transcript: transcript.slice(0, 90000),
            timed_lines: lines,
            word_count: transcript ? transcript.split(/\s+/).length : 0,
            download_job_id: queued.jobId,
            stage_note: "Queued with the downloader. Waiting for its turn.",
          });
          return { ok: false, reason: "downloading" };
        }

        const status = await checkYouTubeDownload(job.download_job_id);
        if (status.status !== "COMPLETED" || !status.downloadUrl) {
          await patch({ status: "resolving", stage_note: downloadNote(status) });
          return { ok: false, reason: "downloading" };
        }

        fileUri = await storeRemote(base44, status.downloadUrl, `${job.id}.mp4`);
        duration = Number(status.duration) || duration;
        await patch({
          file_uri: fileUri,
          duration,
          download_job_id: "",
          source_note: finishedNote(status),
        });
      }

      // 2 · Any other link: read what the source will give in one pass.
      if (!fileUri && !lines.length && job.source_url && link.kind !== "youtube") {
        await patch({
          status: "resolving",
          stage_note: "Reading the link and pulling down what it gives us.",
        });

        const resolved = await resolveLink(job.source_url);
        title = resolved.title || title;
        channel = resolved.channel || channel;
        duration = resolved.duration || duration;
        sourceNote = resolved.note || sourceNote;

        if (resolved.fileUrl) {
          fileUri = await storeRemote(base44, resolved.fileUrl, `${job.id}.mp4`);
        }
        if (resolved.lines?.length) {
          lines = resolved.lines;
          transcript = resolved.transcript || lines.map((line) => line.text).join(" ");
        }

        // A 54-second clip cannot hold eight 45-second moments.
        if (duration) {
          const fits = Math.max(
            1,
            Math.floor(duration / Math.max(15, Number(job.clip_length) || 45))
          );
          if (fits < clipCount) clipCount = fits;
        }

        await patch({
          title: title || "Untitled source",
          channel,
          duration,
          clip_count: clipCount,
          source_note: sourceNote,
          file_uri: fileUri,
          transcript: transcript.slice(0, 90000),
          timed_lines: lines,
          word_count: transcript ? transcript.split(/\s+/).length : 0,
        });
      }

      if (!fileUri && !lines.length) {
        await patch({
          status: "needs_file",
          stage_note:
            sourceNote ||
            "This source gave no transcript and no video file. Upload the video to run the pipeline.",
        });
        return { ok: false, reason: "needs_file" };
      }

      // 2 · No transcript yet: listen to the stored file.
      if (!lines.length) {
        await patch({
          status: "transcribing",
          stage_note: "Listening to the audio and writing the transcript.",
        });

        const { signed_url } = await service.integrations.Core.CreateFileSignedUrl({
          file_uri: fileUri,
          expires_in: 1800,
        });

        let raw = "";
        try {
          raw = await service.integrations.Core.TranscribeAudio({ audio_url: signed_url });
        } catch {
          throw new Error(
            "The speech-to-text service could not read this file. It accepts audio and video up to 25 MB, so a very long stream needs trimming first."
          );
        }

        transcript = String(raw || "").trim();
        if (transcript.length < 40) throw new Error("Almost no speech was found in this file.");

        lines = timedLines(transcript, duration);
        await patch({
          transcript: transcript.slice(0, 90000),
          timed_lines: lines,
          word_count: transcript.split(/\s+/).length,
        });
      }

      // 3 · Pick the moments worth posting.
      await patch({
        status: "picking",
        stage_note: "Reading the transcript and choosing the moments worth posting.",
      });

      const kept = thin(lines, MAX_TRANSCRIPT_CHARS);
      const moments = await pickMoments({
        invoke: (args) => service.integrations.Core.InvokeLLM(args),
        job: { ...job, title, channel, duration, clip_count: clipCount },
        lines,
        kept,
        credit: captionFor(channel),
      });

      // Re-running a job replaces its moments instead of stacking a second set.
      await base44.entities.Clip.deleteMany({ job_id: job.id });

      const rows = moments.map((moment, index) => {
        const captionLines = lines
          .filter((line) => line.e > moment.start && line.t < moment.end)
          .map((line) => line.text);
        const credit = captionFor(channel);
        const post = String(moment.post_caption || "").includes(credit)
          ? String(moment.post_caption)
          : `${String(moment.post_caption || moment.title)}\n\n${credit}`;
        return {
          job_id: job.id,
          rank: index + 1,
          title: String(moment.title || `Clip ${index + 1}`).slice(0, 120),
          first_line: String(moment.first_line || captionLines[0] || "").slice(0, 400),
          start: Math.round(moment.start * 100) / 100,
          end: Math.round(moment.end * 100) / 100,
          duration: Math.round((moment.end - moment.start) * 100) / 100,
          score: Math.max(1, Math.min(10, Math.round(Number(moment.score) || 0))),
          reason: String(moment.reason || "").slice(0, 400),
          post_caption: post,
          hook:
            job.hook === "none"
              ? ""
              : (moment.hook_options || [])[0] || String(moment.title || "").slice(0, 45),
          hook_options: (moment.hook_options || []).slice(0, 3),
          layout: job.layout,
          cam: "br",
          zoom: 1,
          bg: "#FED50C",
          audio_level: job.audio_level || "original",
          captions_mode: job.captions,
          words: wordsFor(lines, moment.start, moment.end),
          caption_lines: captionLines,
          keep: true,
          render_version: 0,
        };
      });

      const created = await base44.entities.Clip.bulkCreate(rows);

      await patch({
        status: "ready",
        clip_total: rows.length,
        stage_note: fileUri
          ? `${rows.length} moments picked. Render the ones you want to post.`
          : `${rows.length} moments picked from the captions. Attach the video file to render them.`,
      });

      return { ok: true, clips: Array.isArray(created) ? created.length : rows.length };
    } catch (error) {
      await patch({
        status: "failed",
        stage_note: String(error?.message || error).slice(0, 400),
        // A dead download must not be polled again on the retry.
        download_job_id: "",
      });
      return { ok: false, reason: String(error?.message || error) };
    }
  });

export const updateJobMoments = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      jobId: z.string().min(1).max(120),
      patch: z
        .object({
          clip_count: z.number().int().min(1).max(15).optional(),
          clip_length: z.number().int().min(15).max(120).optional(),
          content_type: z.enum(CONTENT_TYPES).optional(),
          lead_in: z.number().min(0).max(10).optional(),
          focus: z.string().max(500).optional(),
          voice: z.enum(VOICES).optional(),
          language: z.string().max(20).optional(),
          layout: z.enum(LAYOUT_IDS).optional(),
        })
        .strict(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    return base44.entities.ClipJob.update(data.jobId, data.patch);
  });

export const sourceSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ jobId: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const job = await base44.entities.ClipJob.get(data.jobId);
    if (!job?.file_uri) throw new Error("This job has no stored video yet.");
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: job.file_uri,
      expires_in: 3600,
    });
    return { url: signed_url };
  });

export const updateClip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().min(1).max(120),
      patch: z
        .object({
          title: z.string().max(200).optional(),
          start: z.number().min(0).optional(),
          end: z.number().min(0).optional(),
          layout: z.enum(LAYOUT_IDS).optional(),
          cam: z.enum(["br", "bl", "tr", "tl", "none"]).optional(),
          audio_level: z.enum(["original", "boosted", "soft"]).optional(),
          zoom: z.number().min(1).max(1.6).optional(),
          bg: z.string().max(20).optional(),
          hook: z.string().max(120).optional(),
          captions_mode: z.enum(["spoken", "english", "none"]).optional(),
          keep: z.boolean().optional(),
          post_caption: z.string().max(1200).optional(),
        })
        .strict(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const patch = { ...data.patch };
    if (patch.start !== undefined && patch.end !== undefined && patch.end <= patch.start) {
      throw new Error("The end has to come after the start.");
    }
    if (patch.start !== undefined) patch.start = Math.round(patch.start * 100) / 100;
    if (patch.end !== undefined) patch.end = Math.round(patch.end * 100) / 100;
    const clip = await base44.entities.Clip.update(data.id, patch);
    return clip;
  });

export const saveRenderedClip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().min(1).max(120),
      rendered_uri: z.string().min(1).max(2000),
      thumbnail_uri: z.string().max(2000).optional(),
      rendered_ext: z.enum(["webm", "mp4"]).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const clip = await base44.entities.Clip.get(data.id);
    if (!clip) throw new Error("Clip not found");
    return base44.entities.Clip.update(data.id, {
      rendered_uri: data.rendered_uri,
      thumbnail_uri: data.thumbnail_uri || "",
      rendered_ext: data.rendered_ext || "webm",
      render_version: (clip.render_version || 0) + 1,
      rendered_at: new Date().toISOString(),
    });
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ jobId: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    await base44.entities.Clip.deleteMany({ job_id: data.jobId });
    await base44.entities.ClipJob.delete(data.jobId);
    return { ok: true };
  });