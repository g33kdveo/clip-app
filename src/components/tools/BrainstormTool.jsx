import { useState } from "react";
import { Copy, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { brainstorm } from "@/lib/tools-fns";
import OptionPills from "@/components/OptionPills";
import { PLATFORM_OPTIONS, TONE_OPTIONS } from "@/lib/tools";

export default function BrainstormTool() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [tone, setTone] = useState("punchy");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);

  async function go() {
    if (busy || topic.trim().length < 2) return;
    setBusy(true);
    try {
      const result = await brainstorm({ data: { topic: topic.trim(), audience, platform, tone } });
      setOut(result);
    } catch (error) {
      toast.error(error?.message || "Ideas could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  function copy(text) {
    navigator.clipboard?.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <section className="rounded-[22px] border border-black/10 bg-white p-5">
        <label className="eyebrow" htmlFor="topic">
          Topic or niche
        </label>
        <input
          id="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="GTA VI chaos, first playthrough"
          className="field mt-2"
        />

        <label className="eyebrow mt-5 block" htmlFor="audience">
          Audience <span className="normal-case tracking-normal text-black/25">optional</span>
        </label>
        <input
          id="audience"
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
          placeholder="GTA roleplay viewers, 18-24"
          className="field mt-2"
        />

        <div className="mt-5">
          <OptionPills label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={setPlatform} />
        </div>
        <div className="mt-4">
          <OptionPills label="Tone" options={TONE_OPTIONS} value={tone} onChange={setTone} />
        </div>

        <button
          type="button"
          onClick={go}
          disabled={busy || topic.trim().length < 2}
          className="pill pill-primary mt-6 w-full"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
          {busy ? "Thinking" : "Generate ideas"}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        {out?.ideas?.length ? (
          <>
            {out.ideas.map((idea, index) => (
              <article
                key={`${idea.title}-${index}`}
                className="rise rounded-[18px] border border-black/10 bg-white p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                    {idea.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => copy(`${idea.title}\n\nHook: ${idea.hook}\n\n${idea.moment}`)}
                    className="rounded-full p-1.5 text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black"
                    aria-label="Copy idea"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.02em] text-black/75">
                  “{idea.hook}”
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-black/45">{idea.moment}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-black/35">{idea.why}</p>
              </article>
            ))}

            {out.openers?.length ? (
              <article className="rounded-[18px] border border-black/10 bg-[#FFF6D9] p-4 sm:p-5">
                <span className="eyebrow">Opening lines</span>
                <ul className="mt-3 flex flex-col gap-2">
                  {out.openers.map((line, index) => (
                    <li key={index} className="text-[13.5px] leading-snug">
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-[22px] border border-dashed border-black/12 px-6 text-center text-[13.5px] leading-relaxed text-black/35">
            {busy
              ? "Reading the room and drafting ideas."
              : "Eight clip ideas and five opening lines land here."}
          </div>
        )}
      </section>
    </div>
  );
}