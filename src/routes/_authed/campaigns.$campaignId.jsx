import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  addSubmission,
  deleteCampaign,
  deleteSubmission,
  loadCampaign,
  updateCampaign,
  updateSubmission,
} from "@/lib/campaign-fns";
import { formatViews } from "@/lib/social";
import { CAMPAIGN_STATUS, money, rewardLabel, statusTone } from "@/lib/campaigns";
import CampaignForm from "@/components/campaigns/CampaignForm";
import SubmissionForm from "@/components/campaigns/SubmissionForm";
import SubmissionList from "@/components/campaigns/SubmissionList";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/campaigns/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign · Above Yellow" },
      { name: "description", content: "The brief, the reward and every clip submitted." },
    ],
  }),
  component: CampaignPage,
});

function CampaignPage() {
  const { campaignId } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(loadCampaign);
  const save = useServerFn(updateCampaign);
  const remove = useServerFn(deleteCampaign);
  const addClip = useServerFn(addSubmission);
  const patchClip = useServerFn(updateSubmission);
  const removeClip = useServerFn(deleteSubmission);

  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const result = await load({ data: { id: campaignId } });
    if (!result) {
      setMissing(true);
      return;
    }
    setData(result);
  }, [load, campaignId]);

  useEffect(() => {
    refresh().catch((problem) => setError(problem?.message || "The campaign could not be loaded."));
  }, [refresh]);

  const guard = async (work) => {
    setError("");
    try {
      await work();
      await refresh();
    } catch (problem) {
      setError(problem?.message || "That change could not be saved.");
    }
  };

  if (missing) {
    return (
      <div className="mx-auto max-w-[640px] pt-16">
        <p className="text-[14px] text-black/50">That campaign no longer exists.</p>
        <Link to="/campaigns" className="pill pill-ghost mt-4 h-9 px-4 text-[13px]">
          Back to campaigns
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="mx-auto max-w-[1080px] pt-16 text-[13px] text-black/30">Opening…</p>;
  }

  const { campaign, clips } = data;
  const paid = clips
    .filter((clip) => clip.status === "paid")
    .reduce((sum, clip) => sum + (Number(clip.payout) || 0), 0);
  const owed = clips
    .filter((clip) => clip.status !== "paid" && clip.status !== "rejected")
    .reduce((sum, clip) => sum + (Number(clip.payout) || 0), 0);
  const earned = paid + owed;
  const share = earned > 0 ? Math.min(100, (paid / earned) * 100) : 0;
  const views = clips
    .filter((clip) => clip.status !== "rejected")
    .reduce((sum, clip) => sum + (Number(clip.views) || 0), 0);

  const onSave = async (payload) => {
    setBusy(true);
    await guard(async () => {
      await save({ data: { id: campaign.id, patch: payload } });
      setEditing(false);
    });
    setBusy(false);
  };

  const onAdd = async (payload) => {
    setAdding(true);
    await guard(() => addClip({ data: { campaign_id: campaign.id, ...payload } }));
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-[1080px] pb-12 pt-8 sm:pt-12">
      <Link
        to="/campaigns"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-black/40 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Campaigns
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">{campaign.brand || "Campaign"}</span>
          <h1 className="brandmark mt-2 max-w-[24ch] text-[30px] leading-[1.02] sm:text-[40px]">
            {campaign.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
                statusTone(CAMPAIGN_STATUS, campaign.status)
              )}
            >
              {campaign.status}
            </span>
            <span className="text-[12px] text-black/40">{rewardLabel(campaign.rate_per_1k)}</span>
            {campaign.ends_on ? (
              <span className="text-[12px] text-black/40">Ends {campaign.ends_on}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="pill pill-ghost h-9 px-3.5 text-[12.5px]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() =>
              guard(async () => {
                await remove({ data: { id: campaign.id } });
                navigate({ to: "/campaigns" });
              })
            }
            className="pill pill-ghost h-9 px-3 text-[12.5px] text-[#A32D1E]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </header>

      {error ? (
        <p className="mt-5 rounded-[12px] bg-[#FDECEA] px-4 py-3 text-[12.5px] leading-snug text-[#A32D1E]">
          {error}
        </p>
      ) : null}

      {editing ? (
        <section className="mt-6 rounded-[20px] border border-black/10 bg-white p-5">
          <CampaignForm
            campaign={campaign}
            onSubmit={onSave}
            onCancel={() => setEditing(false)}
            busy={busy}
            submitLabel="Save campaign"
          />
        </section>
      ) : (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[20px] border border-black/10 bg-white p-5">
            <span className="eyebrow">Brief</span>
            <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-black/60">
              {campaign.brief || "No brief yet. Add one so a clipper knows what to look for."}
            </p>
            {campaign.rules ? (
              <>
                <span className="eyebrow mt-4 block">Rules</span>
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-black/50">
                  {campaign.rules}
                </p>
              </>
            ) : null}
            {campaign.source_url ? (
              <a
                href={campaign.source_url}
                target="_blank"
                rel="noreferrer"
                className="pill pill-ghost mt-4 h-9 px-4 text-[12.5px]"
              >
                Open the source
              </a>
            ) : null}
          </div>

          <div className="rounded-[20px] border border-black/10 bg-white p-5">
            <span className="eyebrow">My earnings</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[26px] font-semibold leading-none">{money(earned)}</span>
              <span className="text-[12.5px] text-black/40">from {clips.length} clips</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.07]">
              <div className="h-full rounded-full bg-[#FED50C]" style={{ width: `${share}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
                  Pending
                </span>
                <span className="font-semibold">{money(owed)}</span>
              </div>
              <div>
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
                  Paid
                </span>
                <span className="font-semibold">{money(paid)}</span>
              </div>
              <div>
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
                  Views
                </span>
                <span className="font-semibold">{formatViews(views)}</span>
              </div>
              <div>
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-black/35">
                  My rate
                </span>
                <span className="font-semibold">{money(campaign.rate_per_1k)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Clips</h2>
          <span className="text-[11.5px] text-black/35">{clips.length} submitted</span>
        </div>
        <div className="mt-2.5">
          <SubmissionForm
            platforms={campaign.platforms || []}
            rate={campaign.rate_per_1k}
            onSubmit={onAdd}
            busy={adding}
          />
        </div>
        <div className="mt-3">
          <SubmissionList
            clips={clips}
            onStatus={(id, status) => guard(() => patchClip({ data: { id, patch: { status } } }))}
            onViews={(id, value) => guard(() => patchClip({ data: { id, patch: { views: value } } }))}
            onDelete={(id) => guard(() => removeClip({ data: { id } }))}
          />
        </div>
      </section>
    </div>
  );
}