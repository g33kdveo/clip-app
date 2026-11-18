import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { PLATFORM } from "@/lib/social";

export default function TrackForm({ platform, onTrack, busy }) {
  const meta = PLATFORM[platform];
  const [value, setValue] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!value.trim()) return;
    await onTrack(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-wrap items-center gap-2">
      <input
        className="field h-10 w-full max-w-[320px] rounded-full px-4 text-[13.5px]"
        placeholder={meta.placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="pill pill-primary h-10 px-4 text-[13px]"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
        {busy ? "Looking it up" : "Track account"}
      </button>
    </form>
  );
}