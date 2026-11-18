import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import VideoImportTool from "@/components/tools/import/VideoImportTool";

export const Route = createFileRoute("/_authed/tools/import")({
  head: () => ({
    meta: [
      { title: "Video import · Above Yellow" },
      {
        name: "description",
        content: "Bring a video you own into a clip job, or save the file to your computer.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ToolShell
      eyebrow="Import"
      title="Bring a video in"
      blurb="Check the link, then bring the file in from the source. Save it to your computer or send it straight to a clip job."
    >
      <VideoImportTool />
    </ToolShell>
  );
}