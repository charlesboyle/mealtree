"use client";

import { Sparkles } from "lucide-react";
import { memo } from "react";
import { dietIcon } from "@/components/icons";
import { Photo } from "@/components/photo";
import { cn, dietLabel, dietShort, itemPriceLabel } from "@/lib/format";
import type { DietTag, MenuItem } from "@/lib/types";
import { Highlight } from "./highlight";

export function DietPill({ tag, withLabel }: { tag: DietTag; withLabel?: boolean }) {
  const Icon = dietIcon[tag];
  return (
    <span
      title={dietLabel[tag]}
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-[11px] font-medium leading-none",
        withLabel ? "bg-surface-2 px-2.5 py-1.5 text-ink-2" : "text-ink-3",
        tag === "spicy" && "text-danger",
      )}
    >
      <Icon className="size-3" strokeWidth={2.2} aria-hidden />
      {withLabel ? dietLabel[tag] : dietShort[tag]}
    </span>
  );
}

export const ItemRow = memo(function ItemRow({
  item,
  tokens,
  onOpen,
}: {
  item: MenuItem;
  tokens: string[];
  onOpen: (item: MenuItem) => void;
}) {
  const variantCount = item.variants?.length ?? 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-4 rounded-2xl px-3 py-4 text-left transition-colors duration-200 hover:bg-surface active:bg-surface-2",
        item.soldOut && "opacity-55",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[15.5px] font-medium leading-snug tracking-[-0.01em] text-ink">
            <Highlight text={item.name} tokens={tokens} />
          </h3>
          {item.popular && !item.soldOut && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-accent">
              <Sparkles className="size-2.5" strokeWidth={2.5} aria-hidden />
              Popular
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.45] text-ink-2">
            <Highlight text={item.description} tokens={tokens} />
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {item.soldOut ? (
            <span className="text-[13px] font-semibold text-ink-3">Sold out today</span>
          ) : (
            <span className="tabular text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
              {itemPriceLabel(item)}
            </span>
          )}
          {variantCount > 1 && <span className="text-[12px] text-ink-3">{variantCount} options</span>}
          {item.tags?.map((t) => <DietPill key={t} tag={t} />)}
        </div>
      </div>
      {item.image && (
        <Photo
          id={item.image}
          alt={item.name}
          width={112}
          className="size-[92px] shrink-0 rounded-[18px] ring-1 ring-line transition-transform duration-500 ease-out-expo group-hover:scale-[1.02]"
        />
      )}
    </button>
  );
});
