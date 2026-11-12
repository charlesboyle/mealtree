"use client";

import { ArrowRight, Store } from "lucide-react";
import { openMenuForm } from "@/components/menu-submission-form";
import { useI18n } from "@/i18n/client";
import type { MenuSubmissionSource } from "@/lib/surveys";

/** "Own a restaurant? Get your digital menu for free": a compact card that opens the owner menu form. */
export function OwnerMenuCard({ source = "home", className }: { source?: MenuSubmissionSource; className?: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => openMenuForm({ source })}
      className={`group/lift group block w-full rounded-2xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum ${className ?? ""}`}
    >
      <span className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:-translate-y-0.5 group-hover/lift:shadow-float sm:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tomato-soft text-tomato sm:size-12" aria-hidden>
        <Store className="size-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-plum sm:text-base">{t.menuForm.homeTitle}</span>
        <span className="block text-sm text-muted">{t.menuForm.homeBody}</span>
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-plum transition-[background-color,color,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:translate-x-0.5 group-hover/lift:bg-plum group-hover/lift:text-white rtl:group-hover/lift:-translate-x-0.5">
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
      </span>
      </span>
    </button>
  );
}
