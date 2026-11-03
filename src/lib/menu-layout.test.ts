import { describe, expect, it } from "vitest";
import { autoLayout, sectionLayout } from "./menu-layout";

/** `photos` dishes with an image followed by `bare` without. */
const dishes = (photos: number, bare: number) => [
  ...Array.from({ length: photos }, () => ({ image: "a.jpg" })),
  ...Array.from({ length: bare }, () => ({})),
];

describe("autoLayout", () => {
  it("switches to a grid at exactly 60% photos", () => {
    expect(autoLayout(dishes(3, 2))).toBe("grid");
    expect(autoLayout(dishes(6, 4))).toBe("grid");
  });

  it("stays a list just under 60%", () => {
    expect(autoLayout(dishes(5, 4))).toBe("list"); // 55%
    expect(autoLayout(dishes(59, 41))).toBe("list");
  });

  it("needs at least two photos, however large the share", () => {
    expect(autoLayout(dishes(1, 0))).toBe("list");
    expect(autoLayout(dishes(2, 0))).toBe("grid");
    expect(autoLayout(dishes(2, 1))).toBe("grid"); // 67%
    expect(autoLayout(dishes(2, 2))).toBe("list"); // 50%
  });

  it("handles all, none and empty sections", () => {
    expect(autoLayout(dishes(8, 0))).toBe("grid");
    expect(autoLayout(dishes(0, 8))).toBe("list");
    expect(autoLayout([])).toBe("list");
  });

  it("ignores empty image strings", () => {
    expect(autoLayout([{ image: "" }, { image: "" }, { image: "" }])).toBe("list");
  });
});

describe("sectionLayout", () => {
  const mostly = dishes(4, 1);
  const few = dishes(1, 5);
  const none = dishes(0, 3);

  it("follows the auto rule without an override", () => {
    expect(sectionLayout(mostly, null, false)).toBe("grid");
    expect(sectionLayout(few, null, false)).toBe("list");
  });

  it('"list" makes every section a list', () => {
    expect(sectionLayout(mostly, "list", false)).toBe("list");
  });

  it('"grid" makes any section with a photo a grid, but not one without', () => {
    expect(sectionLayout(few, "grid", false)).toBe("grid");
    expect(sectionLayout(dishes(1, 0), "grid", false)).toBe("grid");
    expect(sectionLayout(none, "grid", false)).toBe("list");
  });

  it("is always a list while searching", () => {
    expect(sectionLayout(mostly, null, true)).toBe("list");
    expect(sectionLayout(mostly, "grid", true)).toBe("list");
  });
});
