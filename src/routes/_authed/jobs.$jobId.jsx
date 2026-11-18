import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ClipGrid from "@/components/ClipGrid";
import AttachVideo from "@/components/AttachVideo";
import PipelineStages from "@/components/job/PipelineStages";
import MomentSettings from "@/components/job/MomentSettings";
import { formatDuration } from "@/lib/design";
import { deleteJob, processJob, updateJobMoments } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job · Above Yellow" }] }),
  component: JobPage,
});

const RUNNING = ["resolving", "transcribing", "picking"];
const BROKEN = ["failed", "needs_file"];

function JobPage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [working, setWorking] = useState(false);
  const autoStarted = useRef(false);

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => base44.entities.ClipJob.get(jobId),
  });

  const clipsQuery = useQuery({
    queryKey: ["clips", jobId],
    queryFn: async () => {
      const result = await base44.entities.Clip.filter({ job_id: jobId }, { sort: "rank", limit: 50 });
      return Array.isArray(result) ? result : result.items || [];
    },
  });

  const job = jobQuery.data;
  const clips = clipsQuery.data || [];

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["job", jobId] }),
      queryClient.invalidateQueries({ queryKey: ["clips", jobId] }),
      queryClient.invalidateQueries({ queryKey: ["jobs"] }),
    ]);
  }

  async function runPipeline() {
    setWorking(true);
    try {
      await processJob({ data: { jobId } });
      await refresh();
    } finally {
      setWorking(false);
    }
  }

  async function saveMoments(patch) {
    setWorking(true);
    try {
      await updateJobMoments({ data: { jobId, patch } });
      await processJob({ data: { jobId } });
      await refresh();
    } finally {
      setWorking(false);
    }
  }

  // A job with a file or a link has everything it needs: start it on arrival.
  useEffect(() => {
    if (!job || autoStarted.current) return;
    if (job.status === "draft" && (job.file_uri || job.source_url)) {
      autoStarted.current = true;
      runPipeline();
    }
  }, [job]);

  // A YouTube download runs for minutes on the downloader's side, so the job
  // comes back for it every few seconds until the file is in.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!job || job.status !== "resolving") return;
    const timer = setTimeout(async () => {
      try {
        await processJob({ data: { jobId } });
      } catch {
        // the job's own stage note carries the reason
      }
      await refresh();
      setTick((value) => value + 1);
    }, 4000);
    return () => clearTimeout(timer);
  }, [job?.status, tick, jobId]);

  async function remove() {
    if (!window.confirm("Delete this job and all of its clips?")) return;
    await deleteJob({ data: { jobId } });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    navigate({ to: "/library" });
  }

  if (jobQuery.isLoading) {
    return (
      <div className="flex items-center gap-3 py-24 text-[13px] text-black/40">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening job
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-24 text-center">
        <p className="text-[15px] font-semibold">This job is gone</p>
        <Link to="/library" className="pill pill-ghost mt-4">
          Back to library
        </Link>
      </div>
    );
  }

  const running = working || RUNNING.includes(job.status);
  const broken = BROKEN.includes(job.status);
  const missingVideo = !job.file_uri;

  return (
    <div className="pt-8 sm:pt-10">
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-black/40 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Library
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="max-w-[24ch] text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[36px]">
            {job.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-black/45">
            {job.channel ? <span>{job.channel}</span> : null}
            {job.duration ? (
              <>
                <span className="text-black/20">·</span>
                <span>{formatDuration(job.duration)}</span>
              </>
            ) : null}
            <span className="text-black/20">·</span>
            <span>{clips.length} clips</span>
            {job.source_url ? (
              <>
                <span className="text-black/20">·</span>
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline decoration-black/20 transition-colors hover:text-black"
                >
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runPipeline}
            disabled={running}
            className="pill pill-ghost h-9 px-4 text-[13px]"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {clips.length ? "Pick moments again" : "Run the pipeline"}
          </button>
          <button
            type="button"
            onClick={remove}
            className="pill pill-ghost h-9 px-4 text-[13px] text-[#C0392B]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      <PipelineStages status={job.status} note={job.stage_note} />

      {broken ? (
        <div className="mt-6 rounded-[20px] border border-black/10 bg-[#FDECEA] px-5 py-5">
          <p className="text-[14px] font-semibold">
            {job.status === "needs_file" ? "This one needs the video file" : "The pipeline stopped"}
          </p>
          <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-black/55">
            {job.stage_note || "Something in the last stage did not come back."}
          </p>
          <AttachVideo jobId={jobId} onAttached={refresh} />
          {job.source_url && job.status === "failed" ? (
            <button
              type="button"
              onClick={runPipeline}
              disabled={running}
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-black/55 underline decoration-black/25 transition-colors hover:text-black"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Try the link again
            </button>
          ) : null}
        </div>
      ) : null}

      {!broken && missingVideo && clips.length ? (
        <div className="mt-6 rounded-[20px] border border-black/10 bg-[#FED50C]/15 px-5 py-5">
          <p className="text-[14px] font-semibold">Attach the video to render</p>
          <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-black/55">
            {job.source_note ||
              "The moments were cut from the link's captions. Rendering needs the video file itself."}
          </p>
          <AttachVideo jobId={jobId} hasClips onAttached={refresh} />
        </div>
      ) : null}

      {!broken && job.source_note && !(missingVideo && clips.length) ? (
        <p className="mt-4 text-[12.5px] leading-relaxed text-black/40">{job.source_note}</p>
      ) : null}

      {clips.length || broken ? (
        <MomentSettings
          key={`${job.id}-${job.clip_count}-${job.clip_length}-${job.content_type}-${job.voice}-${job.lead_in}-${job.focus}`}
          job={job}
          busy={working}
          onSave={saveMoments}
        />
      ) : null}

      <div className="mt-8">
        {running && !clips.length ? (
          <div className="flex items-center gap-3 rounded-[20px] border border-black/10 px-5 py-16 text-[13px] text-black/45">
            <Loader2 className="h-4 w-4 animate-spin" />
            {job.status === "resolving"
              ? job.stage_note || "Reading the link and pulling the video down."
              : "Reading the transcript, then choosing moments. This can take a minute."}
          </div>
        ) : (
          <ClipGrid clips={clips} jobId={jobId} onRefresh={refresh} />
        )}
      </div>
    </div>
  );
}