import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Loader2, Pencil, Play } from "lucide-react";
import { formatClock } from "@/lib/design";
import { useSignedFile } from "@/lib/useSignedFile";
import { cn } from "@/lib/utils";

export default function ClipCard({ clip, jobId, renderState = {}, onRender, onKeep }) {
  const videoRef = useRef(null);
  const renderedUrl = useSignedFile(clip.rendered_uri);
  const busy = Boolean(renderState.busy);
  const progress = Math.round((renderState.progress || 0) * 100);

  function preview(on) {
    const video = videoRef.current;
    if (!video || !renderedUrl) return;
    if (on) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  return (
    <article
      className={cn(
        "lift rounded-[20px] border border-black/10 bg-white p-2",
        !clip.keep && "opacity-55"
      )}
    >
      <div
        className="relative aspect-[9/16] overflow-hidden rounded-[14px] bg-[#F5F5F5]"
        onMouseEnter={() => preview(true)}
        onMouseLeave={() => preview(false)}
      >
        {renderedUrl ? (
          <video
            ref={videoRef}
            src={`${renderedUrl}#t=0.4`}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between bg-[#FED50C] p-3">
            <p className="line-clamp-3 text-[12px] font-semibold leading-tight text-black">
              {clip.hook || clip.title}
            </p>
            <p className="line-clamp-3 text-center text-[13px] font-black uppercase leading-[1.15] tracking-[-0.01em] caption-preview">
              {(clip.caption_lines || []).join(" ").slice(0, 90) || "Captions ready"}
            </p>
            <button
              type="button"
              onClick={() => onRender(clip)}
              disabled={busy}
              className="pill pill-primary h-8 self-center px-3.5 text-[12px]"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              {busy ? `Rendering ${progress}%` : "Render clip"}
            </button>
          </div>
        )}

        <span className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-white">
          #{clip.rank}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 font-mono text-[10px] text-black">
          {clip.score}/10
        </span>
        <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
          {formatClock(clip.start)}–{formatClock(clip.end)}
        </span>

        {busy && renderedUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/70">
              Rendering {progress}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-2 pb-1 pt-3">
        <p className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.01em]">
          {clip.title}
        </p>
        {clip.reason ? (
          <p className="line-clamp-2 text-[12px] leading-snug text-black/45">{clip.reason}</p>
        ) : null}

        {renderState.error ? (
          <p className="text-[11.5px] leading-snug text-[#C0392B]">{renderState.error}</p>
        ) : null}
        {renderState.muted ? (
          <p className="text-[11.5px] leading-snug text-black/45">
            The browser muted playback during the render. Render again from the clip page to
            retry with sound.
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium">
            <input
              type="checkbox"
              checked={clip.keep !== false}
              onChange={(event) => onKeep(clip, event.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Keep
          </label>

          <div className="flex items-center gap-1">
            <Link
              to="/clips/$clipId"
              params={{ clipId: clip.id }}
              className="rounded-full p-2 text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black"
              aria-label="Open editor"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            {renderedUrl ? (
              <a
                href={renderedUrl}
                download={`${clip.id}.${clip.rendered_ext || "webm"}`}
                className="rounded-full p-2 text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black"
                aria-label="Download clip"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onRender(clip)}
                disabled={busy}
                className="rounded-full p-2 text-black/25"
                aria-label="Render first"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}