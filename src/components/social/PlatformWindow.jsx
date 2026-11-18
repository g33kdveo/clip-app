import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PLATFORM } from "@/lib/social";

function Motif({ layout }) {
  if (layout === "square") {
    return (
      <div className="grid w-[74px] grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="aspect-square rounded-[2px] bg-black/10" />
        ))}
      </div>
    );
  }
  if (layout === "tall") {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <span key={index} className="h-[52px] w-[26px] rounded-[3px] bg-black/10" />
        ))}
      </div>
    );
  }
  if (layout === "timeline") {
    return (
      <div className="w-[86px] space-y-1.5">
        {[1, 0.8, 0.62].map((width, index) => (
          <span
            key={index}
            className="block h-[7px] rounded-full bg-black/10"
            style={{ width: `${width * 100}%` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid w-[96px] grid-cols-2 gap-1">
      {Array.from({ length: 2 }).map((_, index) => (
        <span key={index} className="aspect-video rounded-[3px] bg-black/10" />
      ))}
    </div>
  );
}

export default function PlatformWindow({ platform, accounts }) {
  const meta = PLATFORM[platform];
  const tracked = accounts.filter((account) => account.platform === platform);
  const handles = tracked.slice(0, 3).map((account) => `@${account.handle}`);

  return (
    <Link
      to="/accounts/$platform"
      params={{ platform }}
      className="lift flex flex-col rounded-[20px] border border-black/10 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="brandmark text-[20px]">{meta.heading}</h2>
          <p className="mt-1 text-[11.5px] leading-snug text-black/40">{meta.blurb}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-black/20" />
      </div>

      <div className="mt-5 flex h-[56px] items-center">
        <Motif layout={meta.layout} />
      </div>

      <div className="mt-auto pt-5">
        {tracked.length ? (
          <p className="truncate text-[12px] text-black/50">
            {handles.join(" · ")}
            {tracked.length > 3 ? ` +${tracked.length - 3}` : ""}
          </p>
        ) : (
          <p className="text-[12px] text-black/30">No account tracked yet</p>
        )}
        {meta.attribution ? (
          <p className="mt-1 text-[10.5px] text-black/25">{meta.attribution}</p>
        ) : null}
      </div>
    </Link>
  );
}