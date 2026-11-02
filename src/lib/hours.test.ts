import { describe, expect, it } from "vitest";
import { emptyHours } from "@/test/fixtures";
import { hasHours, openStatus, parseRanges } from "./hours";

// 2026-11-02 is a Monday. Dubai is UTC+4 with no DST.
const dubai = (day: number, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  // Monday Nov 2 + (day-1) days, local Dubai time -> UTC
  return new Date(Date.UTC(2026, 10, 2 + (day - 1), h - 4, m));
};
const TZ = "Asia/Dubai";

describe("openStatus", () => {
  const daily = () => {
    const h = emptyHours();
    for (let d = 0; d < 7; d++) h[d as 0] = [["09:00", "17:00"]];
    return h;
  };

  it("is open within a span and reports when it closes", () => {
    const s = openStatus(daily(), TZ, dubai(1, "12:00"));
    expect(s).toMatchObject({ open: true, soon: false, until: "17:00" });
  });

  it("flags closing soon within 45 minutes", () => {
    expect(openStatus(daily(), TZ, dubai(1, "16:30"))).toMatchObject({ open: true, soon: true });
  });

  it("is closed outside the span and reports the next opening", () => {
    expect(openStatus(daily(), TZ, dubai(1, "07:00"))).toMatchObject({ open: false, next: { offset: 0, time: "09:00" } });
    expect(openStatus(daily(), TZ, dubai(1, "18:00"))).toMatchObject({ open: false, next: { offset: 1, day: 2, time: "09:00" } });
  });

  it("handles overnight hours on both sides of midnight", () => {
    const h = emptyHours();
    h[1] = [["18:00", "02:00"]]; // Monday evening to Tuesday 2 AM
    expect(openStatus(h, TZ, dubai(1, "23:00"))).toMatchObject({ open: true, until: "02:00" });
    expect(openStatus(h, TZ, dubai(2, "01:00"))).toMatchObject({ open: true, soon: false, until: "02:00" });
    expect(openStatus(h, TZ, dubai(2, "01:30"))).toMatchObject({ open: true, soon: true });
    expect(openStatus(h, TZ, dubai(2, "03:00"))).toMatchObject({ open: false });
  });

  it("treats 00:00-00:00 as open all day", () => {
    const h = emptyHours();
    h[1] = [["00:00", "00:00"]];
    expect(openStatus(h, TZ, dubai(1, "13:00"))).toMatchObject({ open: true, allDay: true });
  });

  it("is closed with no next opening when there are no hours", () => {
    expect(openStatus(emptyHours(), TZ, dubai(1, "12:00"))).toEqual({ open: false, soon: false, next: null });
  });

  it("finds an opening later in the week", () => {
    const h = emptyHours();
    h[5] = [["10:00", "22:00"]]; // Friday only
    expect(openStatus(h, TZ, dubai(1, "12:00"))).toMatchObject({ open: false, next: { offset: 4, day: 5, time: "10:00" } });
  });
});

describe("hasHours / parseRanges", () => {
  it("detects whether any hours exist", () => {
    expect(hasHours(emptyHours())).toBe(false);
    const h = emptyHours();
    h[3] = [["09:00", "10:00"]];
    expect(hasHours(h)).toBe(true);
  });

  it("parses typed ranges", () => {
    expect(parseRanges("11:30-15:00, 5pm-10:30pm")).toEqual([["11:30", "15:00"], ["17:00", "22:30"]]);
    expect(parseRanges("closed")).toEqual([]);
    expect(parseRanges("nonsense")).toBeNull();
  });
});
