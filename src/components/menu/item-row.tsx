"use client";

import { Flame } from "lucide-react";
import { memo } from "react";
import { Photo } from "@/components/photo";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import type { DietTag, MenuItem } from "@/lib/types";
import { Highlight } from "./highlight";
import { PriceTag } from "./price-tag";

/** Diet tags as quiet words ("Vegan · GF"); spicy gets a small flame so it stands out. */
export function DietTags({ tags, long, className }: { tags?: DietTag[]; long?: boolean; className?: string }) {
  const { t } = useI18n();
  if (!tags?.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3", className)}>
      {tags.map((tag) => (
        <span key={tag} title={t.diet[tag]} className={cn("inline-flex items-center gap-0.5", tag === "spicy" && "text-danger")}>
          {tag === "spicy" && <Flame className="size-3" strokeWidth={2.2} aria-hidden />}
          {long ? t.diet[tag] : t.dietShort[tag]}
        </span>
      ))}
    </span>
  );
}

export const ItemRow = memo(function ItemRow({
  item,
  tokens,
  onOpen,
  currency,
}: {
  item: MenuItem;
  tokens: string[];
  onOpen: (item: MenuItem) => void;
  currency: string;
}) {
  const { t, pick } = useI18n();
  const variantCount = item.variants?.length ?? 0;
  const name = pick(item.name, item.nameAr);
  const description = item.description ? pick(item.description, item.descriptionAr) : undefined;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group -mx-2 flex w-[calc(100%+1rem)] items-start gap-4 rounded-lg px-2 py-4 text-start transition-colors duration-150 hover:bg-surface-2/60 active:bg-surface-2"
    >
      <div className={cn("min-w-0 flex-1", item.soldOut && "opacity-50")}>
        <h3 className="text-md font-medium text-ink">
          <Highlight text={name} tokens={tokens} />
        </h3>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">
            <Highlight text={description} tokens={tokens} />
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {item.soldOut ? (
            <span className="text-sm font-medium text-ink-2">{t.menu.soldOutToday}</span>
          ) : (
            <PriceTag item={item} currency={currency} className="text-base font-medium text-ink" />
          )}
          {item.popular && !item.soldOut && <span className="text-xs font-medium text-accent">{t.menu.popular}</span>}
          {variantCount > 1 && <span className="text-xs text-ink-3">{t.menu.options(variantCount)}</span>}
          <DietTags tags={item.tags} />
        </div>
      </div>
      {item.image && (
        <Photo
          id={item.image}
          alt={name}
          width={96}
          className={cn("size-22 shrink-0 rounded-lg", item.soldOut && "opacity-50 grayscale")}
        />
      )}
    </button>
  );
});
