import type { Metadata } from "next";
import { RemovalForm } from "@/components/legal/removal-form";
import { listRestaurants } from "@/lib/data";

export const metadata: Metadata = {
  title: "Remove a restaurant page",
  description: "Restaurant owners can ask us to take their mealtree page down.",
};

export const revalidate = 300;

export default async function RemovePage(props: PageProps<"/remove">) {
  const { r } = await props.searchParams;
  const restaurants = (await listRestaurants()).map(({ slug, name, address }) => ({ slug, name, address }));
  return <RemovalForm restaurants={restaurants} initialSlug={typeof r === "string" ? r : ""} />;
}
