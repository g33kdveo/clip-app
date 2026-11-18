import { ExternalLink } from "lucide-react";
import { Image } from "@/components/ui/image";
import { formatViews } from "@/lib/social";
import { cn } from "@/lib/utils";

function uptime(startedAt) {
  if (!startedAt) return "";
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - started) / 60000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m live` : `${minutes}m live`;
}

function thumb(url) {
  return url ? url.replace("{width}", "640").replace("{height}", "360") : "";
}

export default function CreatorCard({ creator, campaignName, selected, onSelect }) {
  const preview = thumb(creator.thumbnail_url);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border bg-white transition-colors",
        creator.live ? "border-[#E8254A]/35" : "border-black/10",
        selected && "ring-2 ring-black"
      )}
    >
      <div className="relative aspect-video bg-[#F5F5F5]">
        {creator.live && preview ? (
          <Image src={preview} alt={creator.display_name} className="h-full w-full" fittingType="fill" />
        ) : creator.avatar_url ? (
          <div className="flex h-full items-center justify-center bg-[#FAFAFA]">
            <Image
              src={creator.avatar_url}
              alt={creator.display_name}
              className="h-16 w-16 rounded-full"
              fittingType="fill"
            />
          </div>
        ) : null}

        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold",
            creator.live ? "bg-[#E8254A] text-white" : "bg-black/60 text-white/80"
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full bg-white", creator.live && "pulse-soft")}
          />
          {creator.live ? "Live" : "Offline"}
        </span>

        {creator.live ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
            {formatViews(creator.viewers)} watching
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight">{creator.display_name}</p>
            <p className="mt-0.5 truncate text-[11.5px] text-black/40">
              {creator.live
                ? [creator.live_game, uptime(creator.started_at)].filter(Boolean).join(" · ")
                : campaignName || "Not live right now"}
            </p>
          </div>
          <a
            href={creator.profile_url || `https://www.twitch.tv/${creator.login}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full p-1.5 text-black/30 transition-colors hover:text-black"
            aria-label={`Open ${creator.display_name} on Twitch`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {creator.live && creator.live_title ? (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-black/60">
            {creator.live_title}
          </p>
        ) : null}

        {campaignName ? (
          <span className="mt-2.5 inline-flex w-fit max-w-full items-center truncate rounded-full bg-[#FED50C]/25 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-black/60">
            {campaignName}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onSelect}
          className="pill pill-ghost mt-3 h-9 w-full justify-center text-[12.5px]"
        >
          {selected ? "Showing clips" : "Clip their moments"}
        </button>
      </div>
    </div>
  );
}