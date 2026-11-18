import { ExternalLink, Trash2 } from "lucide-react";
import { PLATFORM, formatWhen, formatViews } from "@/lib/social";
import { SUB_STATUS, money, statusTone } from "@/lib/campaigns";
import { cn } from "@/lib/utils";

const NEXT = {
  submitted: [
    { value: "approved", label: "Approve" },
    { value: "rejected", label: "Reject" },
  ],
  approved: [{ value: "paid", label: "Mark paid" }],
  paid: [],
  rejected: [{ value: "submitted", label: "Reopen" }],
};

export default function SubmissionList({ clips, onStatus, onViews, onDelete }) {
  if (!clips.length) {
    return (
      <p className="rounded-[14px] border border-dashed border-black/15 bg-[#FAFAFA] p-5 text-[12.5px] text-black/40">
        No clips submitted yet. Paste a link above once one goes up.
      </p>
    );
  }

  return (
    <div className="divide-y divide-black/[0.07] overflow-hidden rounded-[16px] border border-black/10">
      {clips.map((clip) => (
        <div key={clip.id} className="flex flex-wrap items-center gap-3 bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/35">
                {PLATFORM[clip.platform]?.label || clip.platform}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em]",
                  statusTone(SUB_STATUS, clip.status)
                )}
              >
                {clip.status}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="truncate text-[13px] font-medium">
                {clip.creator || clip.title || "Clip"}
              </span>
              {clip.post_url ? (
                <a
                  href={clip.post_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-black/35 transition-colors hover:text-black"
                  aria-label="Open the post"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
            <span className="text-[11px] text-black/35">
              {clip.posted_at ? `${formatWhen(clip.posted_at)} · ` : ""}
              {formatViews(clip.views)} views
            </span>
          </div>

          <label className="flex items-center gap-1.5">
            <span className="sr-only">Views</span>
            <input
              type="number"
              min="0"
              defaultValue={clip.views || 0}
              onBlur={(event) => {
                const next = Number(event.target.value) || 0;
                if (next !== (clip.views || 0)) onViews(clip.id, next);
              }}
              className="h-9 w-[86px] rounded-[10px] border border-black/12 bg-white px-2 text-right text-[12.5px] outline-none focus:border-black"
            />
          </label>

          <span className="w-[74px] text-right text-[13px] font-semibold">{money(clip.payout)}</span>

          <div className="flex items-center gap-1.5">
            {(NEXT[clip.status] || []).map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => onStatus(clip.id, action.value)}
                className="rounded-full border border-black/15 px-2.5 py-1 text-[11.5px] font-medium text-black/60 transition-colors hover:border-black/40 hover:text-black"
              >
                {action.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onDelete(clip.id)}
              className="rounded-full p-1.5 text-black/25 transition-colors hover:bg-black/[0.05] hover:text-[#A32D1E]"
              aria-label="Remove submission"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}