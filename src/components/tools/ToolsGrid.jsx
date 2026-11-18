import { Link } from "@tanstack/react-router";
import { TOOLS, TOOL_TINT } from "@/lib/tools";
import { cn } from "@/lib/utils";

export default function ToolsGrid({ query = "" }) {
  const needle = query.trim().toLowerCase();
  const shown = TOOLS.filter(
    (tool) =>
      !needle ||
      tool.name.toLowerCase().includes(needle) ||
      tool.blurb.toLowerCase().includes(needle) ||
      tool.group.toLowerCase().includes(needle)
  );

  if (!shown.length) {
    return (
      <p className="rounded-[18px] border border-dashed border-black/15 px-5 py-10 text-center text-[13.5px] text-black/45">
        Nothing matches “{query}”.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((tool, index) => (
        <Link
          key={tool.id}
          to={tool.to}
          className={cn(
            "lift rise group flex flex-col overflow-hidden rounded-[20px] border border-black/10 bg-white",
            index === 1 && "rise-1",
            index === 2 && "rise-2"
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-[13px]",
                TOOL_TINT[tool.tint]
              )}
            >
              <tool.Icon className="h-[19px] w-[19px]" strokeWidth={1.9} />
            </span>
            {tool.badge ? (
              <span className="rounded-full bg-[#2962FF] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
                {tool.badge}
              </span>
            ) : (
              <span className="eyebrow">{tool.group}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 px-5 py-5">
            <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em]">
              {tool.name}
            </h3>
            <p className="text-[13px] leading-relaxed text-black/45">{tool.blurb}</p>
            <span className="mt-auto pt-4 text-[12.5px] font-semibold text-black/70 transition-colors group-hover:text-black">
              Get started →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}