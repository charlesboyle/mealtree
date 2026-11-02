import { describe, expect, it } from "vitest";
import { restaurant } from "@/test/fixtures";
import type { Restaurant } from "@/lib/types";
import { whatsappNumber } from "./bag";

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
