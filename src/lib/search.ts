import { dietLabel, itemMinPrice, normalize } from "./format";
import type { MenuItem, Restaurant } from "./types";

export type ParsedQuery = { tokens: string[]; maxPrice?: number };

const PRICE_RE = /(?:under|below|less than|<|max)\s*\$?\s*(\d+(?:\.\d+)?)/;

/** Understands free text plus budget phrases like "ramen under $20". */
export function parseQuery(raw: string): ParsedQuery {
  let text = normalize(raw.trim());
  let maxPrice: number | undefined;
  const m = text.match(PRICE_RE);
  if (m) {
    maxPrice = Number(m[1]);
    text = text.replace(m[0], " ");
  }
  const tokens = text.split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  return { tokens, maxPrice };
}

/**
 * Cravings people type that menus rarely spell out. Each key also matches
 * the listed words, so "noodles" finds ramen and pho.
 */
const SYNONYMS: Record<string, string[]> = {
  noodle: ["ramen", "pho", "tantanmen", "tsukemen", "udon", "soba", "japchae", "vermicelli", "pasta"],
  pasta: ["rigatoni", "pappardelle", "tonnarelli", "spaghetti", "cacio"],
  soup: ["ramen", "pho", "jjigae", "broth", "sambar"],
  coffee: ["latte", "cortado", "espresso", "drip", "phe", "affogato"],
  dessert: ["tiramisu", "affogato", "knafeh", "sweets", "dolci"],
  sweet: ["tiramisu", "affogato", "knafeh", "pancakes", "toast"],
  beer: ["lager", "sapporo", "cass", "draft"],
  wine: ["pinot", "gamay", "nat", "rose"],
  veggie: ["vegetarian", "vegan"],
  sandwich: ["banh", "bao", "burrito"],
  bbq: ["grill", "galbi", "samgyeopsal", "bulgogi"],
  brunch: ["breakfast", "pancakes", "toast", "scramble"],
};

/** Token plus its synonyms; plural "noodles" folds into "noodle". */
function expand(t: string) {
  const base = SYNONYMS[t] ? t : t.endsWith("s") && SYNONYMS[t.slice(0, -1)] ? t.slice(0, -1) : null;
  return base ? [t, ...SYNONYMS[base]] : [t];
}

function words(s: string) {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * 0 means no match. Every token must prefix a word somewhere; tokens that hit
 * the dish name weigh more so "pork" ranks "Lemongrass Pork" above a
 * description that mentions pork.
 */
export function scoreItem(item: MenuItem, sectionName: string, tokens: string[]) {
  if (!tokens.length) return 1;
  const nameWords = words(item.name);
  const nameFlat = normalize(item.name);
  const restWords = words(
    [item.description ?? "", sectionName, ...(item.tags ?? []).map((t) => dietLabel[t])].join(" "),
  );
  const sectionWords = words(sectionName);
  let score = 0;
  for (const t of tokens) {
    // Synonyms only count against names, not descriptions: "coffee" shouldn't
    // pull in a pizza because its mozzarella is "fior di latte".
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
  const nameWords = words(r.name);
  const rest = words([r.tagline, ...r.cuisine, r.neighborhood].join(" "));
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
  section: string;
  score: number;
};

export function searchDishes(list: Restaurant[], q: ParsedQuery, limit = 40): DishHit[] {
  if (!q.tokens.length && q.maxPrice === undefined) return [];
  const hits: DishHit[] = [];
  for (const restaurant of list) {
    for (const menu of restaurant.menus) {
      for (const section of menu.sections) {
        for (const item of section.items) {
          const min = itemMinPrice(item);
          if (q.maxPrice !== undefined && (min === null || min > q.maxPrice)) continue;
          const score = scoreItem(item, section.name, q.tokens);
          if (score > 0) hits.push({ restaurant, item, section: section.name, score });
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
