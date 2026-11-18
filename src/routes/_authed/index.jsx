import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import NewClipForm from "@/components/NewClipForm";
import JobCard from "@/components/JobCard";
import { createJob } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Above Yellow · clip factory" }] }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["jobs", "recent"],
    queryFn: async () => {
      const result = await base44.entities.ClipJob.list("-created_date", 3);
      return Array.isArray(result) ? result : result.items || [];
    },
  });

  async function handleSubmit(payload) {
    setBusy(true);
    setError("");
    try {
      let fileUri = "";
      if (payload.file) {
        const uploaded = await base44.integrations.Core.UploadPrivateFile({ file: payload.file });
        fileUri = uploaded.file_uri;
      }

      const fallbackTitle = payload.url
        ? payload.url.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 120)
        : "Untitled source";

      const job = await createJob({
        data: {
          title: payload.file ? payload.file.name.replace(/\.[^.]+$/, "") : fallbackTitle,
          channel: "",
          source_type: fileUri ? "upload" : "link",
          source_url: payload.url || "",
          file_uri: fileUri,
          duration: payload.duration || 0,
          clip_count: payload.clipCount,
          clip_length: payload.clipLength,
          language: payload.language,
          content_type: payload.contentType,
          lead_in: payload.leadIn,
          focus: payload.focus,
          audio_level: payload.audioLevel,
          voice: payload.voice,
          layout: payload.layout,
          captions: payload.captions,
          hook: payload.hook,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
    } catch (caught) {
      setError(String(caught?.message || caught));
    } finally {
      setBusy(false);
    }
  }

  const jobs = jobsQuery.data || [];

  return (
    <div className="pt-10 sm:pt-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="rise">
          <span className="eyebrow">Clip factory</span>
          <h1 className="mt-4 max-w-[16ch] text-[38px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[52px]">
            One long stream. A shelf of clips.
          </h1>
          <p className="mt-5 max-w-[52ch] text-[15.5px] leading-relaxed text-black/50">
            Paste a Twitch clip or YouTube link and the video comes down whole, or drop a file.
            Above Yellow reads the transcript, picks the funny reactions, the banter and the
            impressive plays, and cuts them vertical with word-by-word captions for TikTok,
            Shorts and Reels.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-black/40">
            <span>Reads the transcript, never guesses</span>
            <span className="text-black/15">/</span>
            <span>Word-snapped cuts</span>
            <span className="text-black/15">/</span>
            <span>Credit in every caption</span>
          </div>
        </div>

        <div className="rise rise-2 mx-auto w-[228px] sm:w-[248px]">
          <div className="rounded-[22px] border border-black/10 bg-[#FED50C] p-3 shadow-[0_24px_60px_-40px_rgba(10,10,10,0.6)]">
            <p className="px-1 pb-2 text-[13px] font-semibold leading-tight tracking-[-0.01em]">
              I quit at 24 with nothing
            </p>
            <div className="relative aspect-[9/13] overflow-hidden rounded-[14px] bg-[#E8E4DA]">
              <div className="absolute inset-x-0 bottom-7 px-3 text-center text-[16px] font-black uppercase leading-[1.15] tracking-[-0.01em] caption-preview">
                that <span className="text-[#FED50C]">one</span> decision
                <br />
                changed everything
              </div>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">
            Caption style · spoken word in yellow
          </p>
        </div>
      </div>

      <div className="rise rise-3 mt-10 sm:mt-12">
        <NewClipForm onSubmit={handleSubmit} busy={busy} />
        {busy ? (
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-black/45">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Storing the video (stored privately), then opening the job.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-[12.5px] text-[#C0392B]">{error}</p> : null}
      </div>

      {jobs.length ? (
        <section className="mt-14">
          <div className="flex items-baseline justify-between gap-4">
            <span className="eyebrow">Recent jobs</span>
            <Link to="/library" className="text-[12px] text-black/40 transition-colors hover:text-black">
              All jobs
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}