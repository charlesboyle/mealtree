"use client";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import type { DietTag } from "@/lib/types";

export type Filter = DietTag | "popular";

const ORDER: Filter[] = ["popular", "vegetarian", "vegan", "gluten-free", "spicy"];

export function FilterChips({
  available,
  active,
  onToggle,
  className,
}: {
  available: Set<Filter>;
  active: Filter[];
  onToggle: (f: Filter) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const chips = ORDER.filter((f) => available.has(f));
  if (!chips.length) return null;
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5", className)}>
      {chips.map((f) => (
        <Chip key={f} on={active.includes(f)} onClick={() => onToggle(f)}>
          {f === "popular" ? t.menu.popular : t.diet[f]}
        </Chip>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "pressable h-8 shrink-0 rounded-full border px-3.5 text-sm font-medium",
        on ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
