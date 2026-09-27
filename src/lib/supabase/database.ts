/**
 * Types for the `mealtree` schema (supabase/migrations). Hand-written so the
 * repo doesn't pull in other apps' schemas that share the Supabase project.
 */
import type { ExternalLink, Hours, Menu, MenuSource, Restaurant } from "@/lib/types";

export type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  tagline: string;
  tagline_ar: string | null;
  cuisine: string[];
  price_level: number;
  neighborhood: string;
  neighborhood_ar: string | null;
  address: string;
  address_ar: string | null;
  phone: string;
  timezone: string;
  currency: string;
  accent: string;
  cover: string | null;
  hours: Hours;
  links: ExternalLink[];
  source: MenuSource;
  verified_at: string;
  google_menu_link: boolean;
  menus: Menu[];
  stats: Restaurant["stats"];
  claimed_at: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ClaimRow = {
  id: string;
  slug: string;
  restaurant: string;
  phone: string;
  name: string;
  role: string;
  method: "phone" | "email" | "google";
  google_opt_in: boolean;
  google_requested_at: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

export type RemovalRow = {
  id: string;
  slug: string | null;
  restaurant: string | null;
  name: string;
  contact: string;
  reason: string;
  status: "open" | "removed" | "dismissed";
  created_at: string;
};

export type AdminOverview = {
  restaurants: (Omit<RestaurantRow, "menus"> & { item_count: number })[];
  claims: ClaimRow[];
  removals: RemovalRow[];
};

export type ItemOverrideRow = {
  restaurant_id: string;
  item_id: string;
  sold_out: boolean | null;
  price: number | null;
  updated_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  mealtree: {
    Tables: {
      restaurants: Table<RestaurantRow>;
      item_overrides: Omit<Table<ItemOverrideRow>, "Relationships"> & {
        Relationships: [
          {
            foreignKeyName: "item_overrides_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      claim_restaurant: {
        Args: { p_slug: string; p_name: string; p_role: string; p_method: string; p_google_opt_in: boolean };
        Returns: string;
      };
      owner_session: {
        Args: { p_token: string; p_slug: string };
        Returns: {
          name: string;
          role: string;
          status: "pending" | "approved";
          google_opt_in: boolean;
          google_requested_at: string | null;
        }[];
      };
      request_removal: {
        Args: { p_slug: string; p_name: string; p_contact: string; p_reason: string };
        Returns: undefined;
      };
      admin_overview: { Args: { p_token: string }; Returns: AdminOverview };
      admin_get_restaurant: { Args: { p_token: string; p_slug: string }; Returns: RestaurantRow | null };
      admin_upsert_restaurant: { Args: { p_token: string; p_data: RestaurantInput }; Returns: string };
      admin_review_claim: { Args: { p_token: string; p_owner_id: string; p_approve: boolean }; Returns: undefined };
      admin_resolve_removal: { Args: { p_token: string; p_id: string; p_remove: boolean }; Returns: undefined };
      admin_set_published: { Args: { p_token: string; p_slug: string; p_published: boolean }; Returns: undefined };
      set_item_override: {
        Args: {
          p_token: string;
          p_slug: string;
          p_item_id: string;
          p_sold_out?: boolean | null;
          p_price?: number | null;
          p_clear_price?: boolean;
        };
        Returns: undefined;
      };
      reset_overrides: { Args: { p_token: string; p_slug: string }; Returns: undefined };
      request_google_link: { Args: { p_token: string; p_slug: string }; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/** What the admin editor sends to `admin_upsert_restaurant`. */
export type RestaurantInput = Pick<
  RestaurantRow,
  | "slug"
  | "name"
  | "name_ar"
  | "tagline"
  | "tagline_ar"
  | "cuisine"
  | "price_level"
  | "neighborhood"
  | "neighborhood_ar"
  | "address"
  | "address_ar"
  | "phone"
  | "timezone"
  | "currency"
  | "accent"
  | "cover"
  | "hours"
  | "links"
  | "source"
  | "verified_at"
  | "google_menu_link"
  | "menus"
  | "published"
>;

export function restaurantToInput(r: Restaurant, published = true): RestaurantInput {
  return {
    slug: r.slug,
    name: r.name,
    name_ar: r.nameAr?.trim() || null,
    tagline: r.tagline,
    tagline_ar: r.taglineAr?.trim() || null,
    cuisine: r.cuisine,
    price_level: r.priceLevel,
    neighborhood: r.neighborhood,
    neighborhood_ar: r.neighborhoodAr?.trim() || null,
    address: r.address,
    address_ar: r.addressAr?.trim() || null,
    phone: r.phone,
    timezone: r.timezone,
    currency: r.currency,
    accent: r.accent,
    cover: r.cover ?? null,
    hours: r.hours,
    links: r.links,
    source: r.source,
    verified_at: r.verifiedAt,
    google_menu_link: r.googleMenuLink,
    menus: r.menus,
    published,
  };
}

const EMPTY_STATS: Restaurant["stats"] = {
  daily: Array(30).fill(0),
  views30d: 0,
  trendPct: 0,
  qrScans30d: 0,
  linkClicks30d: 0,
};

/** Restaurants added in the admin editor have no stats until tracking exists. */
export function normalizeStats(stats: Partial<Restaurant["stats"]> | null | undefined): Restaurant["stats"] {
  const s = { ...EMPTY_STATS, ...(stats ?? {}) };
  return { ...s, daily: s.daily?.length ? s.daily : EMPTY_STATS.daily };
}

export function rowToRestaurant(row: RestaurantRow): Restaurant {
  return {
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    tagline: row.tagline,
    taglineAr: row.tagline_ar ?? undefined,
    cuisine: row.cuisine,
    priceLevel: row.price_level as Restaurant["priceLevel"],
    neighborhood: row.neighborhood,
    neighborhoodAr: row.neighborhood_ar ?? undefined,
    address: row.address,
    addressAr: row.address_ar ?? undefined,
    phone: row.phone,
    timezone: row.timezone,
    currency: row.currency ?? "AED",
    accent: row.accent,
    cover: row.cover ?? undefined,
    hours: row.hours,
    links: row.links,
    claimed: row.claimed_at !== null,
    source: row.source,
    verifiedAt: row.verified_at,
    googleMenuLink: row.google_menu_link,
    menus: row.menus,
    stats: normalizeStats(row.stats),
  };
}
