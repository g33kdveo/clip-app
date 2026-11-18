import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loadOverview } from "@/lib/social-fns";
import { PLATFORMS } from "@/lib/social";
import PlatformWindow from "@/components/social/PlatformWindow";

export const Route = createFileRoute("/_authed/accounts/")({
  head: () => ({
    meta: [
      { title: "Accounts · Above Yellow" },
      {
        name: "description",
        content: "Every feed you follow, read straight from the platform by username.",
      },
    ],
  }),
  component: AccountsHome,
});

function AccountsHome() {
  const load = useServerFn(loadOverview);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    load()
      .then((result) => setAccounts(result.accounts || []))
      .catch(() => setAccounts([]));
  }, [load]);

  return (
    <div className="mx-auto max-w-[1080px] pb-12 pt-8 sm:pt-12">
      <header className="rise">
        <span className="eyebrow">Accounts</span>
        <h1 className="brandmark mt-3 max-w-[20ch] text-[34px] leading-[0.98] sm:text-[46px]">
          Pick a feed, walk through it.
        </h1>
        <p className="mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-black/50">
          Type a username once. The profile is read straight from the platform and kept here, laid
          out the way that feed shows it.
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <PlatformWindow key={platform.id} platform={platform.id} accounts={accounts} />
        ))}
      </div>
    </div>
  );
}