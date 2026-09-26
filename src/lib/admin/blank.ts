import type { RestaurantInput } from "@/lib/supabase/database";
import type { Hours } from "@/lib/types";

// Shared by the server page (initial draft) and the client editor.
export const ACCENTS = ["#C2412D", "#1E5BB8", "#2F6B3A", "#B7791F", "#3F7D58", "#5F7A61", "#1F1F24", "#C47F0E", "#7C3AED", "#BE185D"];

const EMPTY_HOURS: Hours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

export function blankRestaurant(): RestaurantInput {
  return {
    slug: "",
    name: "",
    tagline: "",
    cuisine: [],
    price_level: 2,
    neighborhood: "Mission District",
    address: "",
    phone: "",
    timezone: "America/Los_Angeles",
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
