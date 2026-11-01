"use client";

import type { ComponentProps } from "react";
import { MenuItemRow } from "./menu-item-row";
import { useI18n } from "@/i18n/client";
import type { MenuItem } from "@/lib/types";

type RowProps = Omit<ComponentProps<typeof MenuItemRow>, "item" | "qty">;

/** A titled list of dishes; two columns from `sm` up. */
export function MenuSection({
  id,
  title,
  description,
  items,
  qtyOf,
  ...row
}: RowProps & {
  id: string;
  title: string;
  description?: string;
  items: MenuItem[];
  qtyOf: (id: string) => number;
}) {
  const { t } = useI18n();
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
      <ul className="mt-1 sm:mt-3 sm:grid sm:grid-cols-2 sm:gap-3">
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} qty={qtyOf(item.id)} {...row} />
        ))}
      </ul>
    </section>
  );
}
