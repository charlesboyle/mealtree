import type { Metadata } from "next";
import { RemovalForm } from "@/components/legal/removal-form";
import { getI18n } from "@/i18n/server";
import { listRestaurantCards } from "@/lib/data";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.remove, description: t.meta.removeDescription, robots: NO_INDEX };
}

export const revalidate = 3600;

export default async function RemovePage(props: PageProps<"/[lang]/remove">) {
  const { r } = await props.searchParams;
  const restaurants = (await listRestaurantCards()).map(({ slug, name, nameAr, address, addressAr }) => ({
    slug,
    name,
    nameAr,
    address,
    addressAr,
  }));
  return <RemovalForm restaurants={restaurants} initialSlug={typeof r === "string" ? r : ""} />;
}
