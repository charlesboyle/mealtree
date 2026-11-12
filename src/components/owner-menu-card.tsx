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
      className={`group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-start shadow-card ring-1 ring-line/70 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum sm:p-5 ${className ?? ""}`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tomato-soft text-tomato sm:size-12" aria-hidden>
        <Store className="size-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-plum sm:text-base">{t.menuForm.homeTitle}</span>
        <span className="block text-sm text-muted">{t.menuForm.homeBody}</span>
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-plum transition-[background-color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:bg-plum group-hover:text-white rtl:group-hover:-translate-x-0.5">
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
      </span>
    </button>
  );
}
