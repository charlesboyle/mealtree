"use client";

import { motion } from "motion/react";
import { useI18n } from "@/i18n/client";
import { MIN_MOOD_RESTAURANTS, MOODS } from "@/lib/moods";

/**
 * Category tabs: line icon + label, underline on the active one. With `counts` (restaurants per mood), tabs that fit
 * fewer than MIN_MOOD_RESTAURANTS are hidden; "all" and the active tab always stay.
 */
export function MoodRail({ value, onChange, counts }: { value: string; onChange: (id: string) => void; counts?: Record<string, number> }) {
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t.site.moodsLabel}
      className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 sm:-mx-6 sm:gap-8 sm:px-6 lg:mx-0 lg:justify-between lg:px-0"
    >
      {MOODS.filter(({ id }) => !counts || id === "all" || id === value || (counts[id] ?? 0) >= MIN_MOOD_RESTAURANTS).map(({ id, icon: Icon }) => {
        const active = id === value;
        return (
          <motion.button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.12 }}
            className={`group relative flex shrink-0 flex-col items-center gap-1.5 pb-3 pt-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum ${
              active ? "text-plum" : "text-muted hover:text-plum"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={active ? 2 : 1.6} aria-hidden />
            <span className={`whitespace-nowrap text-xs ${active ? "font-semibold" : "font-medium"}`}>{t.site.moods[id as keyof typeof t.site.moods]}</span>
            {active && (
              <motion.span
                layoutId="mood-underline"
                className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-plum"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
