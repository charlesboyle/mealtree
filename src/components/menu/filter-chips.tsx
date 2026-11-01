"use client";

import { Chip } from "@/components/chip";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import type { DietTag } from "@/lib/types";

export type Filter = DietTag;

const ORDER: Filter[] = ["vegetarian", "vegan", "gluten-free", "spicy"];

/** Diet filters for a menu; only the ones some dish has. Popular dishes already have their own section and tab. */
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
    <div
      role="group"
      aria-label={t.restaurant.dietaryFilters}
      className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1.5 sm:mx-0 sm:px-0", className)}
    >
      {chips.map((f) => (
        <Chip key={f} on={active.includes(f)} onClick={() => onToggle(f)}>
          {t.diet[f]}
        </Chip>
      ))}
    </div>
  );
}
