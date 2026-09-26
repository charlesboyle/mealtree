"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/components/providers";
import { Card, CardTitle, Switch } from "@/components/ui";
import { cn, formatPrice } from "@/lib/format";
import { parseQuery, scoreItem } from "@/lib/search";
import { menuActions, type Overrides, useOverrides } from "@/lib/store";
import type { MenuItem, Restaurant } from "@/lib/types";

export function MenuEditor({ restaurant: r, canEdit }: { restaurant: Restaurant; canEdit: boolean }) {
  const overrides = useOverrides(r.slug);
  const [query, setQuery] = useState("");
  const toast = useToast();

  const sections = useMemo(() => {
    const { tokens } = parseQuery(query);
    return r.menus.flatMap((m) =>
      m.sections
        .map((s) => ({
          key: `${m.id}:${s.id}`,
          name: r.menus.length > 1 ? `${m.name} · ${s.name}` : s.name,
          items: s.items.filter((i) => scoreItem(i, s.name, tokens) > 0),
        }))
        .filter((s) => s.items.length),
    );
  }, [r.menus, query]);

  const edits = Object.keys(overrides.soldOut).length + Object.keys(overrides.price).length;

  return (
    <Card flush>
      <div className="p-5 pb-3">
        <CardTitle
          action={
            canEdit &&
            edits > 0 && (
              <button
                onClick={() =>
                  menuActions
                    .reset(r.slug)
                    .then(() => toast("Menu reset to original"))
                    .catch((e: Error) => toast(e.message))
                }
                className="text-[12.5px] font-medium text-ink-3 hover:text-ink"
              >
                Reset {edits} {edits === 1 ? "edit" : "edits"}
              </button>
            )
          }
        >
          Menu
        </CardTitle>
        <label className="flex h-10 items-center gap-2 rounded-xl bg-surface-2 px-3 focus-within:ring-2 focus-within:ring-accent">
          <Search className="size-4 text-ink-3" strokeWidth={2.2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a dish"
            aria-label="Find a dish"
            className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
          />
        </label>
      </div>
      <div className="px-5 pb-3">
        {sections.map((s) => (
          <div key={s.key} className="pt-3">
            <h3 className="py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">{s.name}</h3>
            <ul className="divide-y divide-line">
              {s.items.map((item) => (
                <EditorRow key={item.id} slug={r.slug} item={item} overrides={overrides} canEdit={canEdit} />
              ))}
            </ul>
          </div>
        ))}
        {sections.length === 0 && <p className="py-8 text-center text-[14px] text-ink-3">No dishes match.</p>}
      </div>
    </Card>
  );
}

function EditorRow({
  slug,
  item,
  overrides,
  canEdit,
}: {
  slug: string;
  item: MenuItem;
  overrides: Overrides;
  canEdit: boolean;
}) {
  const toast = useToast();
  const soldOut = overrides.soldOut[item.id] ?? !!item.soldOut;
  const price = overrides.price[item.id] ?? item.price;
  const edited = item.id in overrides.price || item.id in overrides.soldOut;
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = Number(draft.replace(/[^0-9.]/g, ""));
    setDraft(null);
    if (!draft.trim() || !Number.isFinite(n) || n <= 0 || n === price) return;
    const rounded = Math.round(n * 100) / 100;
    menuActions
      .setPrice(slug, item.id, rounded)
      .then(() => toast(`${item.name} is now ${formatPrice(rounded)}`))
      .catch((e: Error) => toast(e.message));
  };

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[14.5px] font-medium transition-colors", soldOut ? "text-ink-3" : "text-ink")}>
          {item.name}
        </p>
        <AnimatePresence initial={false}>
          {(soldOut || edited) && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-[12px]"
            >
              {soldOut ? (
                <span className="font-medium text-warning">Shown as sold out on your menu</span>
              ) : (
                <span className="text-ink-3">Edited · live on your menu</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {price !== null && (
        <label
          className={cn(
            "flex h-9 w-[84px] items-center rounded-xl bg-surface-2 px-2.5 text-[14px] ring-1 ring-transparent transition-shadow focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent has-[:disabled]:opacity-50",
            edited && item.id in overrides.price && "ring-accent-line",
          )}
        >
          <span className="text-ink-3">$</span>
          <input
            value={draft ?? (Number.isInteger(price) ? String(price) : price.toFixed(2))}
            onFocus={(e) => {
              setDraft(e.target.value);
              requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(null);
                e.currentTarget.blur();
              }
            }}
            inputMode="decimal"
            disabled={!canEdit}
            aria-label={`Price for ${item.name}`}
            className="tabular h-full w-full min-w-0 bg-transparent pl-1 text-right font-medium outline-none"
          />
        </label>
      )}
      <Switch
        checked={!soldOut}
        disabled={!canEdit}
        label={`${item.name} available`}
        onChange={(available) =>
          menuActions
            .setSoldOut(slug, item.id, !available)
            .then(() => toast(available ? `${item.name} is back on` : `${item.name} marked sold out`))
            .catch((e: Error) => toast(e.message))
        }
      />
    </li>
  );
}
