import { Loader2, Scissors } from "lucide-react";

export default function FormatBar({ count, onFormat, importing, error }) {
  return (
    <div className="mt-5 rounded-[18px] border border-black/10 bg-[#FAFAFA] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] font-semibold">
          {count ? `${count} clip${count === 1 ? "" : "s"} selected` : "Pick clips to format"}
        </span>
        <span className="text-[11.5px] text-black/40">The top three are already ticked.</span>
        <button
          type="button"
          onClick={onFormat}
          disabled={!count || Boolean(importing)}
          className="pill pill-primary ml-auto h-10 px-5 text-[13px]"
        >
          {importing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scissors className="h-3.5 w-3.5" />
          )}
          {importing ? `Formatting ${importing.index}/${importing.total}` : "Format selected"}
        </button>
      </div>

      {importing ? (
        <p className="mt-2 truncate text-[11.5px] text-black/45">
          Downloading and captioning “{importing.title}”
        </p>
      ) : null}
      {error ? <p className="mt-2 text-[11.5px] leading-snug text-[#C0392B]">{error}</p> : null}
    </div>
  );
}