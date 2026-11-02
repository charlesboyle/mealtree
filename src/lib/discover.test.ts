import { describe, expect, it } from "vitest";
import { item, restaurant, section } from "@/test/fixtures";
import { pickDishes } from "./discover";

const all = () => true;
const ids = (p: ReturnType<typeof pickDishes>) => p.map((x) => x.item.id);

describe("pickDishes", () => {
  it("round-robins across restaurants so one big menu cannot fill the row", () => {
    const a = restaurant("a", [section("s", [item({ id: "a1", name: "A1" }), item({ id: "a2", name: "A2" }), item({ id: "a3", name: "A3" })])]);
    const b = restaurant("b", [section("s", [item({ id: "b1", name: "B1" })])]);
    expect(ids(pickDishes([a, b], all))).toEqual(["a1", "b1", "a2", "a3"]);
    expect(ids(pickDishes([a, b], all, 2))).toEqual(["a1", "b1"]);
  });

  it("skips sold-out and unpriced dishes, but keeps dishes priced only via variants", () => {
    const a = restaurant("a", [
      section("s", [
        item({ id: "ok", name: "Ok" }),
        item({ id: "out", name: "Out", soldOut: true }),
        item({ id: "ask", name: "Ask", price: null }),
        item({ id: "var", name: "Var", price: null, variants: [{ label: "S", price: 9 }] }),
      ]),
    ]);
    expect(ids(pickDishes([a], all))).toEqual(["ok", "var"]);
  });

  it("puts dishes with a photo first within a restaurant", () => {
    const a = restaurant("a", [
      section("s", [item({ id: "plain", name: "Plain" }), item({ id: "pic", name: "Pic", image: "https://x/y.jpg" })]),
    ]);
    expect(ids(pickDishes([a], all))).toEqual(["pic", "plain"]);
  });

  it("applies the test predicate", () => {
    const a = restaurant("a", [section("s", [item({ id: "v", name: "V", tags: ["vegan"] }), item({ id: "m", name: "M" })])]);
    expect(ids(pickDishes([a], (i) => !!i.tags?.includes("vegan")))).toEqual(["v"]);
  });

  it("shows the same dish across restaurants once, ignoring case, brackets and punctuation", () => {
    const a = restaurant("a", [section("s", [item({ id: "a1", name: "Mango Sticky Rice (Large)" })])]);
    const b = restaurant("b", [section("s", [item({ id: "b1", name: "mango sticky rice" }), item({ id: "b2", name: "Karak" })])]);
    const picks = pickDishes([a, b], all);
    expect(ids(picks)).toEqual(["a1", "b2"]);
    expect(picks[0].restaurant.slug).toBe("a");
  });

  it("returns an empty list when there is nothing to pick", () => {
    expect(pickDishes([], all)).toEqual([]);
  });
});
