import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import ImageTool from "@/components/tools/ImageTool";

export const Route = createFileRoute("/_authed/tools/image")({
  head: () => ({
    meta: [
      { title: "AI Image Generator · Above Yellow" },
      { name: "description", content: "Generate clip thumbnails and backgrounds from a prompt." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ToolShell
      eyebrow="Generate"
      title="AI Image Generator"
      blurb="Describe the shot you want and get a finished frame back. Vertical by default, so it drops straight into a clip."
    >
      <ImageTool />
    </ToolShell>
  );
}