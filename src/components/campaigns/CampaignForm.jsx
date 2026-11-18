import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PLATFORMS } from "@/lib/social";
import { CAMPAIGN_STATUS } from "@/lib/campaigns";
import { cn } from "@/lib/utils";

const EMPTY = {
  name: "",
  brand: "",
  brief: "",
  source_channel: "",
  source_url: "",
  rate_per_1k: "",
  budget: "",
  status: "draft",
  starts_on: "",
  ends_on: "",
  rules: "",
  platforms: [],
};

function toForm(campaign) {
  if (!campaign) return EMPTY;
  return {
    name: campaign.name || "",
    brand: campaign.brand || "",
    brief: campaign.brief || "",
    source_channel: campaign.source_channel || "",
    source_url: campaign.source_url || "",
    rate_per_1k: campaign.rate_per_1k ? String(campaign.rate_per_1k) : "",
    budget: campaign.budget ? String(campaign.budget) : "",
    status: campaign.status || "draft",
    starts_on: campaign.starts_on || "",
    ends_on: campaign.ends_on || "",
    rules: campaign.rules || "",
    platforms: campaign.platforms || [],
  };
}

export default function CampaignForm({ campaign, onSubmit, onCancel, busy, submitLabel = "Save" }) {
  const [form, setForm] = useState(() => toForm(campaign));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const togglePlatform = (id) =>
    set(
      "platforms",
      form.platforms.includes(id)
        ? form.platforms.filter((item) => item !== id)
        : [...form.platforms, id]
    );

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      brand: form.brand.trim(),
      brief: form.brief.trim(),
      source_channel: form.source_channel.trim(),
      source_url: form.source_url.trim(),
      rate_per_1k: Number(form.rate_per_1k) || 0,
      budget: Number(form.budget) || 0,
      status: form.status,
      starts_on: form.starts_on,
      ends_on: form.ends_on,
      rules: form.rules.trim(),
      platforms: form.platforms,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Campaign name</span>
          <input
            className="field mt-1.5 h-11 rounded-[12px]"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Dana White podcast clips"
            required
          />
        </label>
        <label className="block">
          <span className="eyebrow">Who runs it</span>
          <input
            className="field mt-1.5 h-11 rounded-[12px]"
            value={form.brand}
            onChange={(event) => set("brand", event.target.value)}
            placeholder="Creator or agency paying out"
          />
        </label>
      </div>

      <label className="block">
        <span className="eyebrow">Brief</span>
        <textarea
          className="mt-1.5 w-full resize-y rounded-[12px] border border-black/12 bg-white p-3 text-[13px] leading-relaxed"
          rows={3}
          value={form.brief}
          onChange={(event) => set("brief", event.target.value)}
          placeholder="The moments you want: reactions, hot takes, big plays."
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Source creator</span>
          <input
            className="field mt-1.5 h-11 rounded-[12px]"
            value={form.source_channel}
            onChange={(event) => set("source_channel", event.target.value)}
            placeholder="Channel or creator name"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Source link</span>
          <input
            className="field mt-1.5 h-11 rounded-[12px]"
            value={form.source_url}
            onChange={(event) => set("source_url", event.target.value)}
            placeholder="https://…"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="eyebrow">My rate per 1k views</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="field mt-1.5 h-11 rounded-[12px]"
            value={form.rate_per_1k}
            onChange={(event) => set("rate_per_1k", event.target.value)}
            placeholder="1.50"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Pool (optional)</span>
          <input
            type="number"
            min="0"
            step="1"
            className="field mt-1.5 h-11 rounded-[12px]"
            value={form.budget}
            onChange={(event) => set("budget", event.target.value)}
            placeholder="500"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Status</span>
          <select
            className="mt-1.5 h-11 w-full appearance-none rounded-[12px] border border-black/12 bg-white px-3 text-[13.5px] outline-none hover:border-black/25 focus:border-black"
            value={form.status}
            onChange={(event) => set("status", event.target.value)}
          >
            {CAMPAIGN_STATUS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Starts</span>
          <input
            type="date"
            className="mt-1.5 h-11 w-full rounded-[12px] border border-black/12 bg-white px-3 text-[13.5px] outline-none focus:border-black"
            value={form.starts_on}
            onChange={(event) => set("starts_on", event.target.value)}
          />
        </label>
        <label className="block">
          <span className="eyebrow">Ends</span>
          <input
            type="date"
            className="mt-1.5 h-11 w-full rounded-[12px] border border-black/12 bg-white px-3 text-[13.5px] outline-none focus:border-black"
            value={form.ends_on}
            onChange={(event) => set("ends_on", event.target.value)}
          />
        </label>
      </div>

      <div>
        <span className="eyebrow">Where clips may be posted</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const on = form.platforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                aria-pressed={on}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  on
                    ? "border-black bg-black text-white"
                    : "border-black/15 text-black/55 hover:border-black/35 hover:text-black"
                )}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="eyebrow">Rules</span>
        <textarea
          className="mt-1.5 w-full resize-y rounded-[12px] border border-black/12 bg-white p-3 text-[13px] leading-relaxed"
          rows={3}
          value={form.rules}
          onChange={(event) => set("rules", event.target.value)}
          placeholder="Minimum 20 seconds, credit the creator, one clip per moment."
        />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="pill pill-primary h-10 px-5 text-[13px]">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="pill pill-ghost h-10 px-4 text-[13px]"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}