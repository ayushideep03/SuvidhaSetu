"use client";

import { cn } from "@/lib/utils";

interface ChipOptionProps {
  label: string;
  hindiLabel?: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
  multiSelect?: boolean;
}

export function ChipOption({
  label,
  hindiLabel,
  emoji,
  selected,
  onClick,
  multiSelect,
}: ChipOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 min-h-[52px] w-full sm:w-auto cursor-pointer",
        "hover:border-india-green hover:bg-india-green-light",
        selected
          ? "border-india-green bg-india-green text-white shadow-sm"
          : "border-neutral-200 bg-white text-neutral-700"
      )}
    >
      {emoji && (
        <span className="text-lg leading-none shrink-0" aria-hidden>
          {emoji}
        </span>
      )}
      {multiSelect && (
        <span
          className={cn(
            "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
            selected
              ? "border-white bg-white/20"
              : "border-neutral-300"
          )}
        >
          {selected && (
            <svg viewBox="0 0 12 10" fill="none" className="w-3 h-2.5">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-sm leading-snug truncate">{label}</span>
        {hindiLabel && (
          <span
            className={cn(
              "text-xs mt-0.5 truncate",
              selected ? "text-white/75" : "text-neutral-400"
            )}
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            {hindiLabel}
          </span>
        )}
      </div>
    </button>
  );
}
