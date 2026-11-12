import { describe, expect, it } from "vitest";
import { restaurant } from "@/test/fixtures";
import { boundsOf, COVERAGE_KM, distanceKm, inBox, isOutsideCoverage, isPinned, nearestKm, orderByView, projectToBox, sortByDistance } from "./map";

const abuDhabi = { lat: 24.4539, lng: 54.3773 };
const dubai = { lat: 25.2048, lng: 55.2708 };
const reem = { lat: 24.4973, lng: 54.4028 };

describe("distanceKm", () => {
  it("is zero for the same point and symmetric", () => {
    expect(distanceKm(abuDhabi, abuDhabi)).toBe(0);
    expect(distanceKm(abuDhabi, dubai)).toBeCloseTo(distanceKm(dubai, abuDhabi), 9);
  });

  it("matches the known road-free distance between Abu Dhabi and Dubai (about 120 km)", () => {
    expect(distanceKm(abuDhabi, dubai)).toBeGreaterThan(115);
    expect(distanceKm(abuDhabi, dubai)).toBeLessThan(125);
  });

  it("measures a city hop in single-digit kilometres", () => {
    expect(distanceKm(abuDhabi, reem)).toBeGreaterThan(4);
    expect(distanceKm(abuDhabi, reem)).toBeLessThan(7);
  });
});

describe("boundsOf", () => {
  it("returns south-west and north-east corners as [lng, lat]", () => {
    expect(boundsOf([abuDhabi, dubai, reem])).toEqual([
      [54.3773, 24.4539],
      [55.2708, 25.2048],
    ]);
  });

  it("is a single point for one pin and null for none", () => {
    expect(boundsOf([reem])).toEqual([
      [54.4028, 24.4973],
      [54.4028, 24.4973],
    ]);
    expect(boundsOf([])).toBeNull();
  });
});

describe("coverage", () => {
  it("finds the nearest pin", () => {
    expect(nearestKm(abuDhabi, [dubai, reem])).toBeCloseTo(distanceKm(abuDhabi, reem), 9);
    expect(nearestKm(abuDhabi, [])).toBeNull();
  });

  it("is inside when some pin is within 60 km and outside when none is", () => {
    expect(isOutsideCoverage(abuDhabi, [reem, dubai])).toBe(false);
    expect(isOutsideCoverage(dubai, [reem, abuDhabi])).toBe(true);
    expect(COVERAGE_KM).toBe(60);
  });

  it("counts having nothing to be near as outside", () => {
    expect(isOutsideCoverage(abuDhabi, [])).toBe(true);
  });
});

describe("sortByDistance", () => {
  it("orders nearest first with distances, keeping the items", () => {
    const sorted = sortByDistance([{ id: "dubai", ...dubai }, { id: "reem", ...reem }], abuDhabi);
    expect(sorted.map((s) => s.item.id)).toEqual(["reem", "dubai"]);
    expect(sorted[0].km).toBeLessThan(sorted[1].km);
  });

  it("keeps the given order for equal distances", () => {
    const sorted = sortByDistance([{ id: "a", ...reem }, { id: "b", ...reem }], abuDhabi);
    expect(sorted.map((s) => s.item.id)).toEqual(["a", "b"]);
  });
});

describe("projectToBox", () => {
  it("keeps every point inside the padded box, west-east left to right and north up", () => {
    const pts = projectToBox([abuDhabi, dubai, reem], 320, 180, 20);
    for (const { x, y } of pts) {
      expect(x).toBeGreaterThanOrEqual(20 - 1e-9);
      expect(x).toBeLessThanOrEqual(300 + 1e-9);
      expect(y).toBeGreaterThanOrEqual(20 - 1e-9);
      expect(y).toBeLessThanOrEqual(160 + 1e-9);
    }
    // Dubai is north-east of Abu Dhabi.
    expect(pts[1].x).toBeGreaterThan(pts[0].x);
    expect(pts[1].y).toBeLessThan(pts[0].y);
  });

  it("fills the limiting side of the box and centres the other", () => {
    const [a, b] = projectToBox([{ lat: 24, lng: 54 }, { lat: 24, lng: 54.1 }], 200, 100, 10);
    expect(a.x).toBeCloseTo(10);
    expect(b.x).toBeCloseTo(190);
    expect(a.y).toBeCloseTo(50);
    expect(b.y).toBeCloseTo(50);
  });

  it("puts a lone point in the middle and handles no points", () => {
    expect(projectToBox([reem], 320, 180, 20)).toEqual([{ x: 160, y: 90 }]);
    expect(projectToBox([], 320, 180)).toEqual([]);
  });
});

describe("isPinned", () => {
  it("needs both coordinates", () => {
    expect(isPinned(restaurant("a", [], { lat: 24.4, lng: 54.3 }))).toBe(true);
    expect(isPinned(restaurant("b", []))).toBe(false);
    expect(isPinned(restaurant("c", [], { lat: 24.4 }))).toBe(false);
  });
});

describe("inBox", () => {
  const box = { west: 54, south: 24, east: 55, north: 25 };

  it("includes points inside and on the edges, excludes the rest", () => {
    expect(inBox({ lat: 24.5, lng: 54.5 }, box)).toBe(true);
    expect(inBox({ lat: 24, lng: 55 }, box)).toBe(true);
    expect(inBox({ lat: 23.9, lng: 54.5 }, box)).toBe(false);
    expect(inBox({ lat: 24.5, lng: 55.1 }, box)).toBe(false);
  });

  it("handles a box that crosses the antimeridian", () => {
    const wrap = { west: 179, south: -10, east: -179, north: 10 };
    expect(inBox({ lat: 0, lng: 179.5 }, wrap)).toBe(true);
    expect(inBox({ lat: 0, lng: -179.5 }, wrap)).toBe(true);
    expect(inBox({ lat: 0, lng: 0 }, wrap)).toBe(false);
  });
});

describe("orderByView", () => {
  const box = { west: 54.3, south: 24.4, east: 54.5, north: 24.6 };
  const centre = { lat: 24.5, lng: 54.4 };
  const at = (id: string, lat: number, lng: number) => ({ id, lat, lng });
  const far = at("far", 25.2, 55.27);
  const near = at("near", 24.5, 54.41);
  const edge = at("edge", 24.58, 54.48);
  const far2 = at("far2", 24.9, 54.9);

  it("puts the ones in view first, nearest the centre first, then the rest as they were", () => {
    expect(orderByView([far, edge, far2, near], box, centre).map((i) => i.id)).toEqual(["near", "edge", "far", "far2"]);
  });

  it("drops nothing and leaves the input alone", () => {
    const items = [far, edge, near];
    const out = orderByView(items, box, centre);
    expect(out).toHaveLength(3);
    expect(items.map((i) => i.id)).toEqual(["far", "edge", "near"]);
  });

  it("keeps the previous order when nothing is in view", () => {
    expect(orderByView([far2, far], box, centre).map((i) => i.id)).toEqual(["far2", "far"]);
  });

  it("keeps the previous order for equal distances", () => {
    const a = at("a", 24.5, 54.41);
    const b = at("b", 24.5, 54.41);
    expect(orderByView([b, a], box, centre).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("leads with the preferred item only when it is in view", () => {
    expect(orderByView([near, edge, far], box, centre, (i) => i.id === "edge").map((i) => i.id)).toEqual(["edge", "near", "far"]);
    expect(orderByView([near, edge, far], box, centre, (i) => i.id === "far").map((i) => i.id)).toEqual(["near", "edge", "far"]);
  });
});
