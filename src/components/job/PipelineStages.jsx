import { cn } from "@/lib/utils";

const STAGES = [
  { id: "resolving", label: "Source" },
  { id: "transcribing", label: "Transcript" },
  { id: "picking", label: "Moments" },
  { id: "ready", label: "Review" },
];

export default function PipelineStages({ status, note }) {
  const stuck = status === "failed" || status === "needs_file";
  const reached = STAGES.findIndex((stage) => stage.id === status);
  const current = stuck ? -1 : Math.max(0, reached);

  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[16px] border border-black/10 px-4 py-3">
      {STAGES.map((stage, index) => {
        const done = !stuck && (status === "ready" || index < current);
        const active = !stuck && status !== "ready" && index === current;
        return (
          <span key={stage.id} className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                done ? "bg-[#FED50C]" : active ? "bg-black/30 pulse-soft" : "bg-black/15"
              )}
            />
            <span
              className={cn(
                "font-mono text-[10.5px] uppercase tracking-[0.1em]",
                done || active ? "text-black/70" : "text-black/30"
              )}
            >
              {stage.label}
            </span>
          </span>
        );
      })}
      <span className="ml-auto max-w-full text-[12px] text-black/45">{note}</span>
    </div>
  );
}