"use client";

import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { QtyButton } from "@/components/qty-button";
import { useI18n } from "@/i18n/client";
import { optionGroups, orderable } from "@/lib/bag";
import type { MenuItem } from "@/lib/types";

/** The restaurant's popular dishes as a swipeable row of photo cards. */
export function MenuPopular({
  id,
  items,
  currency,
  ordering,
  qtyOf,
  onOpen,
  onAdd,
  onRemove,
}: {
  id: string;
  items: MenuItem[];
  currency: string;
  ordering: boolean;
  qtyOf: (id: string) => number;
  onOpen: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}) {
  const { t, pick } = useI18n();
  return (
    <section id={id} aria-labelledby="popular-heading" className="scroll-mt-28 pt-8">
      <h2 id="popular-heading" className="text-[15px] font-semibold tracking-tight text-ink sm:text-base">
        {t.menu.popular}
      </h2>
      {/* scroll-px keeps snapped cards aligned with the page gutter instead of the screen edge. */}
      <ul className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-2 lg:scroll-px-2 lg:px-2">
        {items.map((item) => {
          const name = pick(item.name, item.nameAr);
          return (
            <li key={item.id} className="group/lift flex w-44 shrink-0 snap-start sm:w-52">
              <div className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70 transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:-translate-y-0.5 group-hover/lift:shadow-float">
                <Photo
                  id={item.image}
                  alt=""
                  width={400}
                  className="aspect-[4/3] w-full bg-soft"
                  imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                  fallback={<span className="px-4 text-center text-sm font-semibold text-muted">{name}</span>}
                />
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="px-3 pt-2.5 text-start after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink"
                >
                  <h3 className="line-clamp-2 min-h-[38px] text-sm font-semibold text-ink">{name}</h3>
                </button>
                <div className="relative z-10 mt-auto flex items-center justify-between px-3 pb-3 pt-1.5">
                  <PriceTag item={item} currency={currency} className="text-sm font-semibold tabular-nums text-ink" />
                  {ordering && orderable(item) && (
                    <QtyButton qty={qtyOf(item.id)} name={name} customisable={optionGroups(item).length > 0} onAdd={() => onAdd(item)} onRemove={() => onRemove(item)} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
