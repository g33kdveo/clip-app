import OptionPills from "@/components/OptionPills";
import { CLIP_COUNTS, CLIP_LENGTHS, LANGUAGES, clipEstimate } from "@/lib/design";

const SELECT_CLASS =
  "mt-2 h-10 w-full appearance-none rounded-[12px] border border-black/12 bg-white px-3 pr-8 text-[13.5px] text-black outline-none transition-colors hover:border-black/25 focus:border-black";

export default function BasicsPanel({ options, onChange, duration }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <div>
        <label className="eyebrow" htmlFor="clip-count">
          Number of clips
        </label>
        <select
          id="clip-count"
          className={SELECT_CLASS}
          value={options.clipCount}
          onChange={(event) => onChange({ clipCount: Number(event.target.value) })}
        >
          {CLIP_COUNTS.map((count) => (
            <option key={count} value={count}>
              {count} clips
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11.5px] leading-snug text-black/40">
          {clipEstimate(duration, options.clipLength)}
        </p>
      </div>

      <div>
        <span className="eyebrow">Clip length</span>
        <div className="mt-2">
          <OptionPills
            label=""
            options={CLIP_LENGTHS}
            value={options.clipLength}
            onChange={(value) => onChange({ clipLength: value })}
          />
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-black/40">
          A target, not a hard cut. Moments stop when the thought ends.
        </p>
      </div>

      <div>
        <label className="eyebrow" htmlFor="clip-language">
          Spoken language
        </label>
        <select
          id="clip-language"
          className={SELECT_CLASS}
          value={options.language}
          onChange={(event) => onChange({ language: event.target.value })}
        >
          {LANGUAGES.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11.5px] leading-snug text-black/40">
          The transcript follows the audio. Headlines stay in English.
        </p>
      </div>
    </div>
  );
}