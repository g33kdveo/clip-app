import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateImageTool } from "@/lib/tools-fns";
import { Image } from "@/components/ui/image";
import OptionPills from "@/components/OptionPills";
import { RATIO_OPTIONS, STYLE_OPTIONS } from "@/lib/tools";

export default function ImageTool() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("none");
  const [ratio, setRatio] = useState("9:16");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function run() {
    if (busy || prompt.trim().length < 3) return;
    setBusy(true);
    try {
      const out = await generateImageTool({ data: { prompt: prompt.trim(), style, ratio } });
      setResult(out);
    } catch (error) {
      toast.error(error?.message || "That image could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6">
        <label className="eyebrow" htmlFor="image-prompt">
          Prompt
        </label>
        <textarea
          id="image-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="A streamer's neon-lit desk at 2am, headphones on a stand, city window behind"
          className="mt-2 w-full resize-none rounded-[16px] border border-black/12 bg-white px-4 py-3 text-[14px] leading-relaxed outline-none transition-colors focus:border-black"
        />

        <div className="mt-5 flex flex-wrap gap-5">
          <OptionPills label="Style" options={STYLE_OPTIONS} value={style} onChange={setStyle} />
          <OptionPills label="Frame" options={RATIO_OPTIONS} value={ratio} onChange={setRatio} />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy || prompt.trim().length < 3}
          className="pill pill-primary mt-6"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Generating" : result ? "Generate again" : "Generate image"}
        </button>
        <p className="mt-3 text-[12px] text-black/35">
          Every image is saved to your library automatically.
        </p>
      </section>

      <section className="rounded-[22px] border border-black/10 bg-[#FAFAFA] p-4">
        <div className="flex items-center justify-between px-1 pb-3">
          <span className="eyebrow">Result</span>
          {result?.url ? (
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              download
              className="text-[12px] font-semibold text-black/60 hover:text-black"
            >
              Download
            </a>
          ) : null}
        </div>

        <div className="relative aspect-[9/16] overflow-hidden rounded-[16px] bg-white">
          {result?.url ? (
            <Image src={result.url} alt={prompt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="pulse-soft text-[13px] text-black/30">
                {busy ? "Painting your prompt" : "Your image lands here"}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}