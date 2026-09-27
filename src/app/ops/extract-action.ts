"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/server";
import type { DietTag, Hours, Menu, MenuItem } from "@/lib/types";

const MAX_PHOTOS = 8;
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const Priced = z.object({
  label: z.string(),
  label_ar: z.string().describe("Arabic label if printed, else empty string"),
  price: z.number(),
});
const AR = "Arabic text exactly as printed on the menu, or empty string if the menu has none. Never translate.";

const Extraction = z.object({
  restaurant: z.object({
    name: z.string().describe("Restaurant name in Latin script as printed, or empty string"),
    name_ar: z.string().describe(AR),
    cuisine: z.array(z.string()).describe("1-3 short English cuisine labels, e.g. Lebanese, Shawarma, Emirati"),
    phone: z.string().describe("Phone number as printed, or empty string"),
    address: z.string().describe("Street address as printed, or empty string"),
    hours: z
      .array(
        z.object({
          day: z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]),
          open: z.string().describe("24h HH:MM"),
          close: z.string().describe("24h HH:MM; after midnight stays e.g. 01:30"),
        }),
      )
      .describe("Opening hours printed on the menu; empty if none are shown"),
  }),
  menus: z.array(
    z.object({
      name: z.string().describe('e.g. "Menu", "Breakfast", "Drinks"'),
      name_ar: z.string().describe(AR),
      note: z.string().describe("Menu-wide note such as 'Cash only', or empty string"),
      sections: z.array(
        z.object({
          name: z.string(),
          name_ar: z.string().describe(AR),
          description: z.string().describe("Section note as printed, or empty string"),
          items: z.array(
            z.object({
              name: z.string().describe("English / Latin-script name as printed"),
              name_ar: z.string().describe(AR),
              description: z.string().describe("English description as printed; empty string if none. Never invent one."),
              description_ar: z.string().describe(AR),
              price: z.number().nullable().describe("Base price as a number; null if not shown or market price"),
              price_note: z.string().describe('e.g. "Market price"; empty string otherwise'),
              variants: z.array(Priced).describe("Sizes or options with their own prices"),
              add_ons: z.array(Priced).describe("Optional extras with an added price"),
              tags: z
                .array(z.enum(["vegetarian", "vegan", "gluten-free", "spicy", "nuts"]))
                .describe("Only when the menu marks it (symbol, legend, or wording)"),
            }),
          ),
        }),
      ),
    }),
  ),
  warnings: z.array(z.string()).describe("Anything unreadable, cut off, or ambiguous that a human should check"),
});

const SYSTEM = `You transcribe restaurant menus from photos into structured data for a public menu page.

Accuracy matters more than completeness: diners will see these prices.
- Menus are from the UAE and are often bilingual. Put English (or Latin-script) text in name/description and the Arabic text printed alongside it in name_ar/description_ar. Copy both exactly as printed; never translate between them. If a dish is printed only in Arabic, give a short Latin transliteration as its name and add a warning.
- Copy dish names, descriptions, and prices exactly as printed. Do not invent or embellish.
- Prices are in AED (dirhams, "Dhs", "د.إ"). Give plain numbers without currency symbols; read Arabic-Indic digits (١٢) as normal numbers. "Market price" or a missing price means price null with a price_note.
- Sizes or options with their own prices (Small/Large, Glass/Bottle, Half/Whole) go in variants; the base price is the cheapest.
- Priced extras ("add chicken +3") go in add_ons.
- Only add dietary tags the menu itself marks. Don't infer vegan from ingredients.
- Keep the menu's section order. Use separate menus only when the photos clearly show separate menus (e.g. lunch vs. drinks).
- Several photos may overlap or show the same page twice; list each dish once.
- If something is blurry, cut off, or you're unsure of a price, still include your best reading and add a warning naming the dish.`;

export type ExtractResult =
  | {
      ok: true;
      menus: Menu[];
      restaurant: { name: string; nameAr?: string; cuisine: string[]; phone: string; address: string; hours: Hours | null };
      warnings: string[];
    }
  | { ok: false; error: string };

function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "item"
  );
}

function uniqueId(base: string, used: Set<string>) {
  let id = slugify(base);
  for (let n = 2; used.has(id); n++) id = `${slugify(base)}-${n}`;
  used.add(id);
  return id;
}

const DAY: Record<string, keyof Hours> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function toHours(rows: z.infer<typeof Extraction>["restaurant"]["hours"]): Hours | null {
  const valid = rows.filter((r) => HHMM.test(r.open) && HHMM.test(r.close));
  if (!valid.length) return null;
  const hours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } as Hours;
  for (const r of valid) hours[DAY[r.day]].push([r.open, r.close]);
  return hours;
}

function toMenus(data: z.infer<typeof Extraction>): Menu[] {
  const ids = new Set<string>();
  const menuIds = new Set<string>();
  return data.menus
    .map((m) => {
      const sectionIds = new Set<string>();
      return {
        id: uniqueId(m.name || "menu", menuIds),
        name: m.name || "Menu",
        nameAr: m.name_ar.trim() || undefined,
        note: m.note || undefined,
        sections: m.sections
          .filter((s) => s.items.length)
          .map((s) => ({
            id: uniqueId(s.name || "section", sectionIds),
            name: s.name || "Menu",
            nameAr: s.name_ar.trim() || undefined,
            description: s.description || undefined,
            items: s.items.map((i): MenuItem => {
              const priced = (list: z.infer<typeof Priced>[]) =>
                list.map((v) => ({ label: v.label, labelAr: v.label_ar.trim() || undefined, price: v.price }));
              const variants = priced(i.variants.filter((v) => v.price > 0));
              const base = i.price ?? (variants.length ? Math.min(...variants.map((v) => v.price)) : null);
              return {
                id: uniqueId(i.name, ids),
                name: i.name.trim(),
                nameAr: i.name_ar.trim() || undefined,
                description: i.description.trim() || undefined,
                descriptionAr: i.description_ar.trim() || undefined,
                price: base,
                priceNote: base === null ? i.price_note || "Ask" : i.price_note || undefined,
                variants: variants.length > 1 ? variants : undefined,
                addOns: i.add_ons.length ? priced(i.add_ons) : undefined,
                tags: i.tags.length ? ([...new Set(i.tags)] as DietTag[]) : undefined,
              };
            }),
          })),
      };
    })
    .filter((m) => m.sections.length);
}

/** Reads menu photos with Claude and returns a draft for human review. */
export async function extractMenu(form: FormData): Promise<ExtractResult> {
  await requireAdmin();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY isn't set on this deployment, so menu reading is off." };
  }

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, error: "Add at least one menu photo." };
  if (files.length > MAX_PHOTOS) return { ok: false, error: `Up to ${MAX_PHOTOS} photos at a time.` };

  const images: Anthropic.Beta.BetaImageBlockParam[] = [];
  for (const f of files) {
    if (!MEDIA_TYPES.includes(f.type as MediaType)) {
      return { ok: false, error: `${f.name} isn't a JPEG, PNG, WebP, or GIF.` };
    }
    images.push({
      type: "image",
      source: { type: "base64", media_type: f.type as MediaType, data: Buffer.from(await f.arrayBuffer()).toString("base64") },
    });
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      // Transcription, not open-ended reasoning: medium keeps latency within
      // a serverless request while staying accurate.
      output_config: { effort: "medium", format: betaZodOutputFormat(Extraction) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...images,
            {
              type: "text",
              text: `Transcribe the menu in ${images.length === 1 ? "this photo" : `these ${images.length} photos`}.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "Claude declined to read these photos. Try clearer photos of just the menu." };
    }
    if (response.stop_reason === "max_tokens") {
      return { ok: false, error: "This menu is too long to read in one go. Try fewer photos at a time." };
    }
    const data = response.parsed_output;
    if (!data) return { ok: false, error: "Couldn't read a menu from these photos. Try sharper, well-lit photos." };

    const menus = toMenus(data);
    if (!menus.length) return { ok: false, error: "No dishes found. Make sure the photos show the menu itself." };
    return {
      ok: true,
      menus,
      restaurant: {
        name: data.restaurant.name.trim(),
        nameAr: data.restaurant.name_ar.trim() || undefined,
        cuisine: data.restaurant.cuisine.filter(Boolean).slice(0, 3),
        phone: data.restaurant.phone.trim(),
        address: data.restaurant.address.trim(),
        hours: toHours(data.restaurant.hours),
      },
      warnings: data.warnings,
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { ok: false, error: "The Anthropic API key was rejected." };
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: "Rate limited by the Anthropic API. Try again in a minute." };
    if (error instanceof Anthropic.BadRequestError) return { ok: false, error: `Request rejected: ${error.message}` };
    if (error instanceof Anthropic.APIConnectionError) return { ok: false, error: "Couldn't reach the Anthropic API." };
    if (error instanceof Anthropic.APIError) return { ok: false, error: `Anthropic API error ${error.status}.` };
    // Most likely the reply didn't validate against the schema.
    console.error("Menu extraction failed", error);
    return { ok: false, error: "Couldn't turn the photos into a menu. Try again, or with fewer photos." };
  }
}
