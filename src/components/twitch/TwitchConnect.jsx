import { Loader2, Radio } from "lucide-react";

export default function TwitchConnect({ onConnect, busy }) {
  return (
    <section className="mt-8 rounded-[24px] border border-dashed border-black/15 bg-[#FAFAFA] p-7 sm:p-10">
      <span className="eyebrow">Not connected</span>
      <h2 className="brandmark mt-3 text-[26px] leading-[1.02] sm:text-[32px]">
        Connect Twitch.
      </h2>
      <p className="mt-3 max-w-[54ch] text-[14px] leading-relaxed text-black/50">
        You approve this on Twitch's own screen, so your password never touches the app. It gives the
        app read access to any creator's public streams and clips, so the board can show who is live
        and pull their moments in. It does not post anything for you.
      </p>

      <button type="button" onClick={onConnect} disabled={busy} className="pill pill-primary mt-6">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
        {busy ? "Waiting for Twitch…" : "Connect Twitch"}
      </button>

      <p className="mt-3 text-[12px] leading-relaxed text-black/35">
        A new tab opens for the approval. You can revoke access on Twitch whenever you want.
      </p>
    </section>
  );
}