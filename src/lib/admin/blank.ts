import type { RestaurantInput } from "@/lib/supabase/database";
import type { Hours } from "@/lib/types";

// Shared by the server page (initial draft) and the client editor.
export const ACCENTS = ["#C2410C", "#9A6A1F", "#3F6B2A", "#B45309", "#0F766E", "#1E3A8A", "#5B4636", "#9F1239", "#1F1F24", "#7C3AED"];

const EMPTY_HOURS: Hours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

export function blankRestaurant(): RestaurantInput {
  return {
    slug: "",
    name: "",
    name_ar: null,
    tagline: "",
    tagline_ar: null,
    cuisine: [],
    price_level: 2,
    neighborhood: "",
    neighborhood_ar: null,
    address: "",
    address_ar: null,
    phone: "",
    timezone: "Asia/Dubai",
    currency: "AED",
    accent: ACCENTS[0],
    cover: null,
    hours: EMPTY_HOURS,
    links: [],
    source: "visit",
    verified_at: new Date().toISOString().slice(0, 10),
    google_menu_link: false,
    menus: [],
    published: false,
  };
}
