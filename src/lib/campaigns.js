export function money(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export const CAMPAIGN_STATUS = [
  { value: "draft", label: "Draft", tone: "bg-black/[0.06] text-black/55" },
  { value: "live", label: "Live", tone: "bg-[#E7F6EC] text-[#1E7A3F]" },
  { value: "paused", label: "Paused", tone: "bg-[#FFF6D6] text-[#8A6A00]" },
  { value: "ended", label: "Ended", tone: "bg-[#FDECEA] text-[#A32D1E]" },
];

export const SUB_STATUS = [
  { value: "submitted", label: "Submitted", tone: "bg-black/[0.06] text-black/55" },
  { value: "approved", label: "Approved", tone: "bg-[#E7F6EC] text-[#1E7A3F]" },
  { value: "paid", label: "Paid", tone: "bg-[#EAF1FD] text-[#1F4FA3]" },
  { value: "rejected", label: "Rejected", tone: "bg-[#FDECEA] text-[#A32D1E]" },
];

export function statusTone(list, value) {
  return (list.find((item) => item.value === value) || list[0]).tone;
}

export function budgetParts(campaign) {
  const budget = Number(campaign.budget) || 0;
  const paid = Number(campaign.paid) || 0;
  const owed = Number(campaign.owed) || 0;
  const committed = paid + owed;
  const share = budget > 0 ? Math.min(100, (committed / budget) * 100) : 0;
  return { budget, paid, owed, committed, share, left: Math.max(0, budget - committed) };
}

export function rewardLabel(rate) {
  const n = Number(rate) || 0;
  return n > 0 ? `${money(n)} per 1k views` : "No reward set";
}