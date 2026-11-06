"use client";

import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import type { Restaurant } from "@/lib/types";

/** End-of-menu note for owners: get in touch about the listing (opens the interest form) or ask for removal. */
export function OwnerPrompt({ restaurant: r, claimed, onClaim }: { restaurant: Restaurant; claimed: boolean; onClaim: () => void }) {
  const { t, pick, date, href } = useI18n();
  const name = pick(r.name, r.nameAr);

  if (claimed) {
    return (
      <p className="mx-auto mt-10 flex max-w-6xl items-center gap-2 px-4 text-sm text-muted sm:px-6 lg:px-8">
        <BadgeCheck className="h-4 w-4 text-fresh" aria-hidden />
        {t.menu.managedBy(name, date(r.verifiedAt))}
      </p>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 rounded-2xl bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-plum">{t.menu.ownerAsk(name)}</span> {t.menu.ownerBody}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onClaim}
            className="inline-flex h-9 items-center rounded-full bg-plum px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-plum/90 active:scale-95"
          >
            {t.menu.ownerClaim}
          </button>
          <Link
            href={href(`/remove?r=${r.slug}`)}
            className="inline-flex h-9 items-center rounded-full bg-plum/[0.05] px-4 text-[13px] font-semibold text-plum transition-colors duration-150 hover:bg-plum/[0.09] active:scale-95"
          >
            {t.menu.ownerRemove}
          </Link>
        </div>
      </div>
    </div>
  );
}
