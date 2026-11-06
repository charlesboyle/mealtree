import { describe, expect, it } from "vitest";
import { restaurant } from "@/test/fixtures";
import type { Restaurant } from "@/lib/types";
import { makeI18n } from "@/i18n";
import { item } from "@/test/fixtures";
import { orderMessage, whatsappNumber, type ResolvedLine } from "./bag";

const wa = (phone: string, links: Restaurant["links"] = []) =>
  whatsappNumber(restaurant("r", [], { phone, links }));

describe("whatsappNumber", () => {
  it("prefers an explicit whatsapp link, even over a mobile phone", () => {
    expect(wa("+971501234567", [{ kind: "whatsapp", label: "WhatsApp", url: "https://wa.me/971552223344" }])).toBe("971552223344");
    expect(wa("+97143217788", [{ kind: "whatsapp", label: "WhatsApp", url: "https://api.whatsapp.com/send?phone=971552223344" }])).toBe("971552223344");
  });

  it("uses a mobile main phone", () => {
    expect(wa("+971501234567")).toBe("971501234567");
  });

  it("never uses a landline", () => {
    expect(wa("+97143217788")).toBeNull();
    for (const area of [2, 3, 4, 6, 7, 9]) expect(wa(`+971${area}3217788`)).toBeNull();
  });

  it("falls back to a mobile in an extra phone link when the main phone is a landline", () => {
    const links = [{ kind: "phone" as const, label: "Mobile", url: "tel:+971559876543" }];
    expect(wa("+97143217788", links)).toBe("971559876543");
  });

  it("takes the first mobile in order: main phone, then extra links", () => {
    const links = [
      { kind: "phone" as const, label: "Landline", url: "tel:+97126543210" },
      { kind: "phone" as const, label: "Mobile", url: "tel:0559876543" },
    ];
    expect(wa("+97143217788", links)).toBe("971559876543");
    expect(wa("+971501234567", links)).toBe("971501234567");
  });

  it("never uses 800 or 600 numbers", () => {
    expect(wa("800 1234")).toBeNull();
    expect(wa("800123456")).toBeNull();
    expect(wa("600 5 12345")).toBeNull();
    expect(wa("600512345")).toBeNull();
  });

  it("reads formatted and local mobile numbers", () => {
    expect(wa("+971 50 123 4567")).toBe("971501234567");
    expect(wa("050 123 4567")).toBe("971501234567");
    expect(wa("00971501234567")).toBe("971501234567");
  });

  it("is null without any phone", () => {
    expect(wa("")).toBeNull();
  });
});

describe("orderMessage", () => {
  const r = restaurant("tea-spot", [], { name: "Tea Spot", nameAr: "تي سبوت" });
  const line = (over: Partial<ResolvedLine> = {}): ResolvedLine => ({
    key: "a",
    item: item({ id: "a", name: "Oreo Milkshake", nameAr: "ميلك شيك أوريو" }),
    qty: 2,
    unit: 12,
    selections: {},
    choices: [],
    ...over,
  });

  it("is compact English on the English page: bullets, bold total, no blank lines", () => {
    const msg = orderMessage(r, [line()], makeI18n("en"));
    expect(msg.split("\n")).toEqual([
      "Hi Tea Spot, I'd like to order:",
      expect.stringMatching(/^- 2 × Oreo Milkshake — AED/),
      expect.stringMatching(/^\*Menu total: AED .*\*$/),
      "via nomm.ae",
    ]);
    expect(msg).not.toContain("\n\n");
    expect(msg).not.toMatch(/[\u0600-\u06FF]/);
  });

  it("is Arabic on the Arabic page, falling back to the English name when there is no Arabic", () => {
    const msg = orderMessage(r, [line(), line({ item: item({ id: "b", name: "Tea" }) })], makeI18n("ar"));
    const lines = msg.split("\n");
    expect(lines[0]).toContain("تي سبوت");
    expect(lines[1]).toContain("ميلك شيك أوريو");
    expect(lines[2]).toMatch(/^- .* Tea /);
    expect(msg).not.toContain("Pickup");
  });

  it("puts choices in brackets on the dish line", () => {
    const l = line({ choices: [{ id: "x", label: "Large", labelAr: "كبير", price: 0 }, { id: "y", label: "Extra shot", price: 0 }] });
    expect(orderMessage(r, [l], makeI18n("en")).split("\n")[1]).toMatch(/^- 2 × Oreo Milkshake \(Large, Extra shot\) — AED/);
    expect(orderMessage(r, [l], makeI18n("ar")).split("\n")[1]).toContain("(كبير, Extra shot)");
  });
});
