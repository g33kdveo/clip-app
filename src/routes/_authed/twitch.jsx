import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { base44 } from "@/api/base44Client";
import { addCreator, removeCreator, twitchStatus } from "@/lib/twitch-fns";
import { listCampaigns } from "@/lib/campaign-fns";
import { TWITCH_CONNECTOR_ID } from "@/lib/twitch";
import TwitchConnect from "@/components/twitch/TwitchConnect";
import CreatorSearch from "@/components/twitch/CreatorSearch";
import LiveBoard from "@/components/twitch/LiveBoard";
import CreatorPanel from "@/components/twitch/CreatorPanel";

export const Route = createFileRoute("/_authed/twitch")({
  head: () => ({
    meta: [
      { title: "Live · Above Yellow" },
      {
        name: "description",
        content: "The creators you clip, who is live right now, and their moments ready to format.",
      },
    ],
  }),
  component: TwitchPage,
});

function TwitchPage() {
  const load = useServerFn(twitchStatus);
  const loadCampaigns = useServerFn(listCampaigns);
  const add = useServerFn(addCreator);
  const remove = useServerFn(removeCreator);

  const [status, setStatus] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [board, list] = await Promise.all([load(), loadCampaigns()]);
      setStatus(board);
      setCampaigns(list.campaigns || []);
      setError("");
    } catch (problem) {
      setError(problem?.message || "Twitch could not be reached.");
    }
  }, [load, loadCampaigns]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live status moves on its own: the board re-reads Twitch every 45 seconds.
  useEffect(() => {
    if (!status?.connected) return undefined;
    const timer = setInterval(refresh, 45000);
    return () => clearInterval(timer);
  }, [status?.connected, refresh]);

  const connect = async () => {
    setConnecting(true);
    setError("");
    try {
      const url = await base44.connectors.connectAppUser(TWITCH_CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          refresh();
        }
      }, 500);
    } catch (problem) {
      setConnecting(false);
      setError(problem?.message || "The Twitch approval could not be opened.");
    }
  };

  const onAdd = async (payload) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const creator = await add({ data: payload });
      await refresh();
      if (creator?.id) setSelectedId(creator.id);
      setNotice(`${creator?.display_name || "Creator"} is on the board.`);
      return creator;
    } catch (problem) {
      setError(problem?.message || "That creator could not be added.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (id) => {
    setError("");
    try {
      await remove({ data: { id } });
      if (selectedId === id) setSelectedId("");
      await refresh();
    } catch (problem) {
      setError(problem?.message || "That creator could not be removed.");
    }
  };

  const creators = status?.creators || [];
  const selected = creators.find((creator) => creator.id === selectedId) || null;
  const liveCount = creators.filter((creator) => creator.live).length;

  return (
    <div className="mx-auto max-w-[1200px] pb-10 pt-8 sm:pt-12">
      <header className="rise">
        <span className="eyebrow">Live</span>
        <h1 className="brandmark mt-3 max-w-[22ch] text-[34px] leading-[0.98] sm:text-[48px]">
          Clip other creators while they're live.
        </h1>
        <p className="mt-3 max-w-[58ch] text-[14.5px] leading-relaxed text-black/50">
          Add the creators whose campaigns you clip. The board tells you who is live right now, and
          pulls their moments into the same templates as everything else.
        </p>
      </header>

      {error ? (
        <p className="mt-5 rounded-[14px] bg-[#FDECEA] px-4 py-3 text-[12.5px] text-[#A32D1E]">
          {error}
        </p>
      ) : null}

      {status === null ? (
        <p className="mt-8 text-[13px] text-black/30">Reading Twitch…</p>
      ) : !status.connected ? (
        <TwitchConnect onConnect={connect} busy={connecting} />
      ) : (
        <>
          <CreatorSearch campaigns={campaigns} onAdd={onAdd} busy={busy} />

          {notice ? (
            <p className="mt-3 text-[12.5px] text-[#137A45]">{notice}</p>
          ) : null}

          <div className="mt-8 flex items-baseline justify-between">
            <span className="eyebrow">Your creators</span>
            <span className="text-[11.5px] text-black/30">
              {creators.length
                ? `${liveCount} live of ${creators.length}`
                : "None added yet"}
            </span>
          </div>

          <LiveBoard
            creators={creators}
            campaigns={campaigns}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((current) => (current === id ? "" : id))}
            onRemove={onRemove}
          />

          {selected ? <CreatorPanel creator={selected} /> : null}
        </>
      )}
    </div>
  );
}