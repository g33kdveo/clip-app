import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listCampaigns } from "@/lib/campaign-fns";
import { contentRewardsState } from "@/lib/contentrewards-fns";
import CampaignCard from "@/components/campaigns/CampaignCard";
import SyncPanel from "@/components/campaigns/SyncPanel";

export const Route = createFileRoute("/_authed/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaigns · Above Yellow" },
      {
        name: "description",
        content: "Reward campaigns, the clips submitted to them, and what each one owes.",
      },
    ],
  }),
  component: CampaignsHome,
});

function CampaignsHome() {
  const load = useServerFn(listCampaigns);
  const loadState = useServerFn(contentRewardsState);

  const [campaigns, setCampaigns] = useState([]);
  const [state, setState] = useState({ connected: false, syncedAt: "", syncedCampaigns: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [result, connection] = await Promise.all([load(), loadState()]);
    setCampaigns(result.campaigns || []);
    setState(connection);
  }, [load, loadState]);

  useEffect(() => {
    refresh()
      .catch((problem) => setError(problem?.message || "The campaigns could not be loaded."))
      .finally(() => setReady(true));
  }, [refresh]);

  return (
    <div className="mx-auto max-w-[1080px] pb-12 pt-8 sm:pt-12">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">My campaigns</span>
          <h1 className="brandmark mt-3 max-w-[22ch] text-[34px] leading-[0.98] sm:text-[46px]">
            Every campaign you've joined.
          </h1>
          <p className="mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-black/50">
            The campaigns you've joined on Content Rewards sync in with their clips, views and what
            each one owes you. Nothing to type in.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mt-5 rounded-[12px] bg-[#FDECEA] px-4 py-3 text-[12.5px] leading-snug text-[#A32D1E]">
          {error}
        </p>
      ) : null}

      <SyncPanel state={state} onSynced={refresh} />

      {!ready ? (
        <p className="mt-8 text-[13px] text-black/30">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <p className="mt-8 rounded-[16px] border border-dashed border-black/15 bg-[#FAFAFA] p-6 text-[13px] text-black/40">
          Nothing synced yet. Add the key, press Sync now, and the campaigns you've joined will
          appear here with their clips, views and rewards.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}