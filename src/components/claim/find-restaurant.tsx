"use client";

import { BadgeCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchBox } from "@/components/discover/search-box";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { RestaurantThumb } from "@/components/photo";
import { useI18n } from "@/i18n/client";
import { accentStyle } from "@/lib/accent";
import { parseQuery, scoreRestaurant } from "@/lib/search";
import type { Restaurant } from "@/lib/types";

export function FindRestaurant({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, pick, href } = useI18n();
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const { tokens } = parseQuery(query);
    return restaurants.filter((r) => scoreRestaurant(r, tokens) > 0);
  }, [restaurants, query]);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Logo />
        <LanguageToggle className="-me-2" />
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <p className="mt-6 text-sm font-medium text-brand">{t.find.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{t.find.title}</h1>
        <p className="mt-3 text-base text-ink-2">{t.find.lead}</p>
        <SearchBox value={query} onChange={setQuery} label={t.find.searchLabel} className="mt-6" />
        <ul className="mt-4 divide-y divide-line">
          {list.map((r) => (
            <li key={r.slug} data-accent style={accentStyle(r.accent)}>
              <Link
                href={href(`/claim/${r.slug}`)}
                transitionTypes={["nav-forward"]}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-2/60"
              >
                <RestaurantThumb restaurant={r} className="size-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-base font-medium">
                    {pick(r.name, r.nameAr)}
                    {r.claimed && <BadgeCheck className="size-4 fill-accent text-bg" strokeWidth={2} />}
                  </p>
                  <p className="truncate text-sm text-ink-3">{pick(r.address, r.addressAr)}</p>
                </div>
                <span className="text-sm font-medium text-ink-3">{r.claimed ? t.find.claimed : t.find.claim}</span>
                <ChevronRight className="size-4 text-ink-3 rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 && (
          <p className="mt-6 rounded-xl bg-surface-2 p-5 text-center text-sm text-ink-2">
            {t.find.notListed}{" "}
            <a href="mailto:hello@example.com?subject=Add%20my%20restaurant" className="font-medium text-brand">
              {t.find.sendMenu}
            </a>{" "}
            {t.find.notListedTail}
          </p>
        )}
      </main>
    </div>
  );
}
