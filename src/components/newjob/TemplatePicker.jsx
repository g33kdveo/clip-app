import { Check } from "lucide-react";
import { TEMPLATES, TEMPLATE_STYLE } from "@/lib/design";
import { recommendTemplates } from "@/lib/recommend";
import { cn } from "@/lib/utils";
import TemplateGlyph from "@/components/newjob/TemplateGlyph";

export default function TemplatePicker({ value, onChange, contentType = "auto" }) {
  const picks = recommendTemplates(contentType);
  const pickIds = picks.map((pick) => pick.id);
  const rest = TEMPLATES.filter((template) => !pickIds.includes(template.id));
  const selected = TEMPLATE_STYLE[value] || TEMPLATES[0];

  const card = (template, recommended) => (
    <button
      key={template.id}
      type="button"
      onClick={() => onChange(template.id)}
      aria-pressed={value === template.id}
      className={cn(
        "relative rounded-[12px] border p-1.5 text-left transition-all",
        value === template.id
          ? "border-black bg-black/[0.03]"
          : "border-black/10 hover:border-black/30",
        recommended &&
          value !== template.id &&
          "border-[#F2C400]/60 bg-[#FFFDF4] shadow-[0_0_20px_-4px_rgba(254,213,12,0.95)]"
      )}
    >
      <TemplateGlyph template={template} />
      <span className="mt-1.5 block px-0.5 pb-0.5 text-[11px] font-semibold leading-tight">
        {template.name}
      </span>
      {recommended ? (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#FED50C] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-black">
          {template.id === picks[0].id ? "Top pick" : "Pick"}
        </span>
      ) : null}
      {value === template.id ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </button>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">Template</span>
        <span className="text-[11.5px] text-black/35">Recommended first</span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {picks.map((template) => card(template, true))}
        {rest.map((template) => card(template, false))}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-black/45">
        {pickIds.includes(value) ? (
          <span className="font-semibold text-black">Recommended · </span>
        ) : null}
        {selected.note}
      </p>
    </div>
  );
}