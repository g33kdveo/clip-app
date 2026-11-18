import { useState } from "react";
import { Loader2, Shapes } from "lucide-react";
import { toast } from "sonner";
import { generateIconSet } from "@/lib/tools-fns";
import { Image } from "@/components/ui/image";
import OptionPills from "@/components/OptionPills";
import { VIBE_OPTIONS } from "@/lib/tools";

export default function IconTool() {
  const [brand, setBrand] = useState("");
  const [vibe, setVibe] = useState("bold");
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState([]);

  async function run() {
    if (busy || brand.trim().length < 2) return;
    setBusy(true);
    try {
      const out = await generateIconSet({ data: { brand: brand.trim(), vibe } });
      setUrls(out.urls || []);
    } catch (error) {
      toast.error(error?.message || "That icon set could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[22px] border border-black/10 bg-white p-5 sm:p-6">
        <label className="eyebrow" htmlFor="brand-name">
          Brand name
        </label>
        <input
          id="brand-name"
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          placeholder="Above Yellow"
          className="field mt-2"
        />

        <div className="mt-5">
          <OptionPills label="Direction" options={VIBE_OPTIONS} value={vibe} onChange={setVibe} />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy || brand.trim().length < 2}
          className="pill pill-primary mt-6"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shapes className="h-4 w-4" />}
          {busy ? "Drawing four marks" : "Generate icon set"}
        </button>
        <p className="mt-3 text-[12px] text-black/35">
          Four directions: monogram, subject symbol, abstract mark and a mascot.
        </p>
      </section>

      <section className="rounded-[22px] border border-black/10 bg-[#FAFAFA] p-4">
        <span className="eyebrow px-1">Marks</span>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(urls.length ? urls : [null, null, null, null]).map((url, index) => (
            <div
              key={url || index}
              className="relative aspect-square overflow-hidden rounded-[16px] border border-black/[0.06] bg-white"
            >
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" download>
                  <Image src={url} alt={`${brand} mark ${index + 1}`} className="h-full w-full object-cover" />
                </a>
              ) : (
                <div className="flex h-full items-center justify-center text-[12px] text-black/25">
                  {busy ? "…" : "—"}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}