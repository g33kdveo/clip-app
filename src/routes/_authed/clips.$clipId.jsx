import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ClipEditor from "@/components/ClipEditor";

export const Route = createFileRoute("/_authed/clips/$clipId")({
  head: () => ({ meta: [{ title: "Clip editor · Above Yellow" }] }),
  component: ClipPage,
});

function ClipPage() {
  const { clipId } = Route.useParams();
  const queryClient = useQueryClient();

  const clipQuery = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => base44.entities.Clip.get(clipId),
  });
  const clip = clipQuery.data;

  const jobQuery = useQuery({
    queryKey: ["job", clip?.job_id],
    queryFn: () => base44.entities.ClipJob.get(clip.job_id),
    enabled: Boolean(clip?.job_id),
  });
  const job = jobQuery.data;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
    queryClient.invalidateQueries({ queryKey: ["clips", clip?.job_id] });
  }

  if (clipQuery.isLoading) {
    return (
      <div className="flex items-center gap-3 py-24 text-[13px] text-black/40">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening clip
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="py-24 text-center">
        <p className="text-[15px] font-semibold">This clip is gone</p>
        <Link to="/library" className="pill pill-ghost mt-4">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8 sm:pt-10">
      <Link
        to="/jobs/$jobId"
        params={{ jobId: clip.job_id }}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-black/40 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {job?.title || "Back to job"}
      </Link>

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]">
          {clip.title}
        </h1>
        <span className="rounded-full bg-[#FED50C] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em]">
          #{clip.rank} · {clip.score}/10
        </span>
      </div>
      {clip.reason ? (
        <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-black/45">{clip.reason}</p>
      ) : null}

      <div className="mt-8">
        <ClipEditor
          clip={clip}
          jobId={clip.job_id}
          onSaved={refresh}
          contentType={job?.content_type || "auto"}
        />
      </div>
    </div>
  );
}