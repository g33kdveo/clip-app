import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { formatDuration } from "@/lib/design";
import { cn } from "@/lib/utils";

const STATUS = {
  draft: { label: "Draft", tone: "text-black/45 bg-black/[0.05]" },
  fetching: { label: "Fetching", tone: "text-black/60 bg-black/[0.06]" },
  resolving: { label: "Reading link", tone: "text-black/60 bg-black/[0.06]" },
  transcribing: { label: "Transcribing", tone: "text-black/60 bg-black/[0.06]" },
  picking: { label: "Picking moments", tone: "text-black/60 bg-black/[0.06]" },
  rendering: { label: "Rendering", tone: "text-black/60 bg-black/[0.06]" },
  ready: { label: "Ready", tone: "text-black bg-[#FED50C]" },
  failed: { label: "Failed", tone: "text-white bg-[#C0392B]" },
  needs_file: { label: "Needs file", tone: "text-black/60 bg-black/[0.06]" },
};

export default function JobCard({ job }) {
  const status = STATUS[job.status] || STATUS.draft;

  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="lift group block rounded-[20px] border border-black/10 bg-white p-2"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-[14px] bg-[#F5F5F5]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-black/60 transition-transform duration-300 group-hover:scale-105">
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
          </span>
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
          {job.source_type === "upload" ? "File" : "Link"}
        </span>
        {job.duration ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-0.5 font-mono text-[10px] text-black/70">
            {formatDuration(job.duration)}
          </span>
        ) : null}
      </div>

      <div className="px-2 pb-2 pt-3">
        <p className="line-clamp-2 text-[14.5px] font-semibold leading-snug tracking-[-0.01em]">
          {job.title || "Untitled source"}
        </p>
        <p className="mt-1 truncate text-[12px] text-black/40">
          {job.channel ? job.channel : "No channel read"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/35">
            {job.clip_count || 0} clips
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]",
              status.tone
            )}
          >
            {status.label}
          </span>
        </div>
      </div>
    </Link>
  );
}