import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { LAYOUT_LABEL } from "@/lib/design";

export default function ImportedList({ items }) {
  if (!items.length) return null;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">Ready to format</span>
        <span className="text-[11.5px] text-black/30">Captioned from the clip's own audio</span>
      </div>
      <ul className="mt-4 divide-y divide-black/[0.06] overflow-hidden rounded-[18px] border border-black/10">
        {items.map((item) => (
          <li key={item.clipId} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{item.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-black/40">
                <Check className="h-3 w-3 text-[#137A45]" />
                {LAYOUT_LABEL[item.layout] || "Full screen"} recommended
              </p>
            </div>
            <Link
              to="/clips/$clipId"
              params={{ clipId: item.clipId }}
              className="pill pill-ghost h-9 shrink-0 gap-1.5 px-3.5 text-[12.5px]"
            >
              Format
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}