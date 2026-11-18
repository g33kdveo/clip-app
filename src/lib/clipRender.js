import { TEMPLATE_STYLE } from "@/lib/design";

const W = 1080;
const H = 1920;
const CAP_TOP = 1100;
const CAP_W = 820;
const CAP_X = 130;
const HOOK_SECONDS = 4.5;
const HOOK_ALWAYS = new Set(["band", "stacked", "cinema", "letterbox", "streamer"]);
const AUDIO_GAIN = { original: 1, boosted: 1.7, soft: 0.62 };

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function isLight(hex) {
  const value = String(hex || "#FED50C").replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export function buildChunks(words = [], style = "default") {
  const out = [];
  let current = [];
  const maxWords = style === "pop" ? 1 : 3;
  const maxChars = style === "pop" ? 24 : 22;
  for (const word of words) {
    const chars = current.reduce((sum, w) => sum + w.w.length + 1, 0);
    const prev = current[current.length - 1];
    if (
      current.length &&
      (current.length >= maxWords ||
        chars + word.w.length > maxChars ||
        word.s - prev.e > 0.55 ||
        /[.?!]$/.test(prev.w))
    ) {
      out.push(current);
      current = [];
    }
    current.push(word);
  }
  if (current.length) out.push(current);
  return out;
}

export function activeChunk(chunks, t) {
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const next = chunks[i + 1];
    const start = chunk[0].s;
    // drop the line as soon as the words stop, so a pause never shows a stale caption
    const tail = chunk[chunk.length - 1].e + 0.45;
    const end = next ? Math.min(next[0].s, tail) : tail;
    if (t >= start && t < end) return chunk;
  }
  return null;
}

function cover(ctx, video, x, y, w, h, zoom = 1) {
  const vw = video.videoWidth || 16;
  const vh = video.videoHeight || 9;
  const scale = Math.max(w / vw, h / vh) * zoom;
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function contain(ctx, video, x, y, w, h) {
  const vw = video.videoWidth || 16;
  const vh = video.videoHeight || 9;
  const scale = Math.min(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Crop one corner of the source (where a stream overlay usually keeps the face cam).
function corner(ctx, video, position, x, y, w, h) {
  const vw = video.videoWidth || 16;
  const vh = video.videoHeight || 9;
  const anchor = { br: [0.5, 0.5], bl: [0, 0.5], tr: [0.5, 0], tl: [0, 0] }[position] || [0.5, 0.5];
  const sw = vw * 0.5;
  const sh = vh * 0.5;
  const scale = Math.max(w / sw, h / sh);
  const cw = w / scale;
  const ch = h / scale;
  const sx = anchor[0] * vw + (sw - cw) / 2;
  const sy = anchor[1] * vh + (sh - ch) / 2;
  ctx.drawImage(video, sx, sy, cw, ch, x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitFont(ctx, texts, maxWidth, start, min, font) {
  let size = start;
  while (size > min) {
    ctx.font = font(size);
    const space = ctx.measureText(" ").width;
    const total =
      texts.reduce((sum, text) => sum + ctx.measureText(text).width, 0) +
      space * Math.max(0, texts.length - 1);
    if (total <= maxWidth) break;
    size -= 3;
  }
  return size;
}

function drawHook(ctx, clip, template, dark, bg) {
  const text = String(clip.hook || "").trim();
  if (!text) return;
  const style = (TEMPLATE_STYLE[template] || {}).hook || "plain";
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (style === "band") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, 210);
    ctx.font = '800 52px Geist, "Helvetica Neue", Arial, sans-serif';
    const lines = wrapText(ctx, text.toUpperCase(), 940).slice(0, 2);
    ctx.fillStyle = dark ? "#0A0A0A" : "#FFFFFF";
    const top = lines.length === 1 ? 76 : 46;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, top + i * 62));
  } else if (style === "clean") {
    ctx.font = '700 44px Geist, "Helvetica Neue", Arial, sans-serif';
    const lines = wrapText(ctx, text.toUpperCase(), 860).slice(0, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 18;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 250 + i * 56));
    ctx.shadowBlur = 0;
    ctx.fillStyle = bg;
    ctx.fillRect(W / 2 - 46, 250 + lines.length * 56 + 14, 92, 5);
  } else {
    ctx.font = '700 62px Geist, "Helvetica Neue", Arial, sans-serif';
    const lines = wrapText(ctx, text, 880).slice(0, 3);
    ctx.fillStyle = dark ? "#0A0A0A" : "#FFFFFF";
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 250 + i * 74));
  }
  ctx.restore();
}

function drawCaptions(ctx, chunk, activeIndex, style, accent, y, dark) {
  if (!chunk || !chunk.length) return;
  const words = chunk.map((word) => word.w);
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  if (style === "pop") {
    const word = words[activeIndex] || words[0];
    const text = String(word).toUpperCase();
    ctx.font = '900 150px "Arial Black", Geist, Arial, sans-serif';
    const width = ctx.measureText(text).width;
    const boxW = Math.min(W - 80, width + 70);
    const boxH = 210;
    ctx.fillStyle = accent;
    roundRect(ctx, (W - boxW) / 2, y - boxH / 2, boxW, boxH, 28);
    ctx.fill();
    ctx.fillStyle = dark ? "#0A0A0A" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, y + 6);
  } else if (style === "italic") {
    const text = words.join(" ");
    const size = fitFont(
      ctx,
      [text],
      860,
      78,
      44,
      (value) => `italic 700 ${value}px Georgia, "Times New Roman", serif`
    );
    ctx.font = `italic 700 ${size}px Georgia, "Times New Roman", serif`;
    const width = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(ctx, W / 2 - width / 2 - 40, y - size * 0.95, width + 80, size * 1.9, 26);
    ctx.fill();
    const space = ctx.measureText(" ").width;
    const widths = words.map((word) => ctx.measureText(word).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let x = W / 2 - total / 2;
    ctx.textAlign = "left";
    words.forEach((word, i) => {
      ctx.fillStyle = i === activeIndex ? accent : "#FFFFFF";
      ctx.fillText(word, x, y);
      x += widths[i] + space;
    });
  } else if (style === "clean") {
    const texts = words.map((word) => word.toUpperCase());
    const size = fitFont(
      ctx,
      texts,
      900,
      64,
      36,
      (value) => `700 ${value}px Geist, "Helvetica Neue", Arial, sans-serif`
    );
    ctx.font = `700 ${size}px Geist, "Helvetica Neue", Arial, sans-serif`;
    const space = ctx.measureText(" ").width;
    const widths = texts.map((text) => ctx.measureText(text).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (texts.length - 1);
    let x = W / 2 - total / 2;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 16;
    texts.forEach((text, i) => {
      ctx.fillStyle = i === activeIndex ? accent : "#FFFFFF";
      ctx.fillText(text, x, y);
      x += widths[i] + space;
    });
  } else if (style === "neon") {
    const texts = words.map((word) => word.toUpperCase());
    const size = fitFont(
      ctx,
      texts,
      900,
      96,
      44,
      (value) => `900 ${value}px "Arial Black", Geist, Arial, sans-serif`
    );
    ctx.font = `900 ${size}px "Arial Black", Geist, Arial, sans-serif`;
    const space = ctx.measureText(" ").width;
    const widths = texts.map((text) => ctx.measureText(text).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (texts.length - 1);
    let x = W / 2 - total / 2;
    texts.forEach((text, i) => {
      const on = i === activeIndex;
      ctx.shadowColor = on ? accent : "rgba(0,0,0,0.9)";
      ctx.shadowBlur = on ? 46 : 18;
      ctx.fillStyle = on ? accent : "#FFFFFF";
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = on ? accent : "#FFFFFF";
      ctx.fillText(text, x, y);
      x += widths[i] + space;
    });
  } else if (style === "comic") {
    const texts = words.map((word) => word.toUpperCase());
    const size = fitFont(
      ctx,
      texts,
      840,
      86,
      44,
      (value) => `900 ${value}px "Arial Black", Geist, Arial, sans-serif`
    );
    ctx.font = `900 ${size}px "Arial Black", Geist, Arial, sans-serif`;
    const space = ctx.measureText(" ").width;
    const widths = texts.map((text) => ctx.measureText(text).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (texts.length - 1);
    let x = W / 2 - total / 2;
    texts.forEach((text, i) => {
      const on = i === activeIndex;
      ctx.fillStyle = on ? accent : "rgba(0,0,0,0.78)";
      roundRect(ctx, x - 12, y - size * 0.68, widths[i] + 24, size * 1.36, 12);
      ctx.fill();
      ctx.fillStyle = on && dark ? "#0A0A0A" : "#FFFFFF";
      ctx.fillText(text, x, y);
      x += widths[i] + space;
    });
  } else {
    const texts = words.map((word) => word.toUpperCase());
    const size = fitFont(
      ctx,
      texts,
      CAP_W,
      92,
      44,
      (value) => `900 ${value}px "Arial Black", Geist, Arial, sans-serif`
    );
    ctx.font = `900 ${size}px "Arial Black", Geist, Arial, sans-serif`;
    const space = ctx.measureText(" ").width;
    const widths = texts.map((text) => ctx.measureText(text).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (texts.length - 1);
    let x = CAP_X + (CAP_W - total) / 2;
    ctx.lineWidth = 16;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    texts.forEach((text, i) => {
      ctx.strokeStyle = "#000000";
      ctx.strokeText(text, x, y);
      ctx.fillStyle = i === activeIndex ? accent : "#FFFFFF";
      ctx.fillText(text, x, y);
      x += widths[i] + space;
    });
  }
  ctx.restore();
}

function drawTemplate(ctx, video, clip, template, bg, zoom) {
  const render = (TEMPLATE_STYLE[template] || {}).render || template;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (render === "stacked") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, 350);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 350, W, H - 350);
    ctx.clip();
    cover(ctx, video, 0, 350, W, H - 350, zoom);
    ctx.restore();
    const fade = ctx.createLinearGradient(0, H - 620, 0, H);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, H - 620, W, 620);
    return;
  }

  if (render === "streamer") {
    cover(ctx, video, 0, 0, W, 1240, zoom);
    const cam = clip.cam || "br";
    if (cam !== "none") {
      const size = 440;
      const x = 580;
      const y = 880;
      ctx.save();
      roundRect(ctx, x - 10, y - 10, size + 20, size + 20, 40);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundRect(ctx, x, y, size, size, 32);
      ctx.clip();
      corner(ctx, video, cam, x, y, size, size);
      ctx.restore();
    }
    return;
  }

  if (render === "reaction") {
    cover(ctx, video, 0, 0, W, H, zoom);
    const size = 400;
    const cx = W - 80 - size / 2;
    const cy = 720;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 + 14, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.clip();
    corner(ctx, video, clip.cam || "br", cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
    return;
  }

  if (render === "glow") {
    ctx.save();
    ctx.filter = "blur(44px)";
    cover(ctx, video, -100, -100, W + 200, H + 200, 1.25);
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 900, 80, W / 2, 900, 720);
    glow.addColorStop(0, "rgba(255,255,255,0.22)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    roundRect(ctx, 70, 400, 940, 1000, 44);
    ctx.clip();
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(70, 400, 940, 1000);
    contain(ctx, video, 70, 400, 940, 1000);
    ctx.restore();
    return;
  }

  if (render === "guest") {
    ctx.save();
    ctx.filter = "blur(40px)";
    cover(ctx, video, -100, -100, W + 200, H + 200, 1.2);
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    roundRect(ctx, 80, 260, 920, 1120, 40);
    ctx.clip();
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(80, 260, 920, 1120);
    contain(ctx, video, 80, 260, 920, 1120);
    ctx.restore();
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 1430, W, H - 1430);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 1430, W, 6);
    return;
  }

  if (render === "cinema") {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    contain(ctx, video, 0, 560, W, 608);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 560, W, 5);
    const vignette = ctx.createLinearGradient(0, 0, 0, H);
    vignette.addColorStop(0, "rgba(0,0,0,0.85)");
    vignette.addColorStop(0.45, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (render === "letterbox") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    contain(ctx, video, 0, 656, W, 608);
    return;
  }

  if (render === "split") {
    cover(ctx, video, 0, 0, W, 940, zoom);
    cover(ctx, video, 0, 940, W, 620, Math.min(2, zoom * 1.7));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 936, W, 8);
    return;
  }

  if (render === "italic") {
    cover(ctx, video, 0, 0, W, H, zoom);
    const scrim = ctx.createLinearGradient(0, 0, 0, H);
    scrim.addColorStop(0, "rgba(0,0,0,0.45)");
    scrim.addColorStop(0.5, "rgba(0,0,0,0.62)");
    scrim.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  cover(ctx, video, 0, 0, W, H, zoom);
}

export function drawFrame(ctx, video, clip, t, chunks) {
  const bg = clip.bg || "#FED50C";
  const template = TEMPLATE_STYLE[clip.layout] ? clip.layout : "fill";
  const style = (TEMPLATE_STYLE[template] || {}).style || "default";
  const captionY = (TEMPLATE_STYLE[template] || {}).captionY || CAP_TOP + 150;
  const zoom = Math.min(1.6, Math.max(1, Number(clip.zoom) || 1));
  const dark = isLight(bg);

  ctx.clearRect(0, 0, W, H);
  drawTemplate(ctx, video, clip, template, bg, zoom);

  if (clip.hook && (HOOK_ALWAYS.has(template) || t < HOOK_SECONDS)) {
    drawHook(ctx, clip, template, dark, bg);
  }

  if (clip.captions_mode !== "none") {
    const chunk = activeChunk(chunks, t);
    if (chunk) {
      let active = -1;
      chunk.forEach((word, i) => {
        if (t >= word.s && t < word.e) active = i;
      });
      drawCaptions(ctx, chunk, active, style, bg, captionY, dark);
    }
  }
}

export async function openVideo(url) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.preload = "auto";
  video.muted = false;
  video.src = url;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("The source video could not be opened for rendering."));
  });
  return video;
}

const MAX_INLINE_BYTES = 320 * 1024 * 1024;

export async function resolveSource(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return url;
    const size = Number(response.headers.get("content-length") || 0);
    // a long stream is far too big to pull into memory: read it straight from the url
    if (size > MAX_INLINE_BYTES) return url;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    // cross-origin fetch blocked: fall through to the direct url
    return url;
  }
}

function seek(video, time) {
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    video.currentTime = time;
  });
}

// Route the element's audio through a gain node so the clip can be mixed louder or softer.
async function attachGain(video, stream, level) {
  const value = AUDIO_GAIN[level] ?? 1;
  if (value === 1) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  let audioCtx;
  try {
    audioCtx = new AudioCtx();
    await audioCtx.resume().catch(() => {});
    // if the graph is not running yet, leave the element alone so the plain
    // capture path still carries sound instead of a silent graph
    if (audioCtx.state !== "running") {
      await audioCtx.close().catch(() => {});
      return null;
    }
    const source = audioCtx.createMediaElementSource(video);
    const gain = audioCtx.createGain();
    gain.gain.value = value;
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(gain);
    gain.connect(destination);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    return audioCtx;
  } catch {
    if (audioCtx) audioCtx.close().catch(() => {});
    return null;
  }
}

export async function renderClip({ sourceUrl, clip, onProgress }) {
  const localUrl = await resolveSource(sourceUrl);
  const video = await openVideo(localUrl);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const style = (TEMPLATE_STYLE[clip.layout] || {}).style || "default";
  const chunks = buildChunks(clip.words || [], style);

  const start = Number(clip.start) || 0;
  const end = Math.min(Number(clip.end) || 0, video.duration || Number(clip.end) || 0);
  await seek(video, start);

  const stream = canvas.captureStream(30);
  const audioCtx = await attachGain(video, stream, clip.audio_level);
  if (!audioCtx) {
    try {
      const audio = video.captureStream ? video.captureStream() : null;
      audio?.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch {
      // no audio track available; the clip still records picture
    }
  }

  const mimeType =
    MIME_CANDIDATES.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "video/webm";
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
    audioBitsPerSecond: 128_000,
  });
  const parts = [];
  recorder.ondataavailable = (event) => {
    if (event.data?.size) parts.push(event.data);
  };

  const finished = new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(parts, { type: mimeType.split(";")[0] }));
  });

  drawFrame(ctx, video, clip, 0, chunks);
  recorder.start(250);

  // A render started from a button click normally plays with sound. If the browser
  // refuses (no interaction registered yet), fall back to a muted playthrough so the
  // clip still comes out instead of failing outright.
  let mutedFallback = false;
  try {
    await video.play();
  } catch {
    mutedFallback = true;
    video.muted = true;
    await video.play();
  }

  await new Promise((resolve) => {
    const tick = () => {
      const t = video.currentTime - start;
      drawFrame(ctx, video, clip, t, chunks);
      onProgress?.(Math.min(1, Math.max(0, t / Math.max(0.1, end - start))));
      if (video.currentTime >= end || video.ended) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  video.pause();
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  const blob = await finished;
  if (audioCtx) audioCtx.close().catch(() => {});

  await seek(video, Math.min(start + 1.2, end));
  drawFrame(ctx, video, clip, Math.min(1.2, end - start), chunks);
  const thumbnail = canvas.toDataURL("image/jpeg", 0.72);

  if (localUrl.startsWith("blob:")) URL.revokeObjectURL(localUrl);

  return {
    blob,
    thumbnail,
    ext: mimeType.startsWith("video/mp4") ? "mp4" : "webm",
    mimeType,
    muted: mutedFallback,
  };
}

export function dataUrlToFile(dataUrl, name) {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}