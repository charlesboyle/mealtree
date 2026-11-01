"use client";

import { motion } from "motion/react";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { SortKey } from "@/lib/use-discover-filters";

const chip =
  "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-[border-color,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum";
const idle = "border-line bg-white text-plum hover:border-plum/30";
const on = "border-plum bg-plum text-white";

/** One swipeable row of quick filters. Never wraps. */
export function DiscoverFilterBar({
  openNow,
  onOpenNowChange,
  priceLevel,
  onPriceLevelChange,
  sort,
  onSortChange,
}: {
  openNow: boolean;
  onOpenNowChange: (v: boolean) => void;
  priceLevel: number;
  onPriceLevelChange: (v: number) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
}) {
  const { t } = useI18n();
  const l = t.site.list;
  const sorts: { id: SortKey; label: string }[] = [
    { id: "recommended", label: l.forYou },
    { id: "rating", label: l.topRated },
  ];
  const sortLabel = sorts.find((s) => s.id === sort)?.label ?? l.forYou;

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5 ps-4 pe-8 sm:ps-6 sm:pe-10 lg:px-0" role="group" aria-label={l.filters}>
        <label className={`relative ${chip} ${sort === "recommended" ? idle : on} cursor-pointer pe-8`}>
          <ArrowDownUp className="h-3.5 w-3.5" aria-hidden />
          <span>{sortLabel}</span>
          <ChevronDown className="pointer-events-none absolute end-3 h-3.5 w-3.5" aria-hidden />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            aria-label={l.sortBy}
            className="absolute inset-0 cursor-pointer appearance-none opacity-0"
          >
            {sorts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          aria-pressed={openNow}
          onClick={() => onOpenNowChange(!openNow)}
          className={`${chip} ${openNow ? on : idle}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${openNow ? "bg-lime" : "bg-fresh"}`} aria-hidden />
          {l.openNow}
        </motion.button>

        {[1, 2, 3].map((level) => {
          const active = priceLevel === level;
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={level}
              type="button"
              aria-pressed={active}
              onClick={() => onPriceLevelChange(active ? 0 : level)}
              className={`${chip} ${active ? on : idle}`}
            >
              {t.price.levels[level - 1]}
            </motion.button>
          );
        })}
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-6 bg-gradient-to-l from-cream to-transparent lg:hidden rtl:bg-gradient-to-r" />
    </div>
  );
}
