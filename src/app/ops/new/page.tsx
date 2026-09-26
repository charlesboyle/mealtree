import type { Metadata } from "next";
import { RestaurantEditor } from "@/components/ops/editor/restaurant-editor";
import { blankRestaurant } from "@/lib/admin/blank";
import { requireAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "New restaurant", robots: { index: false } };

// Reading a long menu with Claude can take a minute or two.
export const maxDuration = 300;

export default async function NewRestaurantPage() {
  await requireAdmin();
  return <RestaurantEditor initial={blankRestaurant()} isNew />;
}
