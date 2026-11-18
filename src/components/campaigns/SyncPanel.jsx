import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { syncContentRewards } from "@/lib/contentrewards-fns";
import { cn } from "@/lib/utils";

function stamp(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SyncPanel({ state, onSynced }) {
  const sync = useServerFn(syncContentRewards);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setBusy(true);
    setNote("");
    setFailed(false);
    try {
      const result = await sync();
      setNote(result.message || "Synced.");
      setFailed(!result.connected);
      await onSynced();
    } catch (problem) {
      setNote(problem?.message || "The sync could not finish.");
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(state?.connected);

  return (
    <section className="mt-6 rounded-[20px] border border-black/10 bg-[#FAFAFA] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
              connected ? "bg-[#1E7A3F]" : "bg-black/20"
            )}
          />
          <div>
            <h2 className="text-[14px] font-semibold">Content Rewards</h2>
            <p className="mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-black/45">
              Whop Content Rewards and REACH campaigns both live here. Every campaign you've joined
              syncs with its clips, views and rewards.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-black/35">
              {connected
                ? state?.syncedAt
                  ? `Last sync ${stamp(state.syncedAt)} UTC`
                  : "Key connected · not synced yet"
                : "No key connected"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy || !connected}
          className="pill pill-primary h-10 px-5 text-[13px]"
        >
          <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
          {busy ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {!connected ? (
        <p className="mt-4 rounded-[12px] border border-black/10 bg-white px-4 py-3 text-[12.5px] leading-relaxed text-black/55">
          Add <span className="font-mono text-[11px]">CONTENT_REWARDS_API_KEY</span> on the app
          dashboard's Secrets page. In Content Rewards, open Settings → Developers → Create key, tick
          the Campaigns and Submissions read scopes, then paste the key there.
        </p>
      ) : null}

      {note ? (
        <p
          className={cn(
            "mt-4 rounded-[12px] px-4 py-3 text-[12.5px] leading-snug",
            failed ? "bg-[#FDECEA] text-[#A32D1E]" : "bg-[#E7F6EC] text-[#1E7A3F]"
          )}
        >
          {note}
        </p>
      ) : null}
    </section>
  );
}