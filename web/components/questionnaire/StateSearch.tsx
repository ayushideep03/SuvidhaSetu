"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { QuestionOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StateSearchProps {
  options: QuestionOption[];
  value: string;
  onChange: (v: string) => void;
}

export function StateSearch({ options, value, onChange }: StateSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      query.trim()
        ? options.filter((o) =>
            o.label.toLowerCase().includes(query.toLowerCase())
          )
        : options,
    [options, query]
  );

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search state or UT…"
          className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-neutral-200 text-sm focus:outline-none focus:border-saffron bg-white"
          autoFocus
        />
      </div>

      {/* Chip grid */}
      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-150 cursor-pointer",
              value === opt.value
                ? "border-saffron bg-saffron text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-saffron hover:bg-saffron-light"
            )}
          >
            {opt.label}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-400 py-2">No states found.</p>
        )}
      </div>
    </div>
  );
}
