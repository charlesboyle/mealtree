"use client";

import { memo } from "react";
import { DietTags } from "@/components/diet-tags";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { QtyButton } from "@/components/qty-button";
import { useI18n } from "@/i18n/client";
import { optionGroups, orderable } from "@/lib/bag";
import { cn, THUMB_WIDTH } from "@/lib/format";
import type { MenuItemRow } from "./menu-item-row";

/**
 * One dish in a grid section: photo, name, price. Descriptions stay in the dish sheet. A dish without a photo
 * becomes a slim full-width row so it keeps its place in the menu order.
 */
export const MenuItemCard = memo(function MenuItemCard({
  item,
  currency,
  ordering,
  qty,
  onOpen,
  onAdd,
  onRemove,
}: Omit<React.ComponentProps<typeof MenuItemRow>, "tokens">) {
  const { t, pick } = useI18n();
  const name = pick(item.name, item.nameAr);
  const customisable = optionGroups(item).length > 0;
  const stepper =
    ordering && orderable(item) ? (
      <QtyButton qty={qty} name={name} customisable={customisable} onAdd={() => onAdd(item)} onRemove={() => onRemove(item)} />
    ) : null;
  const price = item.soldOut ? (
    <span className="font-medium text-muted">{t.menu.soldOutToday}</span>
  ) : (
    <PriceTag item={item} currency={currency} className="font-semibold tabular-nums text-ink" />
  );
  // The whole card is one button; the stepper sits above it, as in the list row.
  const open = "after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink";

  if (!item.image)
    return (
      <li id={`dish-row-${item.id}`} className="relative isolate col-span-full flex items-center gap-3 rounded-xl bg-soft py-2 ps-3.5 pe-2">
        <button type="button" onClick={() => onOpen(item)} className={cn("min-w-0 flex-1 py-0.5 text-start", open, item.soldOut && "opacity-60")}>
          <h3 className="truncate text-sm font-semibold text-ink">{name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-[13px]">
            {price}
            <DietTags tags={item.tags} />
          </div>
        </button>
        {stepper && <div className="relative z-10 shrink-0">{stepper}</div>}
      </li>
    );

  return (
    <li id={`dish-row-${item.id}`} className="group relative isolate flex flex-col">
      <div className="pointer-events-none relative">
        <Photo
          id={item.image}
          alt=""
          width={THUMB_WIDTH}
          className={cn("aspect-[4/3] w-full rounded-xl bg-soft", item.soldOut && "opacity-50 grayscale")}
          imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.05]"
        />
        {stepper && <div className="pointer-events-auto absolute -bottom-1.5 end-1 z-10 rounded-full shadow-pill">{stepper}</div>}
      </div>
      <button type="button" onClick={() => onOpen(item)} className={cn("mt-2.5 text-start", open, item.soldOut && "opacity-60")}>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
          {price}
          <DietTags tags={item.tags} />
          {item.popular && !item.soldOut && (
            <span className="rounded-full bg-brand-soft px-1.5 py-px text-[10.5px] font-semibold text-brand-ink">{t.menu.popular}</span>
          )}
        </div>
      </button>
    </li>
  );
});
