import { useState } from "react";
import SourceRow from "@/components/newjob/SourceRow";
import BasicsPanel from "@/components/newjob/BasicsPanel";
import TemplatePicker from "@/components/newjob/TemplatePicker";
import PreferencesPanel from "@/components/newjob/PreferencesPanel";
import { CONSENT_LINE, FORM_DEFAULTS } from "@/lib/design";

export default function NewClipForm({ onSubmit, busy = false }) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [options, setOptions] = useState(FORM_DEFAULTS);

  const patch = (next) => setOptions((current) => ({ ...current, ...next }));

  function changeUrl(value) {
    setUrl(value);
    if (value) {
      setFile(null);
      setDuration(0);
    }
  }

  function changeFile(next, nextDuration) {
    setFile(next);
    setDuration(nextDuration || 0);
    if (next) setUrl("");
  }

  const ready = Boolean(file || url.trim());

  function submit() {
    if (busy || !ready) return;
    onSubmit({ url: url.trim(), file, duration, ...options });
  }

  return (
    <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.04)] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <span className="eyebrow">New clip job</span>
        <span className="text-[11.5px] text-black/35">9:16 · 1080 × 1920</span>
      </div>

      <div className="mt-4">
        <SourceRow
          url={url}
          onUrl={changeUrl}
          file={file}
          onFile={changeFile}
          onSubmit={submit}
          busy={busy}
          ready={ready}
        />
      </div>

      <div className="mt-6 h-px bg-black/[0.06]" />

      <div className="mt-6">
        <BasicsPanel options={options} onChange={patch} duration={duration} />
      </div>

      <div className="mt-7">
        <TemplatePicker
          value={options.layout}
          onChange={(layout) => patch({ layout })}
          contentType={options.contentType}
        />
      </div>

      <div className="mt-7">
        <PreferencesPanel options={options} onChange={patch} />
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-black/35">{CONSENT_LINE}</p>
    </section>
  );
}