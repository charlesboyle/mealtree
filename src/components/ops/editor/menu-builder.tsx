"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { dietIcon } from "@/components/icons";
import { en } from "@/i18n/dictionaries/en";
import { formatPrice } from "@/i18n/format";
import { cn, slugify } from "@/lib/format";
import type { DietTag, Menu, MenuItem, MenuSection, Variant } from "@/lib/types";
import { Field, TextArea, TextInput } from "./fields";

const TAGS: DietTag[] = ["vegetarian", "vegan", "gluten-free", "spicy", "nuts"];

/** Stable ids matter: owner overrides (sold out, price) are keyed by item id. */
function newId(base: string, taken: Set<string>) {
  const root = slugify(base) || "item";
  let id = root;
  for (let n = 2; taken.has(id); n++) id = `${root}-${n}`;
  return id;
}

export function allItemIds(menus: Menu[]) {
  return new Set(menus.flatMap((m) => m.sections.flatMap((s) => s.items.map((i) => i.id))));
}

function move<T>(list: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** "Small 14, Large 16.50" ⇄ [{label, price}] */
export function variantsToText(v?: Variant[]) {
  return (v ?? []).map((x) => `${x.label} ${x.price}`).join(", ");
}
export function textToVariants(text: string): Variant[] | null {
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  const out: Variant[] = [];
  for (const p of parts) {
    const m = p.match(/^(.*?)[\s:]*\$?(\d+(?:\.\d{1,2})?)$/);
    if (!m || !m[1].trim()) return null;
    out.push({ label: m[1].trim(), price: Number(m[2]) });
  }
  return out;
}

export function MenuBuilder({ menus, onChange }: { menus: Menu[]; onChange: (m: Menu[]) => void }) {
  const [active, setActive] = useState(0);
  const menu = menus[Math.min(active, menus.length - 1)];

  const setMenu = (patch: Partial<Menu>) =>
    onChange(menus.map((m, i) => (i === active ? { ...m, ...patch } : m)));
  const setSections = (sections: MenuSection[]) => setMenu({ sections });

  const addMenu = () => {
    const ids = new Set(menus.map((m) => m.id));
    const name = menus.length ? "Drinks" : "Menu";
    onChange([...menus, { id: newId(name, ids), name, sections: [] }]);
    setActive(menus.length);
  };

  const addSection = () => {
    if (!menu) return;
    const ids = new Set(menu.sections.map((s) => s.id));
    setSections([...menu.sections, { id: newId("section", ids), name: "", items: [] }]);
  };

  if (!menu) {
    return (
      <div className="rounded-xl bg-surface-2/60 p-8 text-center">
        <p className="text-base text-ink-2">No menu yet. Read one from photos above, or start from scratch.</p>
        <button type="button" onClick={addMenu} className="pressable mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-bg">
          <Plus className="size-4" strokeWidth={2.4} /> Start a menu
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1">
        {menus.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              i === active ? "text-bg" : "text-ink-2 hover:text-ink",
            )}
          >
            {i === active && <motion.span layoutId="menu-tab" className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative">{m.name || "Untitled"}</span>
          </button>
        ))}
        <button type="button" onClick={addMenu} className="pressable flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-ink-3 hover:text-ink">
          <Plus className="size-3.5" strokeWidth={2.4} /> Menu
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Field label="Menu name">
          <TextInput value={menu.name} onChange={(e) => setMenu({ name: e.target.value })} placeholder="Menu, Lunch, Drinks…" />
        </Field>
        <Field label="Arabic name" hint="optional">
          <TextInput dir="rtl" lang="ar" value={menu.nameAr ?? ""} onChange={(e) => setMenu({ nameAr: e.target.value || undefined })} placeholder="الطعام، المشروبات…" />
        </Field>
        <Field label="Note" hint="optional">
          <TextInput value={menu.note ?? ""} onChange={(e) => setMenu({ note: e.target.value || undefined })} placeholder="Cash only" />
        </Field>
        {menus.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Delete the "${menu.name}" menu?`)) return;
              onChange(menus.filter((_, i) => i !== active));
              setActive(0);
            }}
            className="pressable h-11 rounded-xl px-3 text-sm font-medium text-danger hover:bg-danger/10"
          >
            Delete menu
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <AnimatePresence initial={false}>
          {menu.sections.map((s, si) => (
            <motion.div key={s.id} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionEditor
                section={s}
                menus={menus}
                first={si === 0}
                last={si === menu.sections.length - 1}
                onChange={(next) => setSections(menu.sections.map((x, i) => (i === si ? next : x)))}
                onMove={(d) => setSections(move(menu.sections, si, d))}
                onDelete={() => {
                  if (s.items.length && !confirm(`Delete "${s.name || "this section"}" and its ${s.items.length} dishes?`)) return;
                  setSections(menu.sections.filter((_, i) => i !== si));
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={addSection}
        className="pressable mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-line-strong text-sm font-medium text-ink-2 hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={2.4} /> Add section
      </button>
    </div>
  );
}

function SectionEditor({
  section,
  menus,
  first,
  last,
  onChange,
  onMove,
  onDelete,
}: {
  section: MenuSection;
  menus: Menu[];
  first: boolean;
  last: boolean;
  onChange: (s: MenuSection) => void;
  onMove: (d: number) => void;
  onDelete: () => void;
}) {
  const setItems = (items: MenuItem[]) => onChange({ ...section, items });
  const addItem = () => {
    const id = newId("new-dish", allItemIds(menus));
    setItems([...section.items, { id, name: "", price: null }]);
  };
  return (
    <div className="rounded-xl bg-surface-2/40 p-3 ring-1 ring-line sm:p-4">
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <TextInput
            value={section.name}
            onChange={(e) => onChange({ ...section, name: e.target.value })}
            placeholder="Section name (e.g. Tacos)"
            aria-label="Section name"
            invalid={!section.name.trim()}
            className="font-semibold"
          />
          <TextInput
            dir="rtl"
            lang="ar"
            value={section.nameAr ?? ""}
            onChange={(e) => onChange({ ...section, nameAr: e.target.value || undefined })}
            placeholder="اسم القسم (اختياري)"
            aria-label="Section name in Arabic"
          />
          <TextInput
            value={section.description ?? ""}
            onChange={(e) => onChange({ ...section, description: e.target.value || undefined })}
            placeholder="Section note (optional)"
            aria-label="Section note"
            className="sm:col-span-2"
          />
        </div>
        <Reorder first={first} last={last} onMove={onMove} onDelete={onDelete} label="section" />
      </div>
      <ul className="mt-3 space-y-1.5">
        {section.items.map((item, ii) => (
          <ItemEditor
            key={item.id}
            item={item}
            first={ii === 0}
            last={ii === section.items.length - 1}
            onChange={(next) => setItems(section.items.map((x, i) => (i === ii ? next : x)))}
            onMove={(d) => setItems(move(section.items, ii, d))}
            onDelete={() => setItems(section.items.filter((_, i) => i !== ii))}
          />
        ))}
      </ul>
      <button type="button" onClick={addItem} className="pressable mt-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand">
        <Plus className="size-3.5" strokeWidth={2.4} /> Add dish
      </button>
    </div>
  );
}

function ItemEditor({
  item,
  first,
  last,
  onChange,
  onMove,
  onDelete,
}: {
  item: MenuItem;
  first: boolean;
  last: boolean;
  onChange: (i: MenuItem) => void;
  onMove: (d: number) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(!item.name);
  const [variantText, setVariantText] = useState(variantsToText(item.variants));
  const [addOnText, setAddOnText] = useState(variantsToText(item.addOns));
  const [priceText, setPriceText] = useState(
    item.price === null ? "" : Number.isInteger(item.price) ? String(item.price) : item.price.toFixed(2),
  );
  const variantsBad = textToVariants(variantText) === null;
  const addOnsBad = textToVariants(addOnText) === null;
  const priceBad = priceText.trim() !== "" && !/^\d+(\.\d{1,2})?$/.test(priceText.trim());

  const toggleTag = (t: DietTag) => {
    const tags = item.tags ?? [];
    const next = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t];
    onChange({ ...item, tags: next.length ? next : undefined });
  };

  return (
    <li className="rounded-2xl bg-surface ring-1 ring-line">
      <div className="flex items-center gap-2 p-2 pl-3">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="Dish name"
          aria-label="Dish name"
          aria-invalid={!item.name.trim() || undefined}
          className="h-9 min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-ink-3 aria-[invalid=true]:placeholder:text-danger"
        />
        <input
          dir="rtl"
          lang="ar"
          value={item.nameAr ?? ""}
          onChange={(e) => onChange({ ...item, nameAr: e.target.value || undefined })}
          placeholder="الاسم بالعربية"
          aria-label="Dish name in Arabic"
          className="hidden h-9 w-40 min-w-0 bg-transparent text-base outline-none placeholder:text-ink-3 sm:block"
        />
        <label className={cn("flex h-9 w-[92px] shrink-0 items-center rounded-lg bg-surface-2/70 px-2.5 text-base", priceBad && "ring-2 ring-danger")}>
          <span className="text-xs text-ink-3">AED</span>
          <input
            value={priceText}
            inputMode="decimal"
            placeholder={item.variants?.length ? "from" : "—"}
            aria-label={`Price for ${item.name || "dish"}`}
            onChange={(e) => {
              const v = e.target.value;
              setPriceText(v);
              const n = Number(v.trim());
              if (v.trim() === "") onChange({ ...item, price: null, priceNote: item.priceNote ?? "Ask" });
              else if (/^\d+(\.\d{1,2})?$/.test(v.trim())) onChange({ ...item, price: n, priceNote: undefined });
            }}
            className="tabular h-full w-full min-w-0 bg-transparent pl-1 text-right font-medium outline-none placeholder:text-ink-3"
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Dish details"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="size-4" strokeWidth={2.2} />
          </motion.span>
        </button>
      </div>
      {!open && (item.description || item.tags?.length || item.variants?.length || item.popular) && (
        <p className="-mt-1 truncate px-3 pb-2.5 text-xs text-ink-3">
          {[
            item.popular && "Popular",
            item.variants?.map((v) => `${v.label} ${formatPrice(v.price, "en")}`).join(" / "),
            item.tags?.map((t) => en.diet[t]).join(", "),
            item.description,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-line p-3">
              <TextInput
                dir="rtl"
                lang="ar"
                value={item.nameAr ?? ""}
                onChange={(e) => onChange({ ...item, nameAr: e.target.value || undefined })}
                placeholder="الاسم بالعربية (اختياري)"
                aria-label="Dish name in Arabic"
                className="sm:hidden"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextArea
                  value={item.description ?? ""}
                  onChange={(e) => onChange({ ...item, description: e.target.value || undefined })}
                  placeholder="Description, as printed on the menu"
                  aria-label="Description"
                  rows={2}
                />
                <TextArea
                  dir="rtl"
                  lang="ar"
                  value={item.descriptionAr ?? ""}
                  onChange={(e) => onChange({ ...item, descriptionAr: e.target.value || undefined })}
                  placeholder="الوصف بالعربية (اختياري)"
                  aria-label="Description in Arabic"
                  rows={2}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sizes / options" hint="Small 14, Large 16" error={variantsBad ? "Use: Label 12, Label 15" : undefined}>
                  <TextInput
                    value={variantText}
                    invalid={variantsBad}
                    onChange={(e) => {
                      setVariantText(e.target.value);
                      const v = keepArabic(textToVariants(e.target.value), item.variants);
                      if (v) {
                        const variants = v.length > 1 ? v : undefined;
                        const price = variants ? Math.min(...variants.map((x) => x.price)) : item.price;
                        if (variants) setPriceText(String(price));
                        onChange({ ...item, variants, price });
                      }
                    }}
                  />
                </Field>
                <Field label="Add-ons" hint="Extra chashu 5" error={addOnsBad ? "Use: Label 3, Label 2" : undefined}>
                  <TextInput
                    value={addOnText}
                    invalid={addOnsBad}
                    onChange={(e) => {
                      setAddOnText(e.target.value);
                      const v = keepArabic(textToVariants(e.target.value), item.addOns);
                      if (v) onChange({ ...item, addOns: v.length ? v : undefined });
                    }}
                  />
                </Field>
              </div>
              {item.price === null && (
                <Field label="Price note" hint="shown instead of a price">
                  <TextInput value={item.priceNote ?? ""} onChange={(e) => onChange({ ...item, priceNote: e.target.value || undefined })} placeholder="Market price" />
                </Field>
              )}
              <Field label="Photo" hint="image URL, optional">
                <TextInput value={item.image ?? ""} onChange={(e) => onChange({ ...item, image: e.target.value.trim() || undefined })} placeholder="https://…" />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                <Chip on={!!item.popular} onClick={() => onChange({ ...item, popular: !item.popular || undefined })}>
                  <Sparkles className="size-3.5" strokeWidth={2.2} /> Popular
                </Chip>
                {TAGS.map((t) => {
                  const Icon = dietIcon[t];
                  return (
                    <Chip key={t} on={!!item.tags?.includes(t)} onClick={() => toggleTag(t)}>
                      <Icon className="size-3.5" strokeWidth={2.2} /> {en.diet[t]}
                    </Chip>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="truncate font-mono text-2xs text-ink-3">id: {item.id}</span>
                <Reorder first={first} last={last} onMove={onMove} onDelete={onDelete} label="dish" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "pressable flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
        on ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Reorder({
  first,
  last,
  onMove,
  onDelete,
  label,
}: {
  first: boolean;
  last: boolean;
  onMove: (d: number) => void;
  onDelete: () => void;
  label: string;
}) {
  const btn = "grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" className={btn} disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-4" strokeWidth={2.2} />
      </button>
      <button type="button" className={btn} disabled={last} onClick={() => onMove(1)} aria-label={`Move ${label} down`}>
        <ArrowDown className="size-4" strokeWidth={2.2} />
      </button>
      <button type="button" className={cn(btn, "hover:bg-danger/10 hover:text-danger")} onClick={onDelete} aria-label={`Delete ${label}`}>
        <Trash2 className="size-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

/** Options are edited as English text; carry over Arabic labels for options that kept their name. */
function keepArabic(next: Variant[] | null, prev?: Variant[]) {
  if (!next || !prev) return next;
  return next.map((v) => {
    const labelAr = prev.find((p) => p.label === v.label)?.labelAr;
    return labelAr ? { ...v, labelAr } : v;
  });
}
