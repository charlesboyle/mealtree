"use client";

import { LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import type { MenuLayout } from "@/lib/menu-layout";

/** Two-icon switch between the list and the photo grid. */
export function MenuLayoutToggle({ layout, onChoose, className }: { layout: MenuLayout; onChoose: (l: MenuLayout) => void; className?: string }) {
  const { t } = useI18n();
  const options = [
    { value: "list", label: t.menu.listView, Icon: List },
    { value: "grid", label: t.menu.gridView, Icon: LayoutGrid },
  ] as const;
  return (
    <div className={cn("flex shrink-0 gap-0.5 rounded-full bg-soft p-0.5", className)}>
      {options.map(({ value, label, Icon }) => {
        const on = layout === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChoose(value)}
            aria-pressed={on}
            aria-label={label}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
              on ? "bg-surface text-ink shadow-pill" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
