import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/page-transition";
import { ClaimFlow } from "@/components/claim/claim-flow";
import { getI18n } from "@/i18n/server";
import { findRestaurant, getStats, listRestaurants } from "@/lib/data";

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export async function generateStaticParams() {
  return (await listRestaurants()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/[lang]/claim/[slug]">): Promise<Metadata> {
  const [r, { t, pick }] = await Promise.all([findRestaurant((await props.params).slug), getI18n()]);
  return r ? { title: t.meta.claimTitle(pick(r.name, r.nameAr)), robots: { index: false } } : {};
}

export default async function ClaimPage(props: PageProps<"/[lang]/claim/[slug]">) {
  const r = await findRestaurant((await props.params).slug);
  if (!r) notFound();
  return (
    <PageTransition>
      <ClaimFlow restaurant={r} stats={await getStats(r.slug)} />
    </PageTransition>
  );
}
