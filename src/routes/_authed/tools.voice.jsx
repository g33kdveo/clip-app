import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import VoiceTool from "@/components/tools/VoiceTool";

export const Route = createFileRoute("/_authed/tools/voice")({
  head: () => ({
    meta: [
      { title: "AI Voiceover · Above Yellow" },
      { name: "description", content: "Turn a script into narration in seconds." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ToolShell
      eyebrow="Generate"
      title="AI Voiceover"
      blurb="Paste a script, pick a voice, and get an MP3 you can lay under a clip or a recap."
    >
      <VoiceTool />
    </ToolShell>
  );
}