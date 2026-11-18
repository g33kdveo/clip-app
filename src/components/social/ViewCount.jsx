import { Play } from "lucide-react";
import { formatViews } from "@/lib/social";
import { cn } from "@/lib/utils";

export default function ViewCount({ views, tone = "dark", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] leading-none backdrop-blur",
        tone === "dark" ? "bg-black/60 text-white" : "bg-black/[0.05] text-black/55",
        className
      )}
    >
      <Play className="h-2.5 w-2.5" fill="currentColor" />
      {formatViews(views)}
    </span>
  );
}