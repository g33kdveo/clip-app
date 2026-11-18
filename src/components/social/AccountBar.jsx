import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountBar({ accounts, activeId, onPick, onRemove }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {accounts.map((account) => {
        const active = account.id === activeId;
        return (
          <span
            key={account.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border pl-3 pr-1 transition-colors",
              active ? "border-black bg-black text-white" : "border-black/12 bg-white text-black/65"
            )}
          >
            <button
              type="button"
              onClick={() => onPick(account.id)}
              className="max-w-[190px] truncate py-1.5 text-[12.5px] font-medium"
            >
              @{account.handle}
            </button>
            <button
              type="button"
              onClick={() => onRemove(account.id)}
              aria-label={`Stop tracking ${account.handle}`}
              className={cn(
                "rounded-full p-1 transition-opacity",
                active ? "text-white/50 hover:text-white" : "text-black/25 hover:text-black"
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}