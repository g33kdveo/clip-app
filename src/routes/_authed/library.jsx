import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import JobCard from "@/components/JobCard";

export const Route = createFileRoute("/_authed/library")({
  head: () => ({ meta: [{ title: "Library · Above Yellow" }] }),
  component: Library,
});

function Library() {
  const jobsQuery = useQuery({
    queryKey: ["jobs", "all"],
    queryFn: async () => {
      const result = await base44.entities.ClipJob.list("-created_date", 60);
      return Array.isArray(result) ? result : result.items || [];
    },
  });

  const jobs = jobsQuery.data || [];

  return (
    <div className="pt-10 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Library</span>
          <h1 className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.035em] sm:text-[40px]">
            Every video you've clipped
          </h1>
        </div>
        <Link to="/" className="pill pill-primary h-10 px-5 text-[13px]">
          New clip job
        </Link>
      </div>

      {jobsQuery.isLoading ? (
        <div className="flex items-center gap-3 py-24 text-[13px] text-black/40">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your library
        </div>
      ) : jobs.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[20px] border border-dashed border-black/15 px-6 py-20 text-center">
          <p className="text-[16px] font-semibold">Nothing clipped yet</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-black/45">
            Start with a VOD you own or have permission to clip. Above Yellow reads the
            transcript and pulls out the moments worth posting.
          </p>
          <Link to="/" className="pill pill-primary mt-5 h-10 px-5 text-[13px]">
            Start a clip job
          </Link>
        </div>
      )}
    </div>
  );
}