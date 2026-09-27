"use client";

import { Search, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

export function SearchBox({
  value,
  onChange,
  label,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  return (
    <label
      className={cn(
        "flex h-12 items-center gap-3 rounded-xl border border-line-strong bg-surface px-3.5 shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:border-ink-3 focus-within:shadow-md",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-ink-3" strokeWidth={2} />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent text-md text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t.common.clearSearch}
          className="grid size-6 place-items-center rounded-full bg-surface-3 text-ink-2 hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2.6} />
        </button>
      )}
    </label>
  );
}
