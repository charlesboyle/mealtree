/**
 * Types for the `mealtree` schema (supabase/migrations). Hand-written so the
 * repo doesn't pull in other apps' schemas that share the Supabase project.
 */
import type { ExternalLink, Hours, Menu, MenuSource, Restaurant } from "@/lib/types";

export type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  cuisine: string[];
  price_level: number;
  neighborhood: string;
  address: string;
  phone: string;
  timezone: string;
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
  created_at: string;
  updated_at: string;
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
        Returns: { name: string; role: string; google_opt_in: boolean; google_requested_at: string | null }[];
      };
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

export function rowToRestaurant(row: RestaurantRow): Restaurant {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    cuisine: row.cuisine,
    priceLevel: row.price_level as Restaurant["priceLevel"],
    neighborhood: row.neighborhood,
    address: row.address,
    phone: row.phone,
    timezone: row.timezone,
    accent: row.accent,
    cover: row.cover ?? undefined,
    hours: row.hours,
    links: row.links,
    claimed: row.claimed_at !== null,
    source: row.source,
    verifiedAt: row.verified_at,
    googleMenuLink: row.google_menu_link,
    menus: row.menus,
    stats: row.stats,
  };
}
