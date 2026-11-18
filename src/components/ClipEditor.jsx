import { useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, Minus, Plus, RefreshCw } from "lucide-react";
import OptionPills from "@/components/OptionPills";
import TemplatePicker from "@/components/newjob/TemplatePicker";
import { AUDIO_LEVELS, BG_SWATCHES, CAM_POSITIONS, CAPTION_MODES } from "@/lib/design";
import { useClipRender } from "@/lib/useClipRender";
import { useSignedFile } from "@/lib/useSignedFile";
import { updateClip } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

function pickDraft(clip) {
  return {
    start: Number(clip.start) || 0,
    end: Number(clip.end) || 0,
    layout: clip.layout || "fill",
    cam: clip.cam || "br",
    audio_level: clip.audio_level || "original",
    zoom: Number(clip.zoom) || 1,
    bg: clip.bg || "#FED50C",
    hook: clip.hook || "",
    captions_mode: clip.captions_mode || "spoken",
    post_caption: clip.post_caption || "",
  };
}

export default function ClipEditor({ clip, jobId, onSaved, contentType = "auto" }) {
  const [draft, setDraft] = useState(() => pickDraft(clip));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { states, render } = useClipRender();
  const state = states[clip.id] || {};
  const renderedUrl = useSignedFile(clip.rendered_uri);

  useEffect(() => {
    setDraft(pickDraft(clip));
  }, [clip.id, clip.render_version]);

  function set(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function nudge(key, delta) {
    setDraft((current) => ({
      ...current,
      [key]: Math.max(0, Math.round((current[key] + delta) * 10) / 10),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await updateClip({ data: { id: clip.id, patch: draft } });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function rerender() {
    await updateClip({ data: { id: clip.id, patch: draft } });
    onSaved?.();
    const shift = draft.start - (Number(clip.start) || 0);
    const span = draft.end - draft.start;
    const words = (clip.words || [])
      .map((word) => ({ w: word.w, s: word.s - shift, e: word.e - shift }))
      .filter((word) => word.e > 0 && word.s < span);
    await render({ ...clip, ...draft, words }, jobId);
    onSaved?.();
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(draft.post_caption || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const busy = Boolean(state.busy);
  const duration = Math.max(0, draft.end - draft.start);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-[20px] border border-black/10 bg-[#F5F5F5]">
          {renderedUrl ? (
            <video
              key={`${clip.rendered_uri}-${clip.render_version}`}
              src={renderedUrl}
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex h-full w-full flex-col justify-between bg-[#FED50C] p-4">
              <p className="text-[13px] font-semibold leading-tight">{draft.hook || clip.title}</p>
              <p className="text-center text-[15px] font-black uppercase leading-[1.15] caption-preview">
                {(clip.caption_lines || []).join(" ").slice(0, 110) || "Captions ready"}
              </p>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-black/50">
                Not rendered yet
              </p>
            </div>
          )}
          {busy ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/60">
                Rendering {Math.round((state.progress || 0) * 100)}%
              </span>
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">
          9:16 · {duration.toFixed(1)}s
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={rerender} disabled={busy} className="pill pill-primary h-10 px-5 text-[13px]">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {busy ? "Rendering" : "Re-render clip"}
          </button>
          {renderedUrl ? (
            <a
              href={renderedUrl}
              download={`${clip.id}.${clip.rendered_ext || "webm"}`}
              className="pill pill-ghost h-10 px-4 text-[13px]"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          ) : null}
        </div>

        {state.error ? (
          <p className="mt-3 text-center text-[11.5px] leading-snug text-[#C0392B]">{state.error}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <span className="eyebrow">Trim</span>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { key: "start", label: "Start" },
              { key: "end", label: "End" },
            ].map((field) => (
              <div key={field.key} className="rounded-[14px] border border-black/10 px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">
                  {field.label}
                </span>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => nudge(field.key, -0.5)}
                    className="rounded-full bg-black/[0.04] p-1.5 text-black/60 hover:bg-black/10"
                    aria-label={`Nudge ${field.label} back`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-[14px] tabular-nums">{draft[field.key].toFixed(1)}s</span>
                  <button
                    type="button"
                    onClick={() => nudge(field.key, 0.5)}
                    className="rounded-full bg-black/[0.04] p-1.5 text-black/60 hover:bg-black/10"
                    aria-label={`Nudge ${field.label} forward`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <TemplatePicker
            value={draft.layout}
            onChange={(value) => set("layout", value)}
            contentType={contentType}
          />
          {draft.layout === "streamer" || draft.layout === "reaction" ? (
            <div className="mt-4">
              <label className="eyebrow" htmlFor="cam-position">
                Face cam corner
              </label>
              <select
                id="cam-position"
                className="mt-2 h-10 w-full max-w-[240px] appearance-none rounded-[12px] border border-black/12 bg-white px-3 text-[13.5px] outline-none hover:border-black/25 focus:border-black"
                value={draft.cam}
                onChange={(event) => set("cam", event.target.value)}
              >
                {CAM_POSITIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11.5px] leading-snug text-black/40">
                Which corner of the source holds your camera. The card crops that corner.
              </p>
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <span className="eyebrow">Zoom · {draft.zoom.toFixed(2)}×</span>
            <input
              type="range"
              min="1"
              max="1.6"
              step="0.05"
              value={draft.zoom}
              onChange={(event) => set("zoom", Number(event.target.value))}
              className="mt-3 w-full accent-black"
            />
          </div>
          <div>
            <span className="eyebrow">Background</span>
            <div className="mt-2.5 flex gap-2">
              {BG_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set("bg", color)}
                  style={{ backgroundColor: color }}
                  className={cn(
                    "h-8 w-8 rounded-full border transition-transform hover:scale-110",
                    draft.bg === color ? "border-black ring-2 ring-black/15" : "border-black/15"
                  )}
                  aria-label={`Background ${color}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section>
          <span className="eyebrow">Hook headline</span>
          <input
            className="field mt-2 h-11 rounded-[12px]"
            value={draft.hook}
            onChange={(event) => set("hook", event.target.value)}
            placeholder="Shown for the first 4.5 seconds"
          />
          {(clip.hook_options || []).length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {clip.hook_options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => set("hook", option)}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-[12px] text-black/60 transition-colors hover:border-black/30 hover:text-black"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <OptionPills
            label="Captions"
            options={CAPTION_MODES}
            value={draft.captions_mode}
            onChange={(value) => set("captions_mode", value)}
          />
          <OptionPills
            label="Audio level"
            options={AUDIO_LEVELS}
            value={draft.audio_level}
            onChange={(value) => set("audio_level", value)}
          />
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">Post caption</span>
            <button
              type="button"
              onClick={copyCaption}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-black/50 transition-colors hover:text-black"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            className="mt-2 w-full resize-y rounded-[14px] border border-black/12 bg-white p-3 text-[13px] leading-relaxed"
            rows={5}
            value={draft.post_caption}
            onChange={(event) => set("post_caption", event.target.value)}
          />
          <p className="mt-1.5 text-[11.5px] text-black/35">
            Keep the source credit at the end. It's what makes clipping fair.
          </p>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="pill pill-ghost h-10 px-5 text-[13px]"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save changes
          </button>
          <span className="text-[11.5px] text-black/35">
            Re-render to bake the changes into the file.
          </span>
        </div>
      </div>
    </div>
  );
}