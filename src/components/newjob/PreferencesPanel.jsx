import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import OptionPills from "@/components/OptionPills";
import {
  AUDIO_LEVELS,
  CAPTION_MODES,
  CONTENT_TYPES,
  HOOK_MODES,
  LEAD_INS,
  VOICES,
} from "@/lib/design";
import { cn } from "@/lib/utils";

export default function PreferencesPanel({ options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[18px] border border-black/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
      >
        <SlidersHorizontal className="h-4 w-4 text-black/40" />
        <span className="text-[13.5px] font-semibold">Clip preferences</span>
        <span className="ml-auto text-[11.5px] text-black/35">Optional</span>
        <ChevronDown
          className={cn("h-4 w-4 text-black/35 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="border-t border-black/[0.07] px-4 py-5">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold">What is in it</span>
              <span className="text-[11.5px] text-black/35">What a good moment looks like</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onChange({ contentType: type.value })}
                  aria-pressed={options.contentType === type.value}
                  className={cn(
                    "h-9 rounded-[10px] border text-[12.5px] font-medium transition-colors",
                    options.contentType === type.value
                      ? "border-black bg-black/[0.04] text-black"
                      : "border-black/10 text-black/55 hover:border-black/25 hover:text-black"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold">Lead-in</span>
              <span className="text-[11.5px] text-black/35">Before the first line</span>
            </div>
            <div className="mt-2.5">
              <OptionPills
                label=""
                options={LEAD_INS}
                value={options.leadIn}
                onChange={(value) => onChange({ leadIn: value })}
              />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-black/40">
              Opens each clip a little before the first line, so the play or reaction being
              talked about is inside the clip. Good for gameplay and reactions.
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <label className="text-[13px] font-semibold" htmlFor="clip-focus">
                Focus
              </label>
              <span className="font-mono text-[11px] text-black/35">
                {options.focus.length}/500
              </span>
            </div>
            <textarea
              id="clip-focus"
              rows={2}
              maxLength={500}
              value={options.focus}
              onChange={(event) => onChange({ focus: event.target.value })}
              placeholder="e.g. only the parts about pricing"
              className="mt-2 w-full resize-y rounded-[12px] border border-black/12 bg-white p-3 text-[13px] leading-relaxed outline-none transition-colors hover:border-black/25 focus:border-black"
            />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <OptionPills
              label="Audio level"
              options={AUDIO_LEVELS}
              value={options.audioLevel}
              onChange={(value) => onChange({ audioLevel: value })}
            />
            <OptionPills
              label="Headline voice"
              options={VOICES}
              value={options.voice}
              onChange={(value) => onChange({ voice: value })}
            />
            <OptionPills
              label="Captions"
              options={CAPTION_MODES}
              value={options.captions}
              onChange={(value) => onChange({ captions: value })}
            />
            <OptionPills
              label="Headline language"
              options={HOOK_MODES}
              value={options.hook}
              onChange={(value) => onChange({ hook: value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}