import { useState } from "react";
import { Loader2, Download, Wand2 } from "lucide-react";
import ClipCard from "@/components/ClipCard";
import { useClipRender } from "@/lib/useClipRender";
import { base44 } from "@/api/base44Client";

export default function ClipGrid({ clips, jobId, onRefresh }) {
  const { states, render } = useClipRender();
  const [runningAll, setRunningAll] = useState(false);
  const kept = clips.filter((clip) => clip.keep !== false);

  async function renderOne(clip) {
    await render(clip, jobId);
    onRefresh?.();
  }

  async function renderAll() {
    setRunningAll(true);
    const pending = kept.filter((clip) => !clip.rendered_uri);
    for (const clip of pending) {
      // one at a time: each render plays the source in real time
      await render(clip, jobId);
      onRefresh?.();
    }
    setRunningAll(false);
  }

  if (!clips.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-black/15 px-6 py-16 text-center">
        <p className="text-[15px] font-semibold">No clips yet</p>
        <p className="mt-1 text-[13px] text-black/45">
          Moments appear here once the transcript has been read.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">{kept.length} kept of {clips.length}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={renderAll}
            disabled={runningAll}
            className="pill pill-ghost h-9 px-4 text-[13px]"
          >
            {runningAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {runningAll ? "Rendering" : "Render kept"}
          </button>
          <DownloadKept clips={kept} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clips.map((clip) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            jobId={jobId}
            renderState={states[clip.id]}
            onRender={renderOne}
            onKeep={async (target, value) => {
              await base44.entities.Clip.update(target.id, { keep: value });
              onRefresh?.();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DownloadKept({ clips }) {
  const rendered = clips.filter((clip) => clip.rendered_uri);

  if (!rendered.length) {
    return (
      <button type="button" disabled className="pill pill-ghost h-9 px-4 text-[13px]">
        <Download className="h-3.5 w-3.5" />
        Nothing rendered
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        for (const clip of rendered) {
          const result = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: clip.rendered_uri,
            expires_in: 600,
          });
          const link = document.createElement("a");
          link.href = result.signed_url;
          link.download = `${clip.rank}-${clip.id}.${clip.rendered_ext || "webm"}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }}
      className="pill pill-ghost h-9 px-4 text-[13px]"
    >
      <Download className="h-3.5 w-3.5" />
      Download kept ({rendered.length})
    </button>
  );
}