import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import IconTool from "@/components/tools/IconTool";

export const Route = createFileRoute("/_authed/tools/icons")({
  head: () => ({
    meta: [
      { title: "Icon Generator · Above Yellow" },
      { name: "description", content: "Four branded marks for your channel in one pass." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ToolShell
      eyebrow="Generate"
      title="Icon Generator"
      blurb="Name the brand, pick a direction, and get four different marks: a monogram, a symbol, an abstract shape and a mascot."
    >
      <IconTool />
    </ToolShell>
  );
}