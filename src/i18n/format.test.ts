import { describe, expect, it } from "vitest";
import { formatAmount, formatPhone, formatPrice, formatRanges, formatTime, maskPhone } from "./format";

describe("formatPrice", () => {
  it("puts AED before the number in English and the dirham sign after it in Arabic", () => {
    expect(formatPrice(25, "en")).toBe("AED 25");
    expect(formatPrice(25, "ar")).toBe("25 د.إ");
  });

  it("shows whole dirhams plain and fractions with two decimals", () => {
    expect(formatAmount(12.5)).toBe("12.50");
    expect(formatAmount(12)).toBe("12");
    expect(formatPrice(1234.5, "en")).toBe("AED 1,234.50");
  });

  it("falls back to the raw currency code for unknown currencies", () => {
    expect(formatPrice(5, "en", "USD")).toBe("USD 5");
  });
});

describe("formatTime / formatRanges", () => {
  it("uses 12-hour time and drops :00", () => {
    expect(formatTime("19:00", "en")).toBe("7 PM");
    expect(formatTime("11:30", "en")).toBe("11:30 AM");
    expect(formatTime("00:00", "en")).toBe("12 AM");
    expect(formatTime("12:00", "en")).toBe("12 PM");
    expect(formatTime("19:00", "ar")).toBe("7 م");
    expect(formatTime("11:30", "ar")).toBe("11:30 ص");
  });

  it("joins ranges and recognises 24 hours and closed", () => {
    expect(formatRanges([["09:00", "17:00"]], "en")).toBe("9 AM – 5 PM");
    expect(formatRanges([["00:00", "00:00"]], "en")).not.toContain("12 AM");
    expect(formatRanges([], "en")).toMatch(/closed/i);
  });
});

describe("formatPhone / maskPhone", () => {
  it("formats UAE landlines and mobiles", () => {
    expect(formatPhone("+97143217788")).toBe("+971 4 321 7788");
    expect(formatPhone("+971501234567")).toBe("+971 50 123 4567");
  });

  it("leaves other numbers untouched", () => {
    expect(formatPhone("+442071234567")).toBe("+442071234567");
    expect(formatPhone("12345")).toBe("12345");
  });

  it("masks all but the last four digits", () => {
    expect(maskPhone("+971501234567")).toBe("+971 50 ••• 4567");
  });
});
