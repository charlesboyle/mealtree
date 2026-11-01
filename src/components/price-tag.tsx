"use client";

import { useI18n } from "@/i18n/client";
import { formatAmount } from "@/i18n/format";
import { cn } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

/**
 * "AED 25", in the surrounding text style. Order follows the language: "AED 25" · "25 د.إ".
 */
export function PriceTag({
  item,
  currency = "AED",
  amount,
  className,
}: {
  item?: MenuItem;
  currency?: string;
  /** Show this exact amount instead of the item's (e.g. a selected option). */
  amount?: number;
  className?: string;
}) {
  const i18n = useI18n();
  let value = amount ?? null;
  let from = false;
  if (value === null && item) {
    if (item.price === null) {
      return <span className={cn("text-muted", className)}>{item.priceNote ?? i18n.t.price.ask}</span>;
    }
    value = item.price;
    if (item.variants && item.variants.length > 1) {
      const prices = item.variants.map((v) => v.price);
      value = Math.min(...prices);
      from = value !== Math.max(...prices);
    }
  }
  if (value === null) return null;
  const cur = <span>{i18n.currency(currency)}</span>;
  return (
    <span className={cn("tabular whitespace-nowrap", className)}>
      {from && <span className="font-normal text-muted">{i18n.t.price.fromWord} </span>}
      {i18n.locale === "ar" ? (
        <>
          {formatAmount(value)} {cur}
        </>
      ) : (
        <>
          {cur} {formatAmount(value)}
        </>
      )}
    </span>
  );
}
