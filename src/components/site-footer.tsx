"use client";

import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { useI18n } from "@/i18n/client";

/** Footer links. Pads for the phone tab bar unless `bare` (the restaurant page hides the bar). */
export function SiteFooter({ bare = false }: { bare?: boolean }) {
  const { t, href } = useI18n();
  const link = "transition-colors duration-150 hover:text-plum";
  const f = t.site.footerLinks;
  return (
    <footer className={`bg-soft ${bare ? "hidden md:block md:pb-28" : "pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0"}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <Wordmark tone="ink" />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label={t.common.footer}>
          <Link href={href("/for-restaurants")} className={link}>{f.forRestaurants}</Link>
          <Link href={href("/terms")} className={link}>{t.common.terms}</Link>
          <Link href={href("/privacy")} className={link}>{t.common.privacy}</Link>
        </nav>
      </div>
    </footer>
  );
}
