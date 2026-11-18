import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export default function ToolShell({ eyebrow, title, blurb, children }) {
  return (
    <div className="mx-auto max-w-[1120px] pb-10 pt-8 sm:pt-12">
      <Link
        to="/tools"
        className="inline-flex items-center gap-2 text-[12.5px] font-medium text-black/45 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All tools
      </Link>

      <div className="rise mt-5">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="brandmark mt-3 text-[34px] leading-[0.98] sm:text-[46px]">{title}</h1>
        <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-black/50">{blurb}</p>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}