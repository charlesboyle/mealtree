"use client";

import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { useI18n } from "@/i18n/client";

export const CONTACT_EMAIL = "hello@applied.llc";

/** Footer links. Pads for the phone tab bar, or for the order bar when `bare` (the restaurant page hides the tab bar). */
export function SiteFooter({ bare = false }: { bare?: boolean }) {
  const { t, href } = useI18n();
  const link = "transition-colors duration-150 hover:text-plum";
  const f = t.site.footerLinks;
  return (
    <footer className={`bg-soft ${bare ? "pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-28" : "pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0"}`}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6 lg:px-8">
        <Wordmark tone="ink" />
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted" aria-label={t.common.footer}>
          <Link href={href("/for-restaurants")} className={link}>{f.forRestaurants}</Link>
          <Link href={href("/terms")} className={link}>{t.common.terms}</Link>
          <Link href={href("/privacy")} className={link}>{t.common.privacy}</Link>
        </nav>
        <p className="text-xs text-muted/80">
          {t.site.feedbackPrompt}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="ltr-isolate underline decoration-dashed decoration-1 underline-offset-4 transition-colors duration-150 hover:text-plum">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
