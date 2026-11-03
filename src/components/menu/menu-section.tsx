"use client";

import type { ComponentProps } from "react";
import { MenuItemCard } from "./menu-item-card";
import { MenuItemRow } from "./menu-item-row";
import { useI18n } from "@/i18n/client";
import type { MenuLayout } from "@/lib/menu-layout";
import type { MenuItem } from "@/lib/types";

type RowProps = Omit<ComponentProps<typeof MenuItemRow>, "item" | "qty">;

/** A titled list of dishes (two columns from `sm` up), or a grid of photo cards. */
export function MenuSection({
  id,
  title,
  description,
  note,
  items,
  layout,
  qtyOf,
  ...row
}: RowProps & {
  id: string;
  title: string;
  description?: string;
  /** A small muted line under the title, e.g. that the photos are illustrative. */
  note?: string;
  items: MenuItem[];
  layout: MenuLayout;
  qtyOf: (id: string) => number;
}) {
  const { t } = useI18n();
  // Cards carry no description, so nothing in them is highlighted.
  const { tokens, ...card } = row;
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28 pt-8">
      <div className="flex items-baseline gap-2">
        <h2 id={`${id}-h`} className="text-[15px] font-semibold tracking-tight text-ink sm:text-base">
          {title}
        </h2>
        <span className="text-[11.5px] text-muted" aria-label={t.menu.results(items.length)}>
          {items.length}
        </span>
      </div>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
      {layout === "grid" ? (
        // 4 columns only from `xl`: with the side nav, `lg` leaves the menu about 700px.
        <ul data-layout="grid" className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} qty={qtyOf(item.id)} {...card} />
          ))}
        </ul>
      ) : (
        <ul data-layout="list" className="mt-1 sm:mt-3 sm:grid sm:grid-cols-2 sm:gap-3">
          {items.map((item) => (
            <MenuItemRow key={item.id} item={item} qty={qtyOf(item.id)} tokens={tokens} {...card} />
          ))}
        </ul>
      )}
    </section>
  );
}
