"use client";

import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, switchLocalePath, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

/**
 * Link to the same page in the other language. It's a plain <a>: /en and /ar
 * are separate root layouts (different <html lang dir>), so the browser loads
 * the page fresh either way. The choice is remembered for bare URLs like /r/slug.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const to: Locale = locale === "ar" ? "en" : "ar";
  return (
    <a
      href={switchLocalePath(pathname, to)}
      hrefLang={to}
      lang={to}
      aria-label={t.common.switchToLabel}
      onClick={(e) => {
        document.cookie = `${LOCALE_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`;
        // Keep the query and any #dish-… deep link.
        e.currentTarget.href = switchLocalePath(pathname, to) + location.search + location.hash;
      }}
      className={cn(
        "pressable inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {t.common.switchTo}
    </a>
  );
}
