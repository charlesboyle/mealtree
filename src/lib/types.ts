export type DietTag = "vegetarian" | "vegan" | "gluten-free" | "spicy" | "nuts";

export type Variant = { label: string; price: number };

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
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
  description?: string;
  items: MenuItem[];
};

export type Menu = {
  id: string;
  name: string;
  note?: string;
  sections: MenuSection[];
};

/** [open, close] in 24h "HH:MM"; close may be past midnight (e.g. "01:30"). */
export type Hours = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, [string, string][]>;

export type LinkKind =
  | "reserve"
  | "order"
  | "instagram"
  | "website"
  | "whatsapp";

export type ExternalLink = { kind: LinkKind; label: string; url: string };

export type MenuSource = "visit" | "photos" | "website" | "owner";

export type Restaurant = {
  slug: string;
  name: string;
  tagline: string;
  cuisine: string[];
  priceLevel: 1 | 2 | 3 | 4;
  neighborhood: string;
  address: string;
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
  stats: {
    views30d: number;
    trendPct: number;
    daily: number[];
    qrScans30d: number;
    linkClicks30d: number;
  };
};
