import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import BrainstormTool from "@/components/tools/BrainstormTool";

export const Route = createFileRoute("/_authed/tools/brainstorm")({
  head: () => ({
    meta: [
      { title: "AI Brainstormer · Above Yellow" },
      { name: "description", content: "Clip ideas, hooks and opening lines for your niche." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ToolShell
      eyebrow="Plan"
      title="AI Brainstormer"
      blurb="Tell it the niche and it names the moments to look for in the footage, with a hook and a reason each."
    >
      <BrainstormTool />
    </ToolShell>
  );
}