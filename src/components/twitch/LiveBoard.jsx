import CreatorCard from "@/components/twitch/CreatorCard";

export default function LiveBoard({ creators, campaigns, selectedId, onSelect, onRemove }) {
  if (!creators.length) {
    return (
      <p className="mt-6 rounded-[18px] border border-dashed border-black/15 bg-[#FAFAFA] p-6 text-[13px] leading-relaxed text-black/40">
        No creators yet. Add the ones whose campaigns you clip, and the board shows who is live and
        lets you pull their moments in.
      </p>
    );
  }

  const ordered = [...creators].sort((a, b) => Number(b.live) - Number(a.live));
  const campaignName = (id) => (campaigns.find((campaign) => campaign.id === id) || {}).name || "";

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((creator) => (
        <div key={creator.id} className="group relative">
          <CreatorCard
            creator={creator}
            campaignName={campaignName(creator.campaign_id)}
            selected={selectedId === creator.id}
            onSelect={() => onSelect(creator.id)}
          />
          <button
            type="button"
            onClick={() => onRemove(creator.id)}
            className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white/85 opacity-0 transition-opacity hover:bg-black/75 focus:opacity-100 group-hover:opacity-100"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}