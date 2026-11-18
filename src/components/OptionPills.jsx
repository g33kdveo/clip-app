import { cn } from "@/lib/utils";

export default function OptionPills({ label, options, value, onChange }) {
  return (
    <div>
      {label ? <span className="eyebrow">{label}</span> : null}
      <div
        className={cn(
          "inline-flex flex-wrap gap-1 rounded-full border border-black/10 p-1",
          label && "mt-2"
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors",
              value === option.value
                ? "bg-black text-white"
                : "text-black/55 hover:text-black"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}