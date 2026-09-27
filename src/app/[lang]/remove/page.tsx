import type { Metadata } from "next";
import { RemovalForm } from "@/components/legal/removal-form";
import { getI18n } from "@/i18n/server";
import { listRestaurants } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.remove, description: t.meta.removeDescription };
}

export const revalidate = 300;

export default async function RemovePage(props: PageProps<"/[lang]/remove">) {
  const { r } = await props.searchParams;
  const restaurants = (await listRestaurants()).map(({ slug, name, nameAr, address, addressAr }) => ({
    slug,
    name,
    nameAr,
    address,
    addressAr,
  }));
  return <RemovalForm restaurants={restaurants} initialSlug={typeof r === "string" ? r : ""} />;
}
