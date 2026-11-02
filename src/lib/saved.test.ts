import { describe, expect, it } from "vitest";
import { countSaved } from "./saved";

describe("countSaved", () => {
  it("counts only slugs that still exist", () => {
    expect(countSaved(["a", "b", "gone"], ["a", "b", "c"])).toBe(2);
  });

  it("is zero when every saved venue was removed", () => {
    expect(countSaved(["gone"], ["a"])).toBe(0);
    expect(countSaved([], ["a"])).toBe(0);
  });
});
