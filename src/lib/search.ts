import { dictionaries } from "@/i18n/dictionaries";
import { itemMinPrice, normalize } from "./format";
import type { DietTag, MenuItem, MenuSection, Restaurant } from "./types";

export type ParsedQuery = { tokens: string[]; maxPrice?: number };

// Runs on normalized text (أ → ا, Arabic digits → 0-9), so "أقل من ١٥ درهم" matches too.
const CURRENCY = String.raw`(?:aed|dhs?|dirhams?|\$|درهم|دراهم|د\.?ا\.?)`;
const PRICE_RE = new RegExp(
  String.raw`(?:under|below|less than|cheaper than|max|<|تحت|باقل من|اقل من|ارخص من)\s*${CURRENCY}?\s*(\d+(?:\.\d+)?)\s*${CURRENCY}?`,
);
const CURRENCY_WORD = new RegExp(String.raw`(?:^|\s)${CURRENCY}(?=\s|$)`, "g");

/** Splits on anything that isn't a letter or digit, in any script. */
const SPLIT = /[^\p{L}\p{N}]+/u;

/** Free text plus budget phrases: "shawarma under 15", "برياني أقل من 30 درهم". */
export function parseQuery(raw: string): ParsedQuery {
  let text = normalize(raw.trim());
  let maxPrice: number | undefined;
  const m = text.match(PRICE_RE);
  if (m) {
    maxPrice = Number(m[1]);
    text = text.replace(m[0], " ");
  }
  text = text.replace(CURRENCY_WORD, " ");
  const tokens = text
    .split(SPLIT)
    .map(stripArticle)
    .filter((t) => t.length > 0);
  return { tokens, maxPrice };
}

/** "الشاورما" → "شاورما", so the Arabic article doesn't block prefix matches. */
function stripArticle(w: string) {
  return w.length > 3 && w.startsWith("ال") ? w.slice(2) : w;
}

/**
 * Cravings people type that menus rarely spell out, in both languages. Each key
 * also matches the listed words, so "rice" finds machboos and biryani.
 */
const RAW_SYNONYMS: Record<string, string[]> = {
  rice: ["machboos", "biryani", "pulao", "pilaf", "chelo", "tahdig", "don", "mandi", "kabuli"],
  bread: ["khubz", "naan", "porotta", "parotta", "chapati", "manakish", "manousheh", "regag", "taftoon"],
  coffee: ["latte", "flat", "cortado", "espresso", "v60", "filter", "gahwa", "cappuccino", "spanish"],
  tea: ["karak", "chai", "sulaimani", "shai"],
  dessert: ["luqaimat", "knafeh", "kunafa", "umm", "halwa", "bastani", "faloodeh", "payasam", "mochi", "basbousa", "firni"],
  sweet: ["luqaimat", "knafeh", "kunafa", "umm", "halwa", "bastani", "payasam", "cookie", "croissant"],
  kebab: ["kabab", "koobideh", "tikka", "shish", "kofta", "joojeh", "barg", "chapli"],
  grill: ["kebab", "kabab", "tikka", "shish", "taouk", "koobideh", "joojeh", "yakitori", "mixed"],
  bbq: ["kebab", "kabab", "tikka", "shish", "taouk", "yakitori"],
  wrap: ["shawarma", "falafel", "saj", "roll", "sandwich"],
  sandwich: ["shawarma", "falafel", "saj", "roll", "wrap", "toastie"],
  chicken: ["taouk", "joojeh", "dajaj", "tikka"],
  lamb: ["laham", "ouzi", "mutton", "chapli", "mandi"],
  fish: ["hammour", "sherri", "samak", "sashimi", "sushi", "meen"],
  seafood: ["hammour", "sherri", "prawn", "shrimp", "sushi", "fish"],
  noodle: ["ramen", "udon", "soba"],
  soup: ["ramen", "harees", "shorba", "lentil", "miso", "sambar", "aash"],
  breakfast: ["balaleet", "eggs", "shakshuka", "chabab", "foul", "manakish", "appam", "puttu"],
  juice: ["avocado", "cocktail", "mango", "lemon", "orange", "pomegranate"],
  veggie: ["vegetarian", "vegan"],
  // Arabic cravings (normalized below: ة → ه, أ → ا …).
  حلويات: ["لقيمات", "كنافة", "ام علي", "بسبوسة", "حلوى", "بستني", "فالوده", "موتشي"],
  حلا: ["لقيمات", "كنافة", "ام علي", "بسبوسة"],
  قهوة: ["لاتيه", "فلات", "كورتادو", "اسبريسو", "كابتشينو", "قهوة", "سبانش"],
  شاي: ["كرك", "سليماني", "شاي", "جاي"],
  رز: ["مجبوس", "برياني", "بلاو", "تشلو", "ته ديك", "مندي"],
  ارز: ["مجبوس", "برياني", "بلاو", "تشلو", "ته ديك", "مندي"],
  خبز: ["خبز", "مناقيش", "منقوشة", "نان", "بروتا", "رقاق", "تافتون"],
  مشاوي: ["كباب", "تكة", "شيش", "طاووق", "كوبيده", "جوجه", "مشكل"],
  دجاج: ["طاووق", "جوجه", "تكة", "دجاج"],
  لحم: ["لحم", "كباب", "كوبيده", "مندي", "شلو"],
  سمك: ["هامور", "شعري", "سمك", "ساشيمي", "سوشي"],
  فطور: ["بلاليط", "بيض", "شكشوكة", "جباب", "فول", "مناقيش"],
  عصير: ["افوكادو", "كوكتيل", "مانجو", "ليمون", "برتقال", "رمان"],
  ساندويش: ["شاورما", "فلافل", "صاج", "رول"],
};

const SYNONYMS: Record<string, string[]> = Object.fromEntries(
  Object.entries(RAW_SYNONYMS).map(([k, v]) => [normalize(k), v.flatMap((w) => words(w))]),
);

/** Token plus its synonyms; plural "kebabs" folds into "kebab". */
function expand(t: string) {
  const base = SYNONYMS[t] ? t : t.endsWith("s") && SYNONYMS[t.slice(0, -1)] ? t.slice(0, -1) : null;
  return base ? [t, ...SYNONYMS[base]] : [t];
}

function words(s: string) {
  const out: string[] = [];
  for (const w of normalize(s).split(SPLIT)) {
    if (!w) continue;
    out.push(w);
    const bare = stripArticle(w);
    if (bare !== w) out.push(bare);
  }
  return out;
}

const dietWords = (tags: DietTag[] = []) =>
  tags.flatMap((t) => [dictionaries.en.diet[t], dictionaries.ar.diet[t]]).join(" ");

/** Both languages of a section's name, for matching. */
export function sectionText(s: Pick<MenuSection, "name" | "nameAr">) {
  return `${s.name} ${s.nameAr ?? ""}`;
}

/**
 * 0 means no match. Every token must prefix a word somewhere, in English or
 * Arabic; tokens that hit the dish name weigh more, so "chicken" ranks
 * "Chicken Machboos" above a description that mentions chicken.
 */
export function scoreItem(item: MenuItem, section: string, tokens: string[]) {
  if (!tokens.length) return 1;
  const nameText = `${item.name} ${item.nameAr ?? ""}`;
  const nameWords = words(nameText);
  const nameFlat = normalize(nameText);
  const restWords = words([item.description, item.descriptionAr, section, dietWords(item.tags)].join(" "));
  const sectionWords = words(section);
  let score = 0;
  for (const t of tokens) {
    // Synonyms only count against names, not descriptions: "tea" shouldn't
    // pull in a dish just because it's served with a glass of karak.
    const alts = expand(t);
    if (nameWords.some((w) => w.startsWith(t)) || (t.length > 2 && nameFlat.includes(t))) score += 3;
    else if (alts.some((a) => nameWords.some((w) => w.startsWith(a)))) score += 2;
    else if (restWords.some((w) => w.startsWith(t)) || alts.some((a) => sectionWords.some((w) => w.startsWith(a))))
      score += 1;
    else return 0;
  }
  if (item.popular) score += 0.5;
  if (item.soldOut) score -= 1;
  return score;
}

export function scoreRestaurant(r: Restaurant, tokens: string[]) {
  if (!tokens.length) return 1;
  const nameWords = words(`${r.name} ${r.nameAr ?? ""}`);
  const cuisines = r.cuisine.map((c) => `${c} ${dictionaries.ar.cuisines[c] ?? ""}`);
  const rest = words([r.tagline, r.taglineAr, ...cuisines, r.neighborhood, r.neighborhoodAr].join(" "));
  let score = 0;
  for (const t of tokens) {
    if (nameWords.some((w) => w.startsWith(t))) score += 3;
    else if (rest.some((w) => w.startsWith(t))) score += 1.5;
    else return 0;
  }
  return score;
}

export type DishHit = {
  restaurant: Restaurant;
  item: MenuItem;
  section: MenuSection;
  score: number;
};

export function searchDishes(list: Restaurant[], q: ParsedQuery, limit = 40): DishHit[] {
  if (!q.tokens.length && q.maxPrice === undefined) return [];
  const hits: DishHit[] = [];
  for (const restaurant of list) {
    for (const menu of restaurant.menus) {
      for (const section of menu.sections) {
        const text = sectionText(section);
        for (const item of section.items) {
          const min = itemMinPrice(item);
          if (q.maxPrice !== undefined && (min === null || min > q.maxPrice)) continue;
          const score = scoreItem(item, text, q.tokens);
          if (score > 0) hits.push({ restaurant, item, section, score });
        }
      }
    }
  }
  return hits
    .sort((a, b) => b.score - a.score || (itemMinPrice(a.item) ?? 0) - (itemMinPrice(b.item) ?? 0))
    .slice(0, limit);
}

export function countItems(r: Restaurant) {
  return r.menus.reduce((n, m) => n + m.sections.reduce((k, s) => k + s.items.length, 0), 0);
}

export function countPhotos(r: Restaurant) {
  return r.menus.reduce(
    (n, m) => n + m.sections.reduce((k, s) => k + s.items.filter((i) => i.image).length, 0),
    0,
  );
}
