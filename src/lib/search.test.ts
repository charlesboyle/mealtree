import { describe, expect, it } from "vitest";
import { item, restaurant, section } from "@/test/fixtures";
import { parseQuery, scoreItem, searchDishes } from "./search";

const names = (q: string, list = [r()]) => searchDishes(list, parseQuery(q)).map((h) => h.item.id);

function r() {
  return restaurant("r", [
    section("Mains", [
      item({ id: "shw", name: "Chicken Shawarma", nameAr: "شاورما دجاج", price: 12 }),
      item({ id: "shw2", name: "Beef Shawarma Plate", price: 28 }),
      item({ id: "bry", name: "Chicken Biryani", nameAr: "برياني دجاج", price: 25 }),
      item({ id: "mch", name: "Lamb Machboos", nameAr: "مجبوس لحم", price: 40 }),
      item({ id: "kun", name: "Knafeh", nameAr: "كنافة", price: 18 }),
      item({ id: "tax", name: "Tax Item", description: "served with a glass of karak", price: null }),
    ]),
  ]);
}

describe("parseQuery", () => {
  it("extracts budget phrases in English", () => {
    expect(parseQuery("shawarma under 15")).toEqual({ tokens: ["shawarma"], maxPrice: 15 });
    expect(parseQuery("under aed 20")).toEqual({ tokens: [], maxPrice: 20 });
    expect(parseQuery("pizza below 30 dhs").maxPrice).toBe(30);
  });

  it("extracts budget phrases in Arabic, including Arabic-Indic digits", () => {
    expect(parseQuery("برياني أقل من 30 درهم")).toEqual({ tokens: ["برياني"], maxPrice: 30 });
    expect(parseQuery("شاورما اقل من ١٥ درهم")).toEqual({ tokens: ["شاورما"], maxPrice: 15 });
  });

  it("has no price cap without a budget phrase", () => {
    expect(parseQuery("karak").maxPrice).toBeUndefined();
  });

  it("strips the Arabic article from tokens", () => {
    expect(parseQuery("الشاورما").tokens).toEqual(["شاورما"]);
  });
});

describe("searchDishes", () => {
  it("matches English prefixes case-insensitively", () => {
    expect(names("SHAW")).toEqual(expect.arrayContaining(["shw", "shw2"]));
    expect(names("shawarma")).not.toContain("bry");
  });

  it("matches Arabic names, with or without the article", () => {
    expect(names("شاورما")).toContain("shw");
    expect(names("الشاورما")).toContain("shw");
  });

  it("folds Arabic letter variants and diacritics", () => {
    expect(names("كنافه")).toContain("kun"); // ة / ه
    expect(names("كُنَافَة")).toContain("kun"); // diacritics
    expect(names("اشاورما")).toEqual([]);
    expect(searchDishes([restaurant("x", [section("s", [item({ id: "a", name: "x", nameAr: "أرز" })])])], parseQuery("ارز")))
      .toHaveLength(1); // أ / ا
  });

  it("applies the price cap and drops unpriced dishes when capped", () => {
    expect(names("shawarma under 15")).toEqual(["shw"]);
    expect(names("under 20")).toEqual(expect.arrayContaining(["shw", "kun"]));
    expect(names("under 20")).not.toContain("tax");
    expect(names("برياني أقل من 30 درهم")).toEqual(["bry"]);
  });

  it("expands craving synonyms against dish names", () => {
    const ids = names("rice");
    expect(ids).toEqual(expect.arrayContaining(["bry", "mch"]));
    expect(ids).not.toContain("shw");
    expect(names("رز")).toEqual(expect.arrayContaining(["bry", "mch"]));
    expect(names("dessert")).toContain("kun");
  });

  it("does not use synonyms against descriptions", () => {
    expect(names("tea")).not.toContain("tax");
  });

  it("returns nothing for an empty query and ranks name hits first", () => {
    expect(names("")).toEqual([]);
    const list = [
      restaurant("a", [
        section("s", [
          item({ id: "desc", name: "Platter", description: "with chicken" }),
          item({ id: "name", name: "Chicken Rice" }),
        ]),
      ]),
    ];
    expect(names("chicken", list)[0]).toBe("name");
  });
});

describe("scoreItem", () => {
  it("is 0 unless every token matches", () => {
    const i = item({ id: "a", name: "Chicken Biryani" });
    expect(scoreItem(i, "Mains", ["chicken", "biryani"])).toBeGreaterThan(0);
    expect(scoreItem(i, "Mains", ["chicken", "pizza"])).toBe(0);
  });

  it("ranks sold-out dishes lower than available ones", () => {
    const a = item({ id: "a", name: "Chicken" });
    const b = item({ id: "b", name: "Chicken", soldOut: true });
    expect(scoreItem(b, "s", ["chicken"])).toBeLessThan(scoreItem(a, "s", ["chicken"]));
  });
});
