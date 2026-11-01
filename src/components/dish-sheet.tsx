"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DietTags } from "@/components/diet-tags";
import { DishOptions } from "@/components/dish-options";
import { ImageLightbox } from "@/components/image-lightbox";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { Sheet } from "@/components/sheet";
import { Swap } from "@/components/swap";
import { useI18n } from "@/i18n/client";
import {
  defaultSelections,
  MAX_QTY,
  missingRequired,
  optionGroups,
  orderable,
  type Selections,
  unitPrice,
} from "@/lib/bag";
import { cn } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

/**
 * One dish in a sheet: photo, details, choices, and (when the restaurant takes
 * WhatsApp orders) quantity and "Add to order". Previous / next step through
 * the dishes currently listed.
 */
export function DishSheet({
  item,
  currency,
  claimed,
  style,
  ordering,
  onAdd,
  onClose,
}: {
  item: MenuItem | null;
  currency: string;
  claimed: boolean;
  style: React.CSSProperties;
  /** The restaurant has a WhatsApp number, so dishes can be added. */
  ordering: boolean;
  onAdd: (item: MenuItem, selections: Selections, qty: number) => void;
  onClose: () => void;
}) {
  const i18n = useI18n();
  const { t, pick, alt } = i18n;
  // Keep rendering the last dish while the sheet animates out.
  const [last, setLast] = useState(item);
  if (item && item !== last) setLast(item);
  const shown = item ?? last;

  const [selections, setSelections] = useState<Selections>({});
  const [qty, setQty] = useState(1);
  const [flag, setFlag] = useState<string>();
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [forId, setForId] = useState<string>();
  // Fresh choices whenever another dish is shown.
  if (shown && shown.id !== forId) {
    setForId(shown.id);
    setSelections(defaultSelections(optionGroups(shown)));
    setQty(1);
    setFlag(undefined);
    setAdded(false);
    setZoom(false);
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // The footer divider only reads as a scroll affordance while there is content left below.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showDivider, setShowDivider] = useState(false);
  const measureScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowDivider(el.scrollHeight > el.clientHeight + 1 && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, []);

  const open = !!item;
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(measureScroll);
    window.addEventListener("resize", measureScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureScroll);
    };
  }, [open, shown?.id, measureScroll]);
  const name = shown ? pick(shown.name, shown.nameAr) : "";
  const groups = shown ? optionGroups(shown) : [];
  const canOrder = !!shown && ordering && orderable(shown);
  const unit = shown ? unitPrice(shown, groups, selections) : null;
  const multi = groups.some((g) => g.id === "variant");

  const add = () => {
    if (!shown) return;
    const missing = missingRequired(groups, selections);
    if (missing) {
      setFlag(undefined);
      requestAnimationFrame(() => setFlag(missing.id));
      return;
    }
    onAdd(shown, selections, qty);
    setAdded(true);
    timer.current = setTimeout(onClose, 450);
  };

  const footer =
    canOrder && unit !== null ? (
      <div className="sheet-actions relative shrink-0 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
        <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-line transition-opacity duration-200", showDivider ? "opacity-100" : "opacity-0")} />
        <div className="flex items-center gap-2">
          <div role="group" aria-label={t.dish.quantity} className="flex h-12 shrink-0 items-center rounded-full bg-soft px-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label={t.dish.fewer}
              className="flex h-10 w-9 items-center justify-center rounded-full text-plum transition-[background-color,transform,opacity] duration-150 hover:bg-line active:scale-90 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span aria-live="polite" className="flex w-6 justify-center text-sm font-semibold tabular-nums text-plum">
              <Swap id={qty}>{qty}</Swap>
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              aria-label={t.dish.more}
              className="flex h-10 w-9 items-center justify-center rounded-full text-plum transition-[background-color,transform] duration-150 hover:bg-line active:scale-90"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <motion.button
            type="button"
            onClick={add}
            disabled={added}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold text-white transition-colors duration-200",
              added ? "bg-fresh" : "bg-tomato hover:bg-tomato-dark",
            )}
          >
            <Swap id={added ? "added" : `add-${unit * qty}`}>
              {added ? (
                <span className="flex items-center gap-1.5">
                  <Check className="size-4" aria-hidden /> {t.dish.added}
                </span>
              ) : (
                <span className="whitespace-nowrap">
                  {t.dish.add} · <PriceTag amount={unit * qty} currency={currency} className="tabular-nums" />
                </span>
              )}
            </Swap>
          </motion.button>
        </div>
        {flag && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {t.dish.missing(t.item.options)}
          </p>
        )}
      </div>
    ) : null;

  const headerClose = (
    <button
      type="button"
      onClick={onClose}
      aria-label={t.common.close}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-ink transition-colors duration-150 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
    >
      <X className="h-4 w-4" />
    </button>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={name}
      look="modal"
      dragToClose
      style={style}
      className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
    >
      {shown && (
        <>
          <div ref={scrollRef} onScroll={measureScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {shown.image ? (
              <div className="relative aspect-[16/9] overflow-hidden bg-soft">
                <Photo key={shown.id} id={shown.image} alt="" width={560} placeholderWidth={96} priority className="absolute inset-0 h-full w-full" />
                <button
                  type="button"
                  onClick={() => setZoom(true)}
                  aria-label={t.dish.viewPhoto}
                  className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
                />
                <div className="absolute start-1/2 top-3 h-1.5 w-10 -translate-x-1/2 rounded-full bg-surface/80 sm:hidden rtl:translate-x-1/2" aria-hidden />
              </div>
            ) : (
              <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            )}
            <div className="px-5 pb-3 pt-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold leading-tight text-ink">{name}</h2>
                  {alt(shown.name, shown.nameAr) && (
                    <p lang={i18n.locale === "ar" ? "en" : "ar"} className="mt-0.5 text-sm text-muted">
                      {alt(shown.name, shown.nameAr)}
                    </p>
                  )}
                </div>
                {headerClose}
              </div>
              {shown.description && <p className="mt-2.5 text-sm leading-relaxed text-muted">{pick(shown.description, shown.descriptionAr)}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {shown.soldOut ? (
                    <span className="text-base font-medium text-muted">{t.item.soldOut}</span>
                  ) : multi && unit !== null ? (
                    <PriceTag amount={unitPrice(shown, groups, { ...selections, addOns: [] }) ?? unit} currency={currency} />
                  ) : (
                    <PriceTag item={shown} currency={currency} />
                  )}
                </span>
                {shown.popular && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-dark">{t.menu.popular}</span>}
                <DietTags tags={shown.tags} long className="text-sm" />
              </div>

          {groups.length > 0 &&
            (canOrder ? (
              <div className="mt-6">
                <DishOptions groups={groups} value={selections} onChange={setSelections} flagged={flag} currency={currency} />
              </div>
            ) : (
              <OptionList item={shown} currency={currency} />
            ))}

          {shown.tags?.length ? (
            <p className="mt-6 text-xs text-ink-3">
              {claimed ? t.item.dietOwner : t.item.dietPrinted} {t.item.allergies}
            </p>
          ) : null}

            </div>
          </div>
          {footer}
        </>
      )}
      <ImageLightbox id={shown?.image} alt={name} open={zoom} onClose={() => setZoom(false)} />
    </Sheet>
  );
}

/** Read-only options for a dish that can't be added (ordering off, sold out or unpriced). */
function OptionList({ item, currency }: { item: MenuItem; currency: string }) {
  const { t, pick } = useI18n();
  const section = (title: string, list: NonNullable<MenuItem["variants"]>, plus?: boolean) => (
    <section className="mt-6">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {list.map((v, i) => (
          <li key={v.label + i} className="flex items-center justify-between gap-3 py-3 text-base text-ink-2">
            {pick(v.label, v.labelAr)}
            <span className="font-medium text-ink">
              {plus && "+"}
              <PriceTag amount={v.price} currency={currency} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <>
      {item.variants && item.variants.length > 1 && section(t.item.options, item.variants)}
      {item.addOns && item.addOns.length > 0 && section(t.item.addOns, item.addOns, true)}
    </>
  );
}
