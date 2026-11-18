import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CLIP_COUNTS, CLIP_LENGTHS, CONTENT_TYPES, LEAD_INS, VOICES } from "@/lib/design";

const field =
  "mt-1 w-full rounded-[10px] border border-black/12 bg-white px-2.5 py-2 text-[12.5px] focus:border-black focus:outline-none";

function Label({ children }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">{children}</span>
  );
}

export default function MomentSettings({ job, busy, onSave }) {
  const [form, setForm] = useState({
    clip_count: Number(job.clip_count) || 8,
    clip_length: Number(job.clip_length) || 45,
    content_type: job.content_type || "auto",
    voice: job.voice || "punchy",
    lead_in: Number(job.lead_in) || 0,
    focus: job.focus || "",
  });

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  return (
    <div className="mt-6 rounded-[20px] border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold">What to look for</p>
          <p className="mt-0.5 text-[12.5px] text-black/45">
            Applies the next time the moments are picked.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={busy}
          className="pill pill-ghost h-9 px-4 text-[13px]"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {busy ? "Picking" : "Save and pick again"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <Label>Clips</Label>
          <select
            className={field}
            value={form.clip_count}
            onChange={(event) => set({ clip_count: Number(event.target.value) })}
          >
            {CLIP_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Length</Label>
          <select
            className={field}
            value={form.clip_length}
            onChange={(event) => set({ clip_length: Number(event.target.value) })}
          >
            {CLIP_LENGTHS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Looking for</Label>
          <select
            className={field}
            value={form.content_type}
            onChange={(event) => set({ content_type: event.target.value })}
          >
            {CONTENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Voice</Label>
          <select
            className={field}
            value={form.voice}
            onChange={(event) => set({ voice: event.target.value })}
          >
            {VOICES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Lead-in</Label>
          <select
            className={field}
            value={form.lead_in}
            onChange={(event) => set({ lead_in: Number(event.target.value) })}
          >
            {LEAD_INS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <Label>Steer it (optional)</Label>
        <input
          className={field}
          value={form.focus}
          onChange={(event) => set({ focus: event.target.value })}
          placeholder="Only the parts about pricing"
        />
      </label>
    </div>
  );
}