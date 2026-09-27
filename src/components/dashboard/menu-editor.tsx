"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/components/providers";
import { Card, CardTitle, Switch } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { cn, toLatinDigits } from "@/lib/format";
import { parseQuery, scoreItem, sectionText } from "@/lib/search";
import { actionErrorMessage, menuActions, type Overrides, useOverrides } from "@/lib/store";
import type { MenuItem, Restaurant } from "@/lib/types";

export function MenuEditor({ restaurant: r, canEdit }: { restaurant: Restaurant; canEdit: boolean }) {
  const { t, pick } = useI18n();
  const overrides = useOverrides(r.slug);
  const [query, setQuery] = useState("");
  const toast = useToast();

  const sections = useMemo(() => {
    const { tokens } = parseQuery(query);
    return r.menus.flatMap((m) =>
      m.sections
        .map((s) => ({
          key: `${m.id}:${s.id}`,
          name: r.menus.length > 1 ? `${pick(m.name, m.nameAr)} · ${pick(s.name, s.nameAr)}` : pick(s.name, s.nameAr),
          items: s.items.filter((i) => scoreItem(i, sectionText(s), tokens) > 0),
        }))
        .filter((s) => s.items.length),
    );
  }, [r.menus, query, pick]);

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
                    .then(() => toast(t.dashboard.resetDone))
                    .catch((e) => toast(actionErrorMessage(e, t)))
                }
                className="text-sm font-medium text-ink-3 hover:text-ink"
              >
                {t.dashboard.reset(edits)}
              </button>
            )
          }
        >
          {t.dashboard.menu}
        </CardTitle>
        <label className="flex h-10 items-center gap-2 rounded-lg bg-surface-2 px-3 focus-within:ring-2 focus-within:ring-accent">
          <Search className="size-4 text-ink-3" strokeWidth={2.2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.dashboard.findDish}
            aria-label={t.dashboard.findDish}
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
          />
        </label>
      </div>
      <div className="px-5 pb-3">
        {sections.map((s) => (
          <div key={s.key} className="pt-3">
            <h3 className="py-1 text-sm font-semibold text-ink-2">{s.name}</h3>
            <ul className="divide-y divide-line">
              {s.items.map((item) => (
                <EditorRow key={item.id} slug={r.slug} item={item} overrides={overrides} canEdit={canEdit} currency={r.currency} />
              ))}
            </ul>
          </div>
        ))}
        {sections.length === 0 && <p className="py-8 text-center text-sm text-ink-3">{t.dashboard.noDishes}</p>}
      </div>
    </Card>
  );
}

function EditorRow({
  slug,
  item,
  overrides,
  canEdit,
  currency,
}: {
  slug: string;
  item: MenuItem;
  overrides: Overrides;
  canEdit: boolean;
  currency: string;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const name = i18n.pick(item.name, item.nameAr);
  const toast = useToast();
  const soldOut = overrides.soldOut[item.id] ?? !!item.soldOut;
  const price = overrides.price[item.id] ?? item.price;
  const edited = item.id in overrides.price || item.id in overrides.soldOut;
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = Number(toLatinDigits(draft).replace("٫", ".").replace(/[^0-9.]/g, ""));
    setDraft(null);
    if (!draft.trim() || !Number.isFinite(n) || n <= 0 || n === price) return;
    const rounded = Math.round(n * 100) / 100;
    menuActions
      .setPrice(slug, item.id, rounded)
      .then(() => toast(t.dashboard.priceSet(name, i18n.price(rounded, currency))))
      .catch((e) => toast(actionErrorMessage(e, t)));
  };

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-base font-medium transition-colors", soldOut ? "text-ink-3" : "text-ink")}>
          {name}
        </p>
        <AnimatePresence initial={false}>
          {(soldOut || edited) && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-xs"
            >
              {soldOut ? (
                <span className="font-medium text-warning">{t.dashboard.soldOutShown}</span>
              ) : (
                <span className="text-ink-3">{t.dashboard.editedLive}</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {price !== null && (
        <label
          className={cn(
            "flex h-9 w-24 items-center gap-1 rounded-lg bg-surface-2 px-2.5 text-sm ring-1 ring-transparent transition-shadow focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent has-[:disabled]:opacity-50",
            edited && item.id in overrides.price && "ring-accent-line",
          )}
        >
          <span className="text-xs text-ink-3">{i18n.currency(currency)}</span>
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
            aria-label={t.dashboard.priceFor(name)}
            dir="ltr"
            className="tabular h-full w-full min-w-0 bg-transparent text-end font-medium outline-none"
          />
        </label>
      )}
      <Switch
        checked={!soldOut}
        disabled={!canEdit}
        label={t.dashboard.available(name)}
        onChange={(available) =>
          menuActions
            .setSoldOut(slug, item.id, !available)
            .then(() => toast(available ? t.dashboard.backOn(name) : t.dashboard.markedSoldOut(name)))
            .catch((e) => toast(actionErrorMessage(e, t)))
        }
      />
    </li>
  );
}
