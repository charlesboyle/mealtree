"use client";

import { BadgeCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchBox } from "@/components/discover/search-box";
import { Logo } from "@/components/logo";
import { Photo } from "@/components/photo";
import { accentStyle } from "@/lib/accent";
import { parseQuery, scoreRestaurant } from "@/lib/search";
import type { Restaurant } from "@/lib/types";

export function FindRestaurant({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const { tokens } = parseQuery(query);
    return restaurants.filter((r) => scoreRestaurant(r, tokens) > 0);
  }, [restaurants, query]);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-lg items-center px-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-lg px-5 pb-16">
        <p className="mt-6 animate-rise text-[12.5px] font-semibold uppercase tracking-[0.1em] text-brand">For restaurants</p>
        <h1 className="mt-2 animate-rise font-display text-[38px] leading-[1.02] tracking-[-0.02em] [animation-delay:40ms] [font-variation-settings:'opsz'_60]">
          Your menu might already be here.
        </h1>
        <p className="mt-3 animate-rise text-[15px] leading-relaxed text-ink-2 [animation-delay:80ms]">
          Find your restaurant to claim it for free. Keep prices current, mark sold-out dishes, and get QR codes for your
          tables.
        </p>
        <div className="mt-6 animate-rise [animation-delay:120ms]">
          <SearchBox value={query} onChange={setQuery} examples={["Nonna Lucia", "El Faro Azul", "Dosa Republic"]} label="Find your restaurant" />
        </div>
        <ul className="mt-6 space-y-2">
          {list.map((r, i) => (
            <li key={r.slug} data-accent style={{ ...accentStyle(r.accent), animationDelay: `${160 + i * 35}ms` }} className="animate-rise">
              <Link
                href={`/claim/${r.slug}`}
                className="pressable flex items-center gap-3 rounded-2xl bg-surface p-2.5 pr-4 ring-1 ring-line hover:ring-line-strong"
              >
                <Photo id={r.cover} alt="" width={96} className="size-12 shrink-0 rounded-xl" iconSize={16} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[15px] font-medium">
                    {r.name}
                    {r.claimed && <BadgeCheck className="size-4 fill-accent text-bg" strokeWidth={2} />}
                  </p>
                  <p className="truncate text-[12.5px] text-ink-3">{r.address}</p>
                </div>
                <span className="text-[12.5px] font-medium text-ink-3">{r.claimed ? "Claimed" : "Claim"}</span>
                <ChevronRight className="size-4 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 && (
          <div className="mt-6 rounded-2xl bg-surface-2 p-5 text-center text-[14px] text-ink-2">
            Not listed yet?{" "}
            <a href="mailto:hello@example.com?subject=Add%20my%20restaurant" className="font-medium text-brand">
              Send us your menu
            </a>{" "}
            and we&apos;ll set up your page within a day.
          </div>
        )}
      </main>
    </div>
  );
}
