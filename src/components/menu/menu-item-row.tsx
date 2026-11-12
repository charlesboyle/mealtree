"use client";

import { memo } from "react";
import { DietTags } from "@/components/diet-tags";
import { Highlight } from "@/components/highlight";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { QtyButton } from "@/components/qty-button";
import { useI18n } from "@/i18n/client";
import { optionGroups, orderable } from "@/lib/bag";
import { cn } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

/** One dish: details open its sheet, the stepper adds it to the order. */
export const MenuItemRow = memo(function MenuItemRow({
  item,
  tokens,
  currency,
  ordering,
  qty,
  onOpen,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  tokens: string[];
  currency: string;
  ordering: boolean;
  qty: number;
  onOpen: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}) {
  const { t, pick } = useI18n();
  const name = pick(item.name, item.nameAr);
  const description = item.description ? pick(item.description, item.descriptionAr) : undefined;
  const variantCount = item.variants?.length ?? 0;
  const customisable = optionGroups(item).length > 0;
  const stepper =
    ordering && orderable(item) ? (
      <QtyButton qty={qty} name={name} customisable={customisable} onAdd={() => onAdd(item)} onRemove={() => onRemove(item)} />
    ) : null;

  return (
    // The <li> stays put and takes the hover; only the card inside lifts, so a cursor at its bottom edge can't make it bounce.
    <li id={`dish-row-${item.id}`} className="group/lift">
      <div className="group relative isolate flex gap-3 rounded-xl py-3 before:pointer-events-none before:absolute before:inset-y-0 before:-inset-x-3 before:-z-10 before:rounded-xl before:transition-colors before:duration-200 active:before:bg-soft sm:bg-surface sm:p-3 sm:ps-4 sm:shadow-card sm:ring-1 sm:ring-line/70 sm:transition-[translate,box-shadow] sm:duration-300 sm:ease-[cubic-bezier(0.22,1,0.36,1)] sm:before:inset-x-0 sm:group-hover/lift:-translate-y-0.5 sm:group-hover/lift:shadow-float">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(
          "min-w-0 flex-1 py-0.5 text-start after:absolute after:inset-y-0 after:-inset-x-3 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink sm:after:inset-x-0",
          item.soldOut && "opacity-60",
        )}
      >
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[15px] font-semibold text-ink">
            <Highlight text={name} tokens={tokens} />
          </h3>
          <DietTags tags={item.tags} />
        </div>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">
            <Highlight text={description} tokens={tokens} />
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-sm">
          {item.soldOut ? (
            <span className="font-medium text-muted">{t.menu.soldOutToday}</span>
          ) : (
            <PriceTag item={item} currency={currency} className="font-semibold tabular-nums text-ink" />
          )}
          {item.popular && !item.soldOut && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">{t.menu.popular}</span>
          )}
          {variantCount > 1 && <span className="text-xs text-muted">{t.menu.options(variantCount)}</span>}
        </div>
      </button>

      {item.image ? (
        <div className="pointer-events-none relative h-[96px] w-[96px] shrink-0">
          <Photo
            id={item.image}
            alt=""
            width={96}
            className={cn("h-full w-full rounded-xl bg-soft", item.soldOut && "opacity-50 grayscale")}
            imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
          {stepper && <div className="pointer-events-auto absolute -bottom-1.5 end-1 z-10 rounded-full shadow-pill">{stepper}</div>}
        </div>
      ) : (
        stepper && <div className="pointer-events-auto relative z-10 self-end">{stepper}</div>
      )}
      </div>
    </li>
  );
});
