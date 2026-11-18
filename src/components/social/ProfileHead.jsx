import { ExternalLink } from "lucide-react";
import { Image } from "@/components/ui/image";
import { PLATFORM, formatViews } from "@/lib/social";

// How old the read is, so nobody mistakes a snapshot for live numbers.
function timeAgo(value) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "recently";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function ProfileHead({ platform, account, shown, children }) {
  const meta = PLATFORM[platform];
  const total = Number(account.posts_count) || shown;
  const initial = String(account.display_name || account.handle || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-black/10 bg-[#F5F5F5]">
        {account.avatar_url ? (
          <Image src={account.avatar_url} alt="" className="h-full w-full" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[19px] font-semibold text-black/30">
            {initial}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[16px] font-semibold">{account.display_name || account.handle}</p>
          {account.profile_url ? (
            <a
              href={account.profile_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-black/35 underline decoration-black/20 transition-colors hover:text-black"
            >
              {meta.attribution ? `Data from ${meta.attribution}` : "Open profile"}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        <p className="mt-0.5 text-[12px] text-black/40">@{account.handle}</p>

        {account.bio ? (
          <p className="mt-2 max-w-[62ch] whitespace-pre-line text-[12.5px] leading-relaxed text-black/55">
            {account.bio}
          </p>
        ) : null}

        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-black/40">
          <span>
            <b className="text-black">{formatViews(account.followers)}</b> followers
          </span>
          <span>
            <b className="text-black">{formatViews(total)}</b> posts
          </span>
          <span className="text-black/25">
            showing {shown} of {total}
          </span>
        </p>

        {account.synced_at ? (
          <p className="mt-1.5 text-[11.5px] text-black/35">
            {meta.attribution ? `Read from the public ${meta.attribution} profile` : "Read from the public profile"}
            {" · "}
            {timeAgo(account.synced_at)}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}