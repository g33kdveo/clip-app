import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth-middleware";
import {
  contentRewardsKey,
  fetchMyCampaigns,
  fetchMySubmissions,
  mapCampaign,
  mapSubmission,
} from "@/lib/contentrewards.server";

function payoutFor(views, rate) {
  return Math.round(((Number(views) || 0) / 1000) * (Number(rate) || 0) * 100) / 100;
}

export const contentRewardsState = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const campaigns = await base44.entities.Campaign.list("-created_date", 200);
    const synced = campaigns.filter((campaign) => campaign.source === "contentrewards");
    const last = synced
      .map((campaign) => campaign.last_synced_at || "")
      .filter(Boolean)
      .sort()
      .pop();

    return {
      connected: Boolean(contentRewardsKey()),
      syncedCampaigns: synced.length,
      syncedAt: last || "",
    };
  });

// Pulls the campaigns this account joined on Content Rewards (Whop Content
// Rewards and REACH both run on it) and their submissions, then stores both.
export const syncContentRewards = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const key = contentRewardsKey();
    if (!key) {
      return {
        connected: false,
        campaigns: 0,
        submissions: 0,
        message: "Add CONTENT_REWARDS_API_KEY on the app dashboard's Secrets page, then sync.",
      };
    }

    const base44 = context.getBase44();
    const now = new Date().toISOString();

    const remoteCampaigns = (await fetchMyCampaigns(key))
      .map(mapCampaign)
      .filter((campaign) => campaign.external_id);

    const existing = await base44.entities.Campaign.list("-created_date", 300);
    const byExternal = new Map(
      existing
        .filter((campaign) => campaign.external_id)
        .map((campaign) => [campaign.external_id, campaign])
    );

    const toCreate = [];
    const toUpdate = [];
    remoteCampaigns.forEach((campaign) => {
      const match = byExternal.get(campaign.external_id);
      if (match) toUpdate.push({ id: match.id, ...campaign, last_synced_at: now });
      else toCreate.push({ ...campaign, budget: 0, last_synced_at: now });
    });

    const created = toCreate.length ? await base44.entities.Campaign.bulkCreate(toCreate) : [];
    if (toUpdate.length) await base44.entities.Campaign.bulkUpdate(toUpdate);

    const campaignIdByExternal = new Map(
      [...byExternal].map(([external, campaign]) => [external, campaign.id])
    );
    (Array.isArray(created) ? created : []).forEach((campaign) => {
      if (campaign?.external_id) campaignIdByExternal.set(campaign.external_id, campaign.id);
    });

    const rateByCampaign = new Map(
      remoteCampaigns
        .map((campaign) => [
          campaignIdByExternal.get(campaign.external_id),
          Number(campaign.rate_per_1k) || 0,
        ])
        .filter(([id]) => Boolean(id))
    );

    const remoteSubs = (await fetchMySubmissions(key))
      .map(mapSubmission)
      .filter((sub) => sub.external_id && sub.campaign_external_id && sub.platform);

    const existingClips = await base44.entities.CampaignClip.list("-created_date", 500);
    const clipByExternal = new Map(
      existingClips
        .filter((clip) => clip.external_id)
        .map((clip) => [clip.external_id, clip])
    );

    const clipCreate = [];
    const clipUpdate = [];
    remoteSubs.forEach((sub) => {
      const campaignId = campaignIdByExternal.get(sub.campaign_external_id);
      if (!campaignId) return;

      const rate = rateByCampaign.get(campaignId) || 0;
      const pays = sub.status === "approved" || sub.status === "paid";
      const row = {
        campaign_id: campaignId,
        platform: sub.platform,
        post_url: sub.post_url,
        title: sub.title,
        views: sub.views,
        likes: sub.likes,
        status: sub.status,
        payout: pays ? payoutFor(sub.views, rate) : 0,
        external_id: sub.external_id,
      };
      if (sub.posted_at) row.posted_at = sub.posted_at;

      const match = clipByExternal.get(sub.external_id);
      if (match) clipUpdate.push({ id: match.id, ...row });
      else clipCreate.push(row);
    });

    if (clipCreate.length) await base44.entities.CampaignClip.bulkCreate(clipCreate);
    if (clipUpdate.length) await base44.entities.CampaignClip.bulkUpdate(clipUpdate);

    const campaigns = toCreate.length + toUpdate.length;
    return {
      connected: true,
      campaigns,
      submissions: clipCreate.length + clipUpdate.length,
      syncedAt: now,
      message: campaigns
        ? `${campaigns} campaign${campaigns === 1 ? "" : "s"} and ${
            clipCreate.length + clipUpdate.length
          } submission${clipCreate.length + clipUpdate.length === 1 ? "" : "s"} synced.`
        : "The key is connected, but it reads no joined campaigns yet.",
    };
  });