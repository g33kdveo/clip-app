import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { formatViews } from "@/lib/social";
import { CAMPAIGN_STATUS, money, rewardLabel, statusTone } from "@/lib/campaigns";
import { cn } from "@/lib/utils";

export default function CampaignCard({ campaign }) {
  const paid = Number(campaign.paid) || 0;
  const owed = Number(campaign.owed) || 0;
  const earned = paid + owed;
  const share = earned > 0 ? Math.min(100, (paid / earned) * 100) : 0;

  return (
    <Link
      to="/campaigns/$campaignId"
      params={{ campaignId: campaign.id }}
      className="lift flex flex-col rounded-[20px] border border-black/10 bg-white p-5 transition-colors hover:border-black/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">{campaign.brand || "Campaign"}</span>
          <h2 className="mt-1.5 text-[17px] font-semibold leading-tight">{campaign.name}</h2>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
            statusTone(CAMPAIGN_STATUS, campaign.status)
          )}
        >
          {campaign.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-black/[0.07] pt-3">
        <div>
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
            My clips
          </span>
          <span className="text-[14px] font-semibold">{campaign.clips || 0}</span>
        </div>
        <div>
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
            Views
          </span>
          <span className="text-[14px] font-semibold">{formatViews(campaign.views)}</span>
        </div>
        <div>
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
            Earned
          </span>
          <span className="text-[14px] font-semibold">{money(earned)}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
          <div className="h-full rounded-full bg-[#FED50C]" style={{ width: `${share}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-black/35">
          <span>{rewardLabel(campaign.rate_per_1k)}</span>
          <span className="inline-flex items-center gap-1 font-medium text-black/50">
            {owed > 0 ? `${money(owed)} pending` : `${money(paid)} paid`}
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}