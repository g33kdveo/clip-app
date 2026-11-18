import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import VideoLookup from "@/components/tools/import/VideoLookup";
import FileSource from "@/components/tools/import/FileSource";
import OutcomeRow from "@/components/tools/import/OutcomeRow";
import { startImportJob } from "@/lib/import-fns";

export default function VideoImportTool() {
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [asset, setAsset] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setStarting(true);
    setError("");
    try {
      const result = await startImportJob({
        data: {
          file_uri: asset.file_uri,
          title: video?.title || String(asset.name || "").replace(/\.[^.]+$/, ""),
          channel: video?.channel || "",
          source_url: video?.url || "",
          duration: asset.duration || video?.duration || 0,
          source_note: video?.url
            ? "Imported from a file you supplied for that video link."
            : "Imported from a file you supplied.",
        },
      });
      navigate({ to: "/jobs/$jobId", params: { jobId: result.jobId } });
    } catch (failure) {
      setError(String(failure?.message || failure));
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-4">
      <VideoLookup video={video} onVideo={setVideo} />
      <FileSource asset={asset} onAsset={setAsset} />
      <OutcomeRow asset={asset} onStart={start} starting={starting} error={error} />
    </div>
  );
}