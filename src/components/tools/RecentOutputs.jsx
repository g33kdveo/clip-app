import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const LABEL = {
  image: "Image",
  icon: "Icons",
  voiceover: "Voice",
  brainstorm: "Ideas",
};

const TINT = {
  image: "bg-[#EEF3FF] text-[#2962FF]",
  icon: "bg-[#F4EEFF] text-[#6D28D9]",
  voiceover: "bg-[#EAF7EF] text-[#137A45]",
  brainstorm: "bg-[#FFF6D9] text-[#8A6A00]",
};

export default function RecentOutputs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.ToolOutput.list({ sort: "-created_date", limit: 8 })
      .then((page) => {
        if (alive) setItems(page?.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <p className="text-[13px] text-black/30">Loading your library…</p>;
  }

  if (!items.length) {
    return (
      <p className="rounded-[18px] border border-dashed border-black/12 px-5 py-8 text-center text-[13px] text-black/35">
        Nothing yet. Anything you make in a tool is saved here automatically.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="lift overflow-hidden rounded-[16px] border border-black/10 bg-white"
        >
          <div className="relative aspect-square bg-[#FAFAFA]">
            {item.tool === "voiceover" ? (
              <div className="flex h-full items-center justify-center px-3">
                <audio controls src={item.url} className="w-full" />
              </div>
            ) : item.tool === "brainstorm" ? (
              <div className="flex h-full flex-col justify-between p-3">
                <span
                  className={cn(
                    "self-start rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em]",
                    TINT[item.tool]
                  )}
                >
                  {LABEL[item.tool]}
                </span>
                <p className="line-clamp-4 text-[11.5px] leading-snug text-black/55">{item.title}</p>
              </div>
            ) : (
              <Image src={item.url} alt={item.title} className="h-full w-full object-cover" />
            )}
          </div>
          <p className="line-clamp-2 px-2.5 py-2 text-[11.5px] leading-snug text-black/55">
            {item.title || LABEL[item.tool]}
          </p>
        </article>
      ))}
    </div>
  );
}