import { Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function TwitchClips({ clips, picked, onToggle }) {
  const best = [...clips]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)
    .map((clip) => clip.id);

  if (!clips.length) {
    return (
      <p className="mt-4 rounded-[18px] border border-dashed border-black/15 bg-[#FAFAFA] p-6 text-[13px] text-black/40">
        No clips from this creator yet. Their moments land here as soon as they're clipped.
      </p>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clips.map((clip) => {
        const on = picked.includes(clip.id);
        return (
          <div
            key={clip.id}
            className={cn(
              "overflow-hidden rounded-[18px] border bg-white transition-all",
              on
                ? "border-black/70 shadow-[0_0_22px_-6px_rgba(254,213,12,1)]"
                : "border-black/10 hover:border-black/25"
            )}
          >
            <a href={clip.url} target="_blank" rel="noreferrer" className="relative block">
              <div className="relative aspect-video overflow-hidden bg-[#F5F5F5]">
                <Image
                  src={clip.thumbnail}
                  alt={clip.title}
                  className="h-full w-full"
                  fittingType="fill"
                />
                {clip.duration ? (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-0.5 font-mono text-[10px] text-white">
                    {clip.duration}
                  </span>
                ) : null}
              </div>
              {best.includes(clip.id) ? (
                <span className="absolute left-2 top-2 rounded-full bg-[#FED50C] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-black">
                  Top pick
                </span>
              ) : null}
            </a>

            <button
              type="button"
              onClick={() => onToggle(clip.id)}
              aria-pressed={on}
              className="flex w-full items-start gap-2.5 p-3 text-left"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border",
                  on ? "border-black bg-black text-white" : "border-black/25 bg-white"
                )}
              >
                {on ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 block text-[13px] font-semibold leading-snug">
                  {clip.title}
                </span>
                <span className="mt-1 block text-[11.5px] text-black/40">
                  {clip.views.toLocaleString("en-US")} views
                  {clip.creator ? ` · clipped by ${clip.creator}` : ""}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}