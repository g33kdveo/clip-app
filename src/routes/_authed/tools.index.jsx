import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import ToolsGrid from "@/components/tools/ToolsGrid";
import RecentOutputs from "@/components/tools/RecentOutputs";

export const Route = createFileRoute("/_authed/tools/")({
  head: () => ({
    meta: [
      { title: "Tools · Above Yellow" },
      { name: "description", content: "Every tool for turning streams into postable clips." },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="mx-auto max-w-[1200px] pb-10 pt-8 sm:pt-12">
      <div className="rise">
        <span className="eyebrow">Tools</span>
        <h1 className="brandmark mt-3 max-w-[20ch] text-[34px] leading-[0.98] sm:text-[48px]">
          Everything for the clip, in one place.
        </h1>
        <p className="mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-black/50">
          Generate the assets, plan the moment, then cut it. Every result is saved to your
          library.
        </p>
      </div>

      <div className="relative mt-7 max-w-[420px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools"
          className="field pl-11"
        />
      </div>

      <div className="mt-7">
        <ToolsGrid query={query} />
      </div>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Recently made</span>
          <span className="text-[11.5px] text-black/30">Saved automatically</span>
        </div>
        <div className="mt-4">
          <RecentOutputs />
        </div>
      </section>
    </div>
  );
}