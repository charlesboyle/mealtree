"use client";

import { BadgeCheck, FileText, Images } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "@/i18n/client";
import type { Restaurant } from "@/lib/types";

/** Quiet provenance line: where this menu came from and when it was updated, with the original pages one tap away. */
export function MenuSourceNote({
  restaurant: r,
  claimed,
  onViewOriginal,
}: {
  restaurant: Restaurant;
  claimed: boolean;
  onViewOriginal: () => void;
}) {
  const { t, pick, date } = useI18n();
  const pages = r.menuFiles?.files.length ?? 0;
  const updated = date(r.menuFiles?.received ?? r.verifiedAt);
  return (
    <div className="mt-4 flex flex-wrap items-start gap-2 rounded-2xl bg-paper p-3 sm:flex-nowrap sm:items-center">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ${claimed ? "text-fresh" : "text-muted"}`} aria-hidden>
        {claimed ? <BadgeCheck className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </span>
      <p className="min-w-0 basis-[calc(100%-40px)] text-[13px] leading-snug sm:flex-1 sm:basis-auto">
        <span className="block font-medium text-plum">
          {claimed ? t.menu.keptBy(pick(r.name, r.nameAr)) : t.menu.takenFrom(t.source[r.source])}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-2 text-muted">
          <span>{t.menu.updated(updated)}</span>
          <span>{t.menu.counterPrices}</span>
        </span>
      </p>
      {pages > 0 && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={onViewOriginal}
          className="ms-10 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-semibold text-plum shadow-card transition-shadow duration-150 hover:shadow-pill sm:ms-0"
        >
          <Images className="h-4 w-4" aria-hidden />
          {t.menu.original}
          <span className="text-muted">{pages}</span>
        </motion.button>
      )}
    </div>
  );
}
