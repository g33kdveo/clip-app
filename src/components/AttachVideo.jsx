import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

function probeDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const value = Number.isFinite(video.duration) ? video.duration : 0;
      URL.revokeObjectURL(video.src);
      resolve(value);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

// hasClips: the moments already exist (they came from a link's captions), so the
// file is only needed to render them and the job must not be picked again.
export default function AttachVideo({ jobId, hasClips = false, onAttached }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function attach(file) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const duration = await probeDuration(file);
      const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });

      const patch = hasClips
        ? {
            file_uri: uploaded.file_uri,
            status: "ready",
            stage_note: "Video attached. Render the moments you want to post.",
          }
        : {
            file_uri: uploaded.file_uri,
            duration,
            source_type: "upload",
            title: file.name.replace(/\.[^.]+$/, ""),
            status: "draft",
            stage_note: "Video stored. Reading the transcript next.",
          };

      await base44.entities.ClipJob.update(jobId, patch);
      onAttached?.();
    } catch (caught) {
      setError(String(caught?.message || caught));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="pill pill-primary h-9 px-4 text-[13px]"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? "Uploading" : "Upload the video"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => attach(event.target.files?.[0])}
        />
      </div>
      {error ? <p className="mt-2 text-[12px] text-[#C0392B]">{error}</p> : null}
    </div>
  );
}