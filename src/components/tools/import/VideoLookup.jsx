import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Link2, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { formatDuration } from "@/lib/design";
import { readVideo } from "@/lib/import-fns";

export default function VideoLookup({ video, onVideo }) {
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function read() {
    setBusy(true);
    setError("");
    try {
      onVideo(await readVideo({ data: { url: link } }));
    } catch (failure) {
      onVideo(null);
      setError(String(failure?.message || failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">1 · The link</h2>
        <span className="eyebrow">Optional</span>
      </div>
      <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-black/45">
        This page is for a video file you already have. For a YouTube link, paste it into a{" "}
        <Link to="/" className="font-medium text-black underline underline-offset-2">
          new clip job
        </Link>{" "}
        and the video downloads itself.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
          <input
            className="field pl-12"
            placeholder="Paste the video link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && link.trim() && !busy) read();
            }}
          />
        </div>
        <button
          type="button"
          onClick={read}
          disabled={!link.trim() || busy}
          className="pill pill-primary h-[52px] px-6"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Reading" : "Read video"}
        </button>
      </div>

      {error ? <p className="mt-2.5 text-[12.5px] text-[#C0392B]">{error}</p> : null}
      {video ? <VideoCard video={video} /> : null}
    </section>
  );
}

function VideoCard({ video }) {
  return (
    <div className="mt-4 flex gap-4 rounded-[16px] border border-black/10 bg-[#FAFAF9] p-3">
      <a
        href={video.url}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 overflow-hidden rounded-[10px]"
      >
        <Image
          src={video.thumbnail}
          className="h-[62px] w-[110px] object-cover"
          fittingType="fill"
        />
      </a>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold">
          {video.title || "That video"}
        </p>
        <p className="mt-0.5 text-[12.5px] text-black/45">
          {[video.channel, video.duration ? formatDuration(video.duration) : ""]
            .filter(Boolean)
            .join(" · ")}
          {video.owned ? (
            <span className="ml-2 rounded-full bg-[#EAF7EF] px-2 py-0.5 text-[11px] font-medium text-[#137A45]">
              Your channel
            </span>
          ) : null}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-black/40">{video.note}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-black/25">
          Details from YouTube
        </p>
      </div>
    </div>
  );
}