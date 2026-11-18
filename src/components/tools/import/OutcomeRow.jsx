import { useState } from "react";
import { Download, Loader2, Scissors } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function OutcomeRow({ asset, onStart, starting, error }) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: asset.file_uri,
        expires_in: 600,
      });
      const link = document.createElement("a");
      link.href = signed_url;
      link.download = asset.name || "video.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setSaving(false);
    }
  }

  const ready = Boolean(asset);

  return (
    <section className="rounded-[20px] border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">3 · What next</h2>
        <span className="eyebrow">{ready ? "Pick one" : "Waiting on the file"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={save}
          disabled={!ready || saving}
          className="pill pill-ghost h-11 px-5 text-[13.5px]"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {saving ? "Preparing" : "Save to my computer"}
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={!ready || starting}
          className="pill pill-primary h-11 px-5 text-[13.5px]"
        >
          {starting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scissors className="h-3.5 w-3.5" />
          )}
          {starting ? "Starting" : "Start a clip job"}
        </button>
      </div>

      <p className="mt-3 max-w-[58ch] text-[12px] leading-relaxed text-black/40">
        A clip job reads the file's audio first, so a very long recording may need a shorter cut.
      </p>

      {error ? <p className="mt-2.5 text-[12.5px] text-[#C0392B]">{error}</p> : null}
    </section>
  );
}