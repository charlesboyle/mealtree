import { describe, expect, it } from "vitest";
import { emptyHours } from "@/test/fixtures";
import { rowToRestaurant, type RestaurantRow } from "./database";

const row = (over: Partial<RestaurantRow> = {}): RestaurantRow => ({
  id: "1",
  slug: "a",
  name: "A",
  name_ar: null,
  tagline: "",
  tagline_ar: null,
  cuisine: [],
  price_level: 2,
  neighborhood: "Al Reem Island - Zone 1",
  neighborhood_ar: null,
  address: "Abu Dhabi",
  address_ar: null,
  lat: null,
  lng: null,
  phone: "",
  timezone: "Asia/Dubai",
  currency: "AED",
  accent: "#000000",
  cover: null,
  hours: emptyHours(),
  links: [],
  source: "menu",
  verified_at: "2026-01-01",
  google_menu_link: false,
  menus: [],
  menu_files: null,
  rating: null,
  rating_count: null,
  claimed_at: null,
  published: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  ...over,
});

describe("rowToRestaurant map pin", () => {
  it("carries lat and lng across when both are set", () => {
    const r = rowToRestaurant(row({ lat: 24.4973, lng: 54.4028 }));
    expect(r.lat).toBe(24.4973);
    expect(r.lng).toBe(54.4028);
  });

  it("leaves both absent (not null) for a restaurant that is not on the map", () => {
    const r = rowToRestaurant(row());
    expect("lat" in r).toBe(false);
    expect("lng" in r).toBe(false);
  });

  it("keeps a coordinate of exactly zero", () => {
    const r = rowToRestaurant(row({ lat: 0, lng: 0 }));
    expect(r.lat).toBe(0);
    expect(r.lng).toBe(0);
  });

  it("ignores a half-set pin", () => {
    const r = rowToRestaurant(row({ lat: 24.4, lng: null }));
    expect(r.lat).toBeUndefined();
    expect(r.lng).toBeUndefined();
  });
});
