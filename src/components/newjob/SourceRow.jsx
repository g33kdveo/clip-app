import { useRef } from "react";
import { Link2, Loader2, Upload, X } from "lucide-react";

function probeDuration(file, done) {
  const probe = document.createElement("video");
  probe.preload = "metadata";
  probe.onloadedmetadata = () => {
    const value = Number.isFinite(probe.duration) ? probe.duration : 0;
    URL.revokeObjectURL(probe.src);
    done(value);
  };
  probe.onerror = () => done(0);
  probe.src = URL.createObjectURL(file);
}

export default function SourceRow({ url, onUrl, file, onFile, onSubmit, busy, ready }) {
  const inputRef = useRef(null);

  function pick(next) {
    if (!next) return;
    probeDuration(next, (duration) => onFile(next, duration));
  }

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
          <input
            className="field pl-12"
            placeholder="Paste a Twitch clip or YouTube link"
            value={url}
            onChange={(event) => onUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!ready || busy}
          className="pill pill-primary h-[52px] px-7"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Working" : "Make clips"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-[13px] text-black/30">or</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-3.5 py-1.5 text-[13px] font-medium text-black/70 transition-colors hover:border-black/40 hover:text-black"
        >
          <Upload className="h-3.5 w-3.5" />
          upload a video file
        </button>
        {file && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-black/[0.04] py-1.5 pl-3.5 pr-2 text-[13px] text-black/70">
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => onFile(null, 0)}
              className="rounded-full p-1 text-black/40 hover:bg-black/10 hover:text-black"
              aria-label="Remove file"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}