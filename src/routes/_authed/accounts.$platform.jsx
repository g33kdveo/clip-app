import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import {
  loadPlatform,
  lookupAccount,
  refreshAccount,
  removeAccount,
} from "@/lib/social-fns";
import { PLATFORM, formatWhen } from "@/lib/social";
import AccountBar from "@/components/social/AccountBar";
import TrackForm from "@/components/social/TrackForm";
import ProfileHead from "@/components/social/ProfileHead";
import InstagramSection from "@/components/social/InstagramSection";
import TikTokSection from "@/components/social/TikTokSection";
import XSection from "@/components/social/XSection";
import YouTubeSection from "@/components/social/YouTubeSection";

export const Route = createFileRoute("/_authed/accounts/$platform")({
  head: () => ({
    meta: [
      { title: "Account · Above Yellow" },
      { name: "description", content: "A public profile, laid out the way its feed shows it." },
    ],
  }),
  component: PlatformPage,
});

function FeedBody({ platform, posts }) {
  if (platform === "instagram") return <InstagramSection posts={posts} />;
  if (platform === "tiktok") return <TikTokSection posts={posts} />;
  if (platform === "x") return <XSection posts={posts} />;
  return <YouTubeSection posts={posts} />;
}

function PlatformPage() {
  const { platform } = Route.useParams();
  if (!PLATFORM[platform]) {
    return (
      <div className="mx-auto max-w-[640px] pt-16">
        <p className="text-[14px] text-black/50">That feed is not one of the four.</p>
        <Link to="/accounts" className="pill pill-ghost mt-4 h-9 px-4 text-[13px]">
          Back to accounts
        </Link>
      </div>
    );
  }
  return <FeedView platform={platform} />;
}

function FeedView({ platform }) {
  const meta = PLATFORM[platform];
  const load = useServerFn(loadPlatform);
  const lookup = useServerFn(lookupAccount);
  const refreshOne = useServerFn(refreshAccount);
  const remove = useServerFn(removeAccount);

  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(
    async (selectId) => {
      const fresh = await load({ data: { platform } });
      setData(fresh);
      setActiveId((current) => {
        if (selectId && fresh.accounts.some((account) => account.id === selectId)) return selectId;
        if (current && fresh.accounts.some((account) => account.id === current)) return current;
        return fresh.accounts[0]?.id || null;
      });
    },
    [load, platform]
  );

  useEffect(() => {
    refresh().catch((problem) =>
      setError(problem?.message || "The accounts could not be loaded.")
    );
  }, [refresh]);

  const onTrack = async (handle) => {
    setBusy(true);
    setError("");
    try {
      const result = await lookup({ data: { platform, handle } });
      await refresh(result.account.id);
    } catch (problem) {
      setError(problem?.message || "That account could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (id) => {
    setError("");
    try {
      await remove({ data: { id } });
      await refresh();
    } catch (problem) {
      setError(problem?.message || "That account could not be removed.");
    }
  };

  const onRefresh = async () => {
    if (!activeId) return;
    setRefreshing(true);
    setError("");
    try {
      await refreshOne({ data: { id: activeId } });
      await refresh(activeId);
    } catch (problem) {
      setError(problem?.message || "That profile could not be re-read.");
    } finally {
      setRefreshing(false);
    }
  };

  const accounts = data?.accounts || [];
  const active = accounts.find((account) => account.id === activeId);
  const posts = (data?.posts || [])
    .filter((post) => post.account_id === activeId)
    .sort((a, b) => String(b.posted_at || "").localeCompare(String(a.posted_at || "")));

  return (
    <div className="mx-auto max-w-[1120px] pb-12 pt-8 sm:pt-12">
      <Link
        to="/accounts"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-black/40 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Accounts
      </Link>

      <header className="mt-4">
        <h1 className="brandmark text-[30px] leading-none sm:text-[40px]">{meta.heading}</h1>
        <p className="mt-2 max-w-[56ch] text-[13.5px] leading-relaxed text-black/50">
          {meta.blurb} Type a username and the profile loads as that feed shows it.
        </p>
      </header>

      <TrackForm platform={platform} onTrack={onTrack} busy={busy} />

      {error ? (
        <p className="mt-4 rounded-[12px] bg-[#FDECEA] px-4 py-3 text-[12.5px] leading-snug text-[#A32D1E]">
          {error}
        </p>
      ) : null}

      {data === null ? (
        <p className="mt-8 text-[13px] text-black/30">Opening the feed…</p>
      ) : accounts.length === 0 ? (
        <p className="mt-8 rounded-[16px] border border-dashed border-black/15 bg-[#FAFAFA] p-6 text-[13px] text-black/40">
          No account tracked here yet. Type a username above and it is saved for next time.
        </p>
      ) : (
        <>
          <AccountBar
            accounts={accounts}
            activeId={activeId}
            onPick={setActiveId}
            onRemove={onRemove}
          />

          {active ? (
            <section className="mt-5 rounded-[20px] border border-black/10 bg-white p-4 sm:p-5">
              <ProfileHead platform={platform} account={active} shown={posts.length}>
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="pill pill-ghost h-9 px-3.5 text-[12.5px]"
                >
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh
                </button>
              </ProfileHead>

              {posts.length ? (
                <FeedBody platform={platform} posts={posts} />
              ) : (
                <div className="mt-4 rounded-[14px] border border-dashed border-black/12 bg-[#FAFAFA] p-5">
                  <p className="max-w-[62ch] text-[12.5px] leading-relaxed text-black/50">
                    {active.note ||
                      "This profile publishes nothing that can be read from here."}
                  </p>
                  {active.profile_url ? (
                    <a
                      href={active.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="pill pill-ghost mt-3 h-9 px-4 text-[12.5px]"
                    >
                      Open on {meta.label}
                    </a>
                  ) : null}
                </div>
              )}

              {active.synced_at ? (
                <p className="mt-4 text-[10.5px] text-black/25">
                  Read {formatWhen(active.synced_at)}. Only the posts a profile shows publicly can
                  appear here, so older ones need a refresh.
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}