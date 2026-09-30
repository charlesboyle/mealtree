"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { saveRestaurant } from "@/app/ops/actions";
import type { ExtractResult } from "@/app/ops/extract-action";
import { linkIcon } from "@/components/icons";
import { Photo } from "@/components/photo";
import { useToast } from "@/components/providers";
import { Switch } from "@/components/ui";
import { accentStyle } from "@/lib/accent";
import { en } from "@/i18n/dictionaries/en";
import { cn, normalizePhone, slugify, sourceLabel } from "@/lib/format";
import { dayNames, parseRanges, rangesToText } from "@/lib/hours";
import type { RestaurantInput } from "@/lib/supabase/database";
import type { ExternalLink as Link_, Hours, LinkKind, Menu, MenuSource } from "@/lib/types";
import { Field, Section, Segmented, TextInput, inputClass } from "./fields";
import { MenuBuilder, allItemIds } from "./menu-builder";
import { PhotoImport } from "./photo-import";

const WEEK: (keyof Hours)[] = [1, 2, 3, 4, 5, 6, 0];
const LINK_KINDS: { kind: LinkKind; label: string }[] = [
  { kind: "reserve", label: "Reservations" },
  { kind: "order", label: "Online ordering" },
  { kind: "instagram", label: "Instagram" },
  { kind: "website", label: "Website" },
  { kind: "whatsapp", label: "WhatsApp" },
  { kind: "phone", label: "Extra phone" },
  { kind: "maps", label: "Google Maps link" },
];

type Errors = Partial<Record<"name" | "slug" | "address" | "phone" | "neighborhood" | "hours" | "menu" | "links", string>>;

function validate(d: RestaurantInput, hoursText: Record<number, string>): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Required";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) e.slug = "Lowercase letters, numbers, dashes";
  if (!d.address.trim()) e.address = "Required";
  if (!d.phone.trim()) e.phone = "Required";
  if (!d.neighborhood.trim()) e.neighborhood = "Required";
  if (WEEK.some((day) => parseRanges(hoursText[day]) === null)) e.hours = "Check the highlighted days";
  const items = d.menus.flatMap((m) => m.sections.flatMap((s) => s.items));
  if (!items.length) e.menu = "Add at least one dish";
  else if (items.some((i) => !i.name.trim()) || d.menus.some((m) => m.sections.some((s) => !s.name.trim())))
    e.menu = "Every section and dish needs a name";
  if (d.links.some((l) => !(l.kind === "phone" ? /^tel:\+?\d+$/ : /^https?:\/\/\S+$/).test(l.url)))
    e.links = "Links must start with https:// (extra phones: tel:+971…)";
  return e;
}

export function RestaurantEditor({ initial, isNew }: { initial: RestaurantInput; isNew: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [d, setD] = useState<RestaurantInput>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [cuisineText, setCuisineText] = useState(initial.cuisine.join(", "));
  const [hoursText, setHoursText] = useState<Record<number, string>>(() =>
    Object.fromEntries(WEEK.map((day) => [day, rangesToText(initial.hours[day])])),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const set = <K extends keyof RestaurantInput>(k: K, v: RestaurantInput[K]) => setD((cur) => ({ ...cur, [k]: v }));
  const errors = useMemo(() => validate(d, hoursText), [d, hoursText]);
  const shown = showErrors ? errors : {};
  const style = useMemo(() => accentStyle(d.accent), [d.accent]);
  // Ids already saved stay fixed (owner edits key on them); new dishes get ids from their names.
  const persistedIds = useRef(allItemIds(initial.menus));
  const itemCount = d.menus.reduce((n, m) => n + m.sections.reduce((k, s) => k + s.items.length, 0), 0);

  const applyExtraction = (r: Extract<ExtractResult, { ok: true }>) => {
    setD((cur) => {
      const name = cur.name || r.restaurant.name;
      return {
        ...cur,
        menus: r.menus,
        name,
        name_ar: cur.name_ar || r.restaurant.nameAr || null,
        slug: slugTouched ? cur.slug : slugify(name),
        phone: cur.phone || (r.restaurant.phone ? normalizePhone(r.restaurant.phone) : ""),
        address: cur.address || r.restaurant.address,
        cuisine: cur.cuisine.length ? cur.cuisine : r.restaurant.cuisine,
        hours: r.restaurant.hours && WEEK.every((day) => !cur.hours[day].length) ? r.restaurant.hours : cur.hours,
        source: "photos" as MenuSource,
        verified_at: new Date().toISOString().slice(0, 10),
      };
    });
    if (!cuisineText && r.restaurant.cuisine.length) setCuisineText(r.restaurant.cuisine.join(", "));
    if (r.restaurant.hours && WEEK.every((day) => !d.hours[day].length)) {
      const h = r.restaurant.hours;
      setHoursText(Object.fromEntries(WEEK.map((day) => [day, rangesToText(h[day])])));
    }
    toast(`Read ${r.menus.reduce((n, m) => n + m.sections.reduce((k, s) => k + s.items.length, 0), 0)} dishes`);
  };

  const save = (publish?: boolean) => {
    setShowErrors(true);
    setSaveError(null);
    if (Object.keys(errors).length) {
      toast("Fix the highlighted fields first");
      return;
    }
    const hours = Object.fromEntries(WEEK.map((day) => [day, parseRanges(hoursText[day])!])) as Hours;
    const payload: RestaurantInput = {
      ...d,
      menus: finalizeIds(d.menus, persistedIds.current),
      name: d.name.trim(),
      phone: normalizePhone(d.phone),
      cuisine: cuisineText.split(",").map((c) => c.trim()).filter(Boolean),
      hours,
      published: publish ?? d.published,
    };
    startSave(async () => {
      const res = await saveRestaurant(payload, isNew ? undefined : initial.slug);
      if (!res.ok) {
        setSaveError(res.error);
        return;
      }
      setD(payload);
      persistedIds.current = allItemIds(payload.menus);
      toast(payload.published ? "Saved · live now" : "Saved as hidden draft");
      if (isNew) router.replace(`/ops/edit/${res.slug}`);
      else router.refresh();
    });
  };

  return (
    <div data-accent style={style} className="min-h-dvh bg-bg pb-28">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-5">
          <Link href="/ops" aria-label="Back to ops" className="pressable -ml-2 grid size-10 place-items-center rounded-full hover:bg-surface-2">
            <ArrowLeft className="size-5" strokeWidth={2.2} />
          </Link>
          <p className="min-w-0 flex-1 truncate text-base font-semibold">{isNew ? "New restaurant" : d.name || "Edit restaurant"}</p>
          {!isNew && d.published && (
            <Link href={`/r/${initial.slug}`} target="_blank" className="pressable flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-2 hover:bg-surface-2">
              View <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-5 pt-6">
        <Section title="Read from photos" description="Claude reads the dishes, prices, and options. You review everything before it goes live.">
          <PhotoImport onResult={applyExtraction} hasMenu={itemCount > 0} />
        </Section>

        <Section title="Restaurant">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={shown.name}>
              <TextInput
                value={d.name}
                invalid={!!shown.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setD((cur) => ({ ...cur, name, slug: slugTouched ? cur.slug : slugify(name) }));
                }}
                placeholder="Qasr Al Shawarma"
              />
            </Field>
            <Field label="Arabic name" hint="as on the sign, optional">
              <TextInput dir="rtl" lang="ar" value={d.name_ar ?? ""} onChange={(e) => set("name_ar", e.target.value || null)} placeholder="قصر الشاورما" />
            </Field>
            <Field label="Link" hint={isNew ? "can't change after publishing" : "fixed"} error={shown.slug}>
              <div className={cn(inputClass, "flex items-center gap-0.5 p-0 pl-3.5", !isNew && "opacity-60")}>
                <span className="text-ink-3">/r/</span>
                <input
                  value={d.slug}
                  disabled={!isNew}
                  aria-label="Slug"
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent pr-3 outline-none"
                />
              </div>
            </Field>
            <Field label="Tagline">
              <TextInput value={d.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Charcoal shawarma and fresh juices, open until 3." />
            </Field>
            <Field label="Arabic tagline" hint="optional">
              <TextInput dir="rtl" lang="ar" value={d.tagline_ar ?? ""} onChange={(e) => set("tagline_ar", e.target.value || null)} placeholder="شاورما على الفحم وعصائر طازجة" />
            </Field>
            <Field label="Cuisine" hint="comma separated">
              <TextInput value={cuisineText} onChange={(e) => setCuisineText(e.target.value)} placeholder="Shawarma, Arabic" />
            </Field>
            <Field label="Price level">
              <Segmented
                label="Price level"
                value={d.price_level}
                onChange={(v) => set("price_level", v)}
                options={[1, 2, 3, 4].map((n) => ({ value: n, label: en.price.levels[n - 1] }))}
              />
            </Field>
            <Field label="Address" error={shown.address}>
              <TextInput value={d.address} invalid={!!shown.address} onChange={(e) => set("address", e.target.value)} placeholder="2nd December St, Al Satwa, Dubai" />
            </Field>
            <Field label="Arabic address" hint="optional">
              <TextInput dir="rtl" lang="ar" value={d.address_ar ?? ""} onChange={(e) => set("address_ar", e.target.value || null)} placeholder="شارع 2 ديسمبر، السطوة، دبي" />
            </Field>
            <Field label="Neighborhood" error={shown.neighborhood}>
              <TextInput value={d.neighborhood} invalid={!!shown.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Al Satwa" />
            </Field>
            <Field label="Arabic neighborhood" hint="optional">
              <TextInput dir="rtl" lang="ar" value={d.neighborhood_ar ?? ""} onChange={(e) => set("neighborhood_ar", e.target.value || null)} placeholder="السطوة" />
            </Field>
            <Field label="Phone" error={shown.phone} hint="the number on Google">
              <TextInput value={d.phone} invalid={!!shown.phone} inputMode="tel" onChange={(e) => set("phone", e.target.value)} placeholder="04 344 9872" />
            </Field>
            <Field label="Cover photo" hint="image URL" className="sm:col-span-2">
              <div className="flex gap-3">
                <Photo id={d.cover ?? undefined} alt="" width={96} className="size-11 shrink-0 rounded-xl" />
                <TextInput value={d.cover ?? ""} onChange={(e) => set("cover", e.target.value.trim() || null)} placeholder="https://…" />
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Hours" description='One line per day, like "11:30-15:00, 17:00-22:00", "5pm-10pm", or "Closed".'>
          <div className="grid gap-2">
            {WEEK.map((day) => {
              const bad = showErrors && parseRanges(hoursText[day]) === null;
              return (
                <label key={day} className="grid grid-cols-[88px_1fr] items-center gap-3">
                  <span className="text-sm font-medium text-ink-2">{dayNames[day]}</span>
                  <TextInput value={hoursText[day]} invalid={bad} onChange={(e) => setHoursText((h) => ({ ...h, [day]: e.target.value }))} />
                </label>
              );
            })}
            {shown.hours && <p className="text-xs text-danger">{shown.hours}</p>}
          </div>
        </Section>

        <Section
          title="Links"
          description="Shown as buttons on the menu page. The first one is highlighted."
          action={
            <button
              type="button"
              onClick={() => set("links", [...d.links, { kind: "order", label: "Order pickup", url: "" }])}
              className="pressable flex h-9 shrink-0 items-center gap-1 rounded-full bg-surface-2 px-3 text-sm font-medium"
            >
              <Plus className="size-3.5" strokeWidth={2.4} /> Link
            </button>
          }
        >
          {d.links.length === 0 && <p className="text-sm text-ink-3">No links yet. Call and Directions are always shown.</p>}
          <ul className="space-y-2">
            {d.links.map((l, i) => {
              const Icon = linkIcon[l.kind];
              const update = (patch: Partial<Link_>) => set("links", d.links.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <li key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:grid-cols-[180px_1fr_1.4fr_auto]">
                  <label className={cn(inputClass, "flex items-center gap-2 pl-3")}>
                    <Icon className="size-4 shrink-0 text-ink-3" strokeWidth={2} />
                    <select value={l.kind} onChange={(e) => update({ kind: e.target.value as LinkKind })} className="h-full min-w-0 flex-1 bg-transparent outline-none" aria-label="Link type">
                      {LINK_KINDS.map((k) => (
                        <option key={k.kind} value={k.kind}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextInput value={l.label} onChange={(e) => update({ label: e.target.value })} placeholder="Button label" aria-label="Button label" className="hidden sm:block" />
                  <TextInput
                    value={l.url}
                    invalid={showErrors && !(l.kind === "phone" ? /^tel:\+?\d+$/ : /^https?:\/\/\S+$/).test(l.url)}
                    onChange={(e) => update({ url: e.target.value.trim() })}
                    placeholder={l.kind === "phone" ? "tel:+971…" : "https://…"}
                    aria-label="URL"
                  />
                  <button type="button" onClick={() => set("links", d.links.filter((_, j) => j !== i))} aria-label="Remove link" className="grid size-10 place-items-center rounded-lg text-ink-3 hover:bg-danger/10 hover:text-danger">
                    <Trash2 className="size-4" strokeWidth={2.2} />
                  </button>
                </li>
              );
            })}
          </ul>
          {shown.links && <p className="mt-2 text-xs text-danger">{shown.links}</p>}
        </Section>

        <Section
          title="Menu"
          description={`${itemCount} dish${itemCount === 1 ? "" : "es"}. Changing a dish's name keeps its id, so owner edits and share links still work.`}
        >
          <MenuBuilder menus={d.menus} onChange={(menus: Menu[]) => set("menus", menus)} />
          {shown.menu && <p className="mt-3 text-xs text-danger">{shown.menu}</p>}
        </Section>

        <Section title="Source & status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Where this menu came from">
              <select value={d.source} onChange={(e) => set("source", e.target.value as MenuSource)} className={inputClass}>
                {(Object.keys(sourceLabel) as MenuSource[]).map((s) => (
                  <option key={s} value={s}>
                    {sourceLabel[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Last verified">
              <TextInput type="date" value={d.verified_at} onChange={(e) => set("verified_at", e.target.value)} />
            </Field>
            <Toggle
              label="Google listing has a menu link"
              hint="Turn on once the Google Business Profile links here."
              checked={d.google_menu_link}
              onChange={(v) => set("google_menu_link", v)}
            />
            <Toggle
              label="Published"
              hint="Hidden pages don't appear anywhere and their links return 404."
              checked={d.published}
              onChange={(v) => set("published", v)}
            />
          </div>
        </Section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
          <AnimatePresence mode="wait">
            <motion.p
              key={saveError ?? (Object.keys(shown).length ? "err" : "ok")}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn("min-w-0 flex-1 truncate text-sm", saveError || Object.keys(shown).length ? "text-danger" : "text-ink-3")}
            >
              {saveError ?? (Object.keys(shown).length ? `${Object.keys(shown).length} field(s) need attention` : d.published ? "Live after saving" : "Hidden until you publish")}
            </motion.p>
          </AnimatePresence>
          {!d.published && (
            <button
              type="button"
              disabled={saving}
              onClick={() => save(false)}
              className="pressable h-11 rounded-full bg-surface-2 px-4 text-base font-semibold disabled:opacity-50"
            >
              Save draft
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="pressable flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-base font-semibold text-bg disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {d.published ? "Save" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function finalizeIds(menus: Menu[], persisted: Set<string>): Menu[] {
  const taken = new Set(persisted);
  return menus.map((m) => ({
    ...m,
    sections: m.sections.map((sec) => ({
      ...sec,
      items: sec.items.map((item) => {
        if (persisted.has(item.id)) return item;
        const root = slugify(item.name) || "dish";
        let id = root;
        for (let n = 2; taken.has(id); n++) id = `${root}-${n}`;
        taken.add(id);
        return { ...item, id };
      }),
    })),
  }));
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-surface-2/50 p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium">{label}</p>
        <p className="mt-0.5 text-xs leading-snug text-ink-3">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
