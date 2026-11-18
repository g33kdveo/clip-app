import { useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { toast } from "sonner";
import { generateVoiceover } from "@/lib/tools-fns";
import OptionPills from "@/components/OptionPills";
import { VOICE_OPTIONS } from "@/lib/tools";

const LIMIT = 3000;

export default function VoiceTool() {
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState("river");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  async function run() {
    if (busy || script.trim().length < 3) return;
    setBusy(true);
    try {
      const out = await generateVoiceover({ data: { script: script.trim(), voice } });
      setUrl(out.url || "");
    } catch (error) {
      toast.error(error?.message || "That voiceover could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <label className="eyebrow" htmlFor="script">
            Script
          </label>
          <span className="font-mono text-[11px] text-black/35">
            {script.length}/{LIMIT}
          </span>
        </div>
        <textarea
          id="script"
          value={script}
          onChange={(event) => setScript(event.target.value.slice(0, LIMIT))}
          rows={7}
          placeholder="He had one health left and the whole chat knew it."
          className="mt-2 w-full resize-none rounded-[16px] border border-black/12 bg-white px-4 py-3 text-[14px] leading-relaxed outline-none transition-colors focus:border-black"
        />

        <div className="mt-5">
          <OptionPills label="Voice" options={VOICE_OPTIONS} value={voice} onChange={setVoice} />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy || script.trim().length < 3}
          className="pill pill-primary mt-6"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {busy ? "Recording" : "Generate voiceover"}
        </button>
      </section>

      <section className="rounded-[22px] border border-black/10 bg-[#FAFAFA] p-5">
        <span className="eyebrow">Take</span>
        {url ? (
          <div className="mt-4">
            <audio controls src={url} className="w-full" />
            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              className="pill pill-ghost mt-4 h-9 px-4 text-[13px]"
            >
              Download MP3
            </a>
          </div>
        ) : (
          <p className="mt-4 text-[13px] leading-relaxed text-black/35">
            {busy ? "Synthesising the read." : "Your narration appears here, ready to download."}
          </p>
        )}
      </section>
    </div>
  );
}