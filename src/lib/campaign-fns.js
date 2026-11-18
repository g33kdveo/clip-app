import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const PLATFORM = z.enum(["youtube", "instagram", "tiktok", "x"]);
const STATUS = z.enum(["draft", "live", "paused", "ended"]);

const campaignShape = {
  name: z.string().min(1).max(160),
  brand: z.string().max(160).optional(),
  brief: z.string().max(2000).optional(),
  source_url: z.string().max(2000).optional(),
  source_channel: z.string().max(200).optional(),
  platforms: z.array(PLATFORM).max(4).optional(),
  rate_per_1k: z.number().min(0).max(100000).optional(),
  budget: z.number().min(0).max(100000000).optional(),
  status: STATUS.optional(),
  starts_on: z.string().max(20).optional(),
  ends_on: z.string().max(20).optional(),
  rules: z.string().max(2000).optional(),
};

function payoutFor(views, rate) {
  return Math.round(((Number(views) || 0) / 1000) * (Number(rate) || 0) * 100) / 100;
}

// One read for the whole list: every campaign with its submissions, tallied.
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const campaigns = await base44.entities.Campaign.list("-created_date", 60);
    const clips = await base44.entities.CampaignClip.list("-created_date", 400);

    const rows = campaigns.map((campaign) => {
      const own = clips.filter((clip) => clip.campaign_id === campaign.id);
      const live = own.filter((clip) => clip.status !== "rejected");
      return {
        ...campaign,
        clips: own.length,
        views: live.reduce((sum, clip) => sum + (Number(clip.views) || 0), 0),
        owed: live
          .filter((clip) => clip.status !== "paid")
          .reduce((sum, clip) => sum + (Number(clip.payout) || 0), 0),
        paid: own
          .filter((clip) => clip.status === "paid")
          .reduce((sum, clip) => sum + (Number(clip.payout) || 0), 0),
      };
    });

    return { campaigns: rows };
  });

export const loadCampaign = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const campaign = await base44.entities.Campaign.get(data.id).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!campaign) return null;
    const clips = await base44.entities.CampaignClip.filter({ campaign_id: campaign.id });
    return { campaign, clips };
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object(campaignShape))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    return base44.entities.Campaign.create({
      status: "draft",
      platforms: [],
      rate_per_1k: 0,
      budget: 0,
      ...data,
    });
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().min(1).max(120),
      patch: z
        .object({
          ...campaignShape,
          name: z.string().min(1).max(160).optional(),
        })
        .strict(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const campaign = await base44.entities.Campaign.update(data.id, data.patch);

    // The rate changed, so every unpaid reward is worth re-counting.
    if (data.patch.rate_per_1k !== undefined) {
      const clips = await base44.entities.CampaignClip.filter({ campaign_id: data.id });
      const changed = clips
        .filter((clip) => clip.status !== "paid")
        .map((clip) => ({
          id: clip.id,
          payout: payoutFor(clip.views, data.patch.rate_per_1k),
        }));
      if (changed.length) await base44.entities.CampaignClip.bulkUpdate(changed);
    }

    return campaign;
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    await base44.entities.CampaignClip.deleteMany({ campaign_id: data.id });
    await base44.entities.Campaign.delete(data.id);
    return { ok: true };
  });

export const addSubmission = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      campaign_id: z.string().min(1).max(120),
      platform: PLATFORM,
      post_url: z.string().min(4).max(2000),
      creator: z.string().max(120).optional(),
      title: z.string().max(600).optional(),
      views: z.number().min(0).max(10000000000).optional(),
      likes: z.number().min(0).max(10000000000).optional(),
      posted_at: z.string().max(20).optional(),
      note: z.string().max(600).optional(),
      clip_id: z.string().max(120).optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const campaign = await base44.entities.Campaign.get(data.campaign_id);
    if (!campaign) throw new Error("That campaign no longer exists.");

    return base44.entities.CampaignClip.create({
      ...data,
      payout: payoutFor(data.views, campaign.rate_per_1k),
      status: "submitted",
    });
  });

export const updateSubmission = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().min(1).max(120),
      patch: z
        .object({
          views: z.number().min(0).max(10000000000).optional(),
          likes: z.number().min(0).max(10000000000).optional(),
          status: z.enum(["submitted", "approved", "paid", "rejected"]).optional(),
          note: z.string().max(600).optional(),
          title: z.string().max(600).optional(),
        })
        .strict(),
    })
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const clip = await base44.entities.CampaignClip.get(data.id);
    if (!clip) throw new Error("That submission no longer exists.");

    const patch = { ...data.patch };
    if (patch.views !== undefined) {
      const campaign = await base44.entities.Campaign.get(clip.campaign_id);
      patch.payout = payoutFor(patch.views, campaign?.rate_per_1k);
    }
    return base44.entities.CampaignClip.update(data.id, patch);
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(120) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    await base44.entities.CampaignClip.delete(data.id);
    return { ok: true };
  });