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
        "flex h-11 items-center gap-3 rounded-full bg-soft px-4 transition-[background-color,box-shadow] duration-150 focus-within:bg-white focus-within:shadow-pill focus-within:ring-1 focus-within:ring-line",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t.common.clearSearch}
          className="grid size-6 place-items-center rounded-full bg-line text-plum transition-transform active:scale-90"
        >
          <X className="size-3.5" strokeWidth={2.6} />
        </button>
      )}
    </label>
  );
}
