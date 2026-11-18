import { useRef, useState } from "react";
import { FileVideo, Link2, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { importFileLink } from "@/lib/import-fns";

function probeDuration(file) {
  return new Promise((resolve) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const value = Number.isFinite(probe.duration) ? probe.duration : 0;
      URL.revokeObjectURL(probe.src);
      resolve(value);
    };
    probe.onerror = () => resolve(0);
    probe.src = URL.createObjectURL(file);
  });
}

export function fileSize(bytes) {
  const value = Number(bytes) || 0;
  if (!value) return "";
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileSource({ asset, onAsset }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const duration = await probeDuration(file);
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      onAsset({ file_uri, name: file.name, size: file.size, duration });
    } catch (failure) {
      setError(String(failure?.message || failure));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function pull() {
    setBusy(true);
    setError("");
    try {
      const result = await importFileLink({ data: { url: link } });
      onAsset({ ...result, duration: 0 });
      setLink("");
    } catch (failure) {
      setError(String(failure?.message || failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">2 · The file</h2>
        {asset ? <span className="eyebrow">Ready</span> : null}
      </div>
      <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-black/45">
        Export the file from the source, then drop it here. It is stored privately, so only you can
        open it.
      </p>

      {asset ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-black/10 bg-[#FAFAF9] px-4 py-3">
          <FileVideo className="h-4 w-4 shrink-0 text-black/40" />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{asset.name}</span>
          <span className="text-[12px] text-black/40">{fileSize(asset.size)}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="text-[12.5px] font-medium text-black/55 underline decoration-black/25 transition-colors hover:text-black"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-black/20 bg-[#FCFCFB] px-5 py-9 text-center transition-colors hover:border-black/40"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-black/40" />
          ) : (
            <Upload className="h-5 w-5 text-black/40" />
          )}
          <span className="text-[13.5px] font-semibold">
            {busy ? "Bringing the file in" : "Choose the video file"}
          </span>
          <span className="text-[12px] text-black/40">MP4, MOV or WebM · up to 180 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => upload(event.target.files?.[0])}
      />

      <div className="mt-4 border-t border-black/[0.06] pt-4">
        <label className="text-[12.5px] font-medium text-black/55">
          Or paste a direct link to the file
        </label>
        <div className="mt-2 grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
            <input
              className="field pl-12"
              placeholder="https://…/video.mp4"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && link.trim() && !busy) pull();
              }}
            />
          </div>
          <button
            type="button"
            onClick={pull}
            disabled={!link.trim() || busy}
            className="pill pill-ghost h-[52px] px-6"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Bring it in
          </button>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-black/35">
          The link has to open the video file itself, not a page that plays it. A link the creator
          shared with you works; a page on the video site does not.
        </p>
      </div>

      {error ? <p className="mt-2.5 text-[12.5px] text-[#C0392B]">{error}</p> : null}
    </section>
  );
}