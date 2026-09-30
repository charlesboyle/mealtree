export type DietTag = "vegetarian" | "vegan" | "gluten-free" | "spicy" | "nuts";

export type Variant = { label: string; labelAr?: string; price: number };

export type MenuItem = {
  id: string;
  name: string;
  /** Arabic name, when the menu prints one (most UAE menus do). */
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  /** Null when the menu lists "market price" or no price at all. */
  price: number | null;
  priceNote?: string;
  variants?: Variant[];
  addOns?: Variant[];
  image?: string;
  tags?: DietTag[];
  popular?: boolean;
  soldOut?: boolean;
};

export type MenuSection = {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  items: MenuItem[];
};

export type Menu = {
  id: string;
  name: string;
  nameAr?: string;
  note?: string;
  noteAr?: string;
  sections: MenuSection[];
};

/** [open, close] in 24h "HH:MM"; close may be past midnight (e.g. "01:30"). */
export type Hours = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, [string, string][]>;

export type LinkKind =
  | "reserve"
  | "order"
  | "instagram"
  | "website"
  | "whatsapp"
  /** An extra phone number: `url` is a tel: link and `label` says who answers ("Reception"). */
  | "phone";

export type ExternalLink = { kind: LinkKind; label: string; labelAr?: string; url: string };

export type MenuSource = "visit" | "photos" | "website" | "owner";

export type Restaurant = {
  slug: string;
  name: string;
  nameAr?: string;
  tagline: string;
  taglineAr?: string;
  /** English names; translated for display through the dictionary. */
  cuisine: string[];
  priceLevel: 1 | 2 | 3 | 4;
  neighborhood: string;
  neighborhoodAr?: string;
  address: string;
  addressAr?: string;
  /** ISO 4217 code for every price on the menu. */
  currency: string;
  phone: string;
  timezone: string;
  /** Hex brand color, used to tint the menu page. */
  accent: string;
  cover?: string;
  hours: Hours;
  links: ExternalLink[];
  claimed: boolean;
  source: MenuSource;
  verifiedAt: string;
  /** Whether the Google Business Profile has a menu link today. */
  googleMenuLink: boolean;
  menus: Menu[];
};

/** Last 30 days, computed from real events (see supabase/migrations/…_events.sql). */
export type RestaurantStats = {
  /** Views per day, oldest first, in the restaurant's time zone. */
  daily: number[];
  views30d: number;
  /** Last 14 days vs the 14 before; null until there's a previous period. */
  trendPct: number | null;
  /** Views that arrived with utm_source=qr (the table QR codes). */
  qrScans30d: number;
  linkClicks30d: number;
  topDishes: { itemId: string; views: number }[];
  /** utm_source, else the referring site's host, else "direct". */
  sources: { source: string; views: number }[];
};
