import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PLATFORMS } from "@/lib/social";
import { money } from "@/lib/campaigns";

export default function SubmissionForm({ platforms = [], rate, onSubmit, busy }) {
  const allowed = PLATFORMS.filter(
    (platform) => platforms.length === 0 || platforms.includes(platform.id)
  );
  const [form, setForm] = useState({
    platform: allowed[0]?.id || "tiktok",
    post_url: "",
    creator: "",
    views: "",
    posted_at: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const payout = ((Number(form.views) || 0) / 1000) * (Number(rate) || 0);

  const submit = (event) => {
    event.preventDefault();
    if (!form.post_url.trim()) return;
    onSubmit({
      platform: form.platform,
      post_url: form.post_url.trim(),
      creator: form.creator.trim(),
      views: Number(form.views) || 0,
      posted_at: form.posted_at,
      note: form.note.trim(),
    });
    setForm((current) => ({ ...current, post_url: "", views: "", note: "" }));
  };

  return (
    <form onSubmit={submit} className="rounded-[16px] border border-black/10 bg-[#FAFAFA] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Platform</span>
          <select
            className="mt-1.5 h-10 w-full appearance-none rounded-[10px] border border-black/12 bg-white px-3 text-[13px] outline-none focus:border-black"
            value={form.platform}
            onChange={(event) => set("platform", event.target.value)}
          >
            {allowed.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow">Link to the post</span>
          <input
            className="field mt-1.5 h-10 rounded-[10px]"
            value={form.post_url}
            onChange={(event) => set("post_url", event.target.value)}
            placeholder="https://…"
            required
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="eyebrow">Clipper handle</span>
          <input
            className="field mt-1.5 h-10 rounded-[10px]"
            value={form.creator}
            onChange={(event) => set("creator", event.target.value)}
            placeholder="@handle"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Views</span>
          <input
            type="number"
            min="0"
            className="field mt-1.5 h-10 rounded-[10px]"
            value={form.views}
            onChange={(event) => set("views", event.target.value)}
            placeholder="0"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Posted</span>
          <input
            type="date"
            className="mt-1.5 h-10 w-full rounded-[10px] border border-black/12 bg-white px-3 text-[13px] outline-none focus:border-black"
            value={form.posted_at}
            onChange={(event) => set("posted_at", event.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="pill pill-primary h-9 px-4 text-[12.5px]">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Add clip
        </button>
        <span className="text-[11.5px] text-black/40">
          Reward at these views: <span className="font-semibold text-black">{money(payout)}</span>
        </span>
      </div>
    </form>
  );
}