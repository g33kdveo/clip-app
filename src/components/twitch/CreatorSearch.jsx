import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

export default function CreatorSearch({ campaigns, onAdd, busy }) {
  const [input, setInput] = useState("");
  const [campaignId, setCampaignId] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    const added = await onAdd({ input: input.trim(), campaign_id: campaignId || undefined });
    if (added) setInput("");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 flex flex-wrap items-center gap-2 rounded-[18px] border border-black/10 bg-white p-2.5"
    >
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="twitch.tv/lacy, or just lacy"
        className="h-10 min-w-[200px] flex-1 rounded-full border border-transparent bg-black/[0.03] px-4 text-[13.5px] outline-none placeholder:text-black/30 focus:border-black/20"
        disabled={busy}
      />

      <select
        value={campaignId}
        onChange={(event) => setCampaignId(event.target.value)}
        disabled={busy}
        className="h-10 rounded-full border border-black/10 bg-white px-3 text-[13px] text-black/70 outline-none focus:border-black/30"
      >
        <option value="">No campaign</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </select>

      <button type="submit" disabled={busy || !input.trim()} className="pill pill-primary h-10 px-5 text-[13px]">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {busy ? "Adding…" : "Add creator"}
      </button>
    </form>
  );
}