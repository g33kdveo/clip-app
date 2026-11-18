// Pulling a YouTube video's file down, so a pasted link is enough to clip.
//
// YouTube serves no file to a server, so the download is done by VidKraken, a
// third-party downloader. Its queue can take minutes, which is far longer than
// one request should wait: we queue the video, keep its job id on the clip job,
// and check on it each time the pipeline is asked to move forward.

import { secrets } from "base44:runtime";

const API = "https://vidkraken.com/api/v2";

const MESSAGES = {
  VIDEO_NOT_FOUND: "YouTube has no video at that link. It may be private, removed or the id may be wrong.",
  LIMIT_REACHED: "The downloader's monthly allowance is used up. Top it up, or wait for the next cycle.",
  UNAUTHORIZED: "The downloader rejected its API key. Replace it in the app's secrets.",
  TOO_MANY_PENDING: "The downloader is handling too many jobs. Try again in a minute.",
  INVALID_REQUEST: "The downloader could not read that link.",
  UNAVAILABLE: "The downloader is briefly unavailable. Try again in a minute.",
};

function apiKey() {
  const key = secrets.get("VIDKRAKEN_API_KEY");
  if (!key) {
    throw new Error("The YouTube downloader is not connected. Add its API key in the app's secrets.");
  }
  return key;
}

function failure(payload, status) {
  return new Error(MESSAGES[payload?.code] || payload?.error || `The downloader answered ${status}.`);
}

function headers() {
  return { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" };
}

// Long videos are the ones that run past the transcriber's size limit, so step
// the quality down as the length goes up.
function qualityFor(duration) {
  if (!duration) return "720";
  if (duration > 30 * 60) return "360";
  if (duration > 10 * 60) return "480";
  return "720";
}

export async function queueYouTubeDownload(url, { duration = 0 } = {}) {
  const response = await fetch(`${API}/download`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url, format: qualityFor(duration) }),
  });
  const queued = await response.json().catch(() => ({}));
  if (!response.ok || !queued.jobId) throw failure(queued, response.status);
  return { jobId: queued.jobId, title: queued.title || "", duration: Number(queued.duration) || 0 };
}

export async function checkYouTubeDownload(jobId) {
  const response = await fetch(`${API}/download/${jobId}`, { headers: headers() });
  const job = await response.json().catch(() => ({}));
  if (!response.ok) throw failure(job, response.status);
  if (job.status === "FAILED") {
    throw new Error(job.error || "The downloader could not fetch that video.");
  }
  return job;
}

// One line for the job page, so a waiting download never looks stuck.
export function downloadNote(job) {
  if (job.status === "IN_PROGRESS") {
    const percent = Number(job.progress?.percent) || 0;
    return percent
      ? `Downloading from YouTube · ${percent}%.`
      : "Downloading from YouTube. This can take a few minutes.";
  }
  const place = Number(job.progress?.queuePosition) || 0;
  return place
    ? `Queued with the downloader · position ${place}. Waiting for its turn.`
    : "Queued with the downloader. Waiting for its turn.";
}

export function finishedNote(job) {
  const format = String(job.actualFormat || job.format || "");
  return `Pulled the video from YouTube${format ? ` at ${format}p` : ""}. Ready to pick moments.`;
}