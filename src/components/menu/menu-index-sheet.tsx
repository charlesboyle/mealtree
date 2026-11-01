"use client";

import { X } from "lucide-react";
import { Sheet } from "@/components/sheet";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

export type IndexEntry = { id: string; label: string; count?: number; group?: string };

/** Every section of the menu at a glance, grouped when the menu has groups; tap one to jump there. */
export function MenuIndexSheet({
  open,
  onClose,
  entries,
  activeId,
  onSelect,
  style,
}: {
  open: boolean;
  onClose: () => void;
  entries: IndexEntry[];
  activeId: string;
  onSelect: (id: string) => void;
  style: React.CSSProperties;
}) {
  const { t } = useI18n();
  // Consecutive entries with the same group label share a heading.
  const blocks: { group: string; entries: IndexEntry[] }[] = [];
  for (const e of entries) {
    const g = e.group ?? "";
    const last = blocks.at(-1);
    if (last && last.group === g) last.entries.push(e);
    else blocks.push({ group: g, entries: [e] });
  }

  const jump = (id: string) => {
    onClose();
    // Let the sheet release its scroll lock before the page scrolls.
    window.setTimeout(() => onSelect(id), 80);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.restaurant.allSections}
      look="modal"
      dragToClose
      style={style}
      className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
    >
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <div className="flex items-center justify-between px-5 pb-2 pt-3">
        <h2 className="text-lg font-semibold text-ink">{t.restaurant.menu}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-soft text-ink transition-colors duration-150 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {blocks.map((b, i) => (
          <div key={i} className="pb-2">
            {b.group && <p className="px-2 pb-1 pt-3 text-xs font-semibold text-muted">{b.group}</p>}
            {b.entries.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => jump(e.id)}
                aria-current={e.id === activeId ? "true" : undefined}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-2 py-3 text-start text-[15px] text-ink transition-colors hover:bg-soft",
                  e.id === activeId ? "font-semibold" : "font-medium",
                )}
              >
                <span className="truncate">{e.label}</span>
                {e.count !== undefined && <span className="ms-3 shrink-0 text-sm tabular-nums text-muted">{e.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
