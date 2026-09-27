import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RestaurantEditor } from "@/components/ops/editor/restaurant-editor";
import { adminDb, requireAdmin } from "@/lib/admin/server";
import type { RestaurantInput } from "@/lib/supabase/database";

export const metadata: Metadata = { title: "Edit restaurant", robots: { index: false } };

// Reading a long menu with Claude can take a minute or two.
export const maxDuration = 300;

export default async function EditRestaurantPage(props: PageProps<"/ops/edit/[slug]">) {
  const token = await requireAdmin();
  const { slug } = await props.params;
  const { data, error } = await adminDb().rpc("admin_get_restaurant", { p_token: token, p_slug: slug });
  if (error) throw new Error(`Couldn't load ${slug}: ${error.message}`);
  if (!data) notFound();
  const initial: RestaurantInput = {
    slug: data.slug,
    name: data.name,
    name_ar: data.name_ar,
    tagline: data.tagline,
    tagline_ar: data.tagline_ar,
    cuisine: data.cuisine,
    price_level: data.price_level,
    neighborhood: data.neighborhood,
    neighborhood_ar: data.neighborhood_ar,
    address: data.address,
    address_ar: data.address_ar,
    phone: data.phone,
    timezone: data.timezone,
    currency: data.currency ?? "AED",
    accent: data.accent,
    cover: data.cover,
    hours: data.hours,
    links: data.links,
    source: data.source,
    verified_at: data.verified_at,
    google_menu_link: data.google_menu_link,
    menus: data.menus,
    published: data.published,
  };
  return <RestaurantEditor initial={initial} isNew={false} />;
}
