import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getI18n } from "@/i18n/server";
import { findRestaurant, getStats } from "@/lib/data";

// Refresh restaurant data from Supabase every hour (matches REVALIDATE_SECONDS).
export const revalidate = 3600;

// Not prerendered at build (rarely visited, and each costs ISR writes): rendered on first visit, then cached.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/[lang]/dashboard/[slug]">): Promise<Metadata> {
  const [r, { t, pick }] = await Promise.all([findRestaurant((await props.params).slug), getI18n()]);
  return r ? { title: t.meta.dashboardTitle(pick(r.name, r.nameAr)), robots: { index: false } } : {};
}

export default async function DashboardPage(props: PageProps<"/[lang]/dashboard/[slug]">) {
  const r = await findRestaurant((await props.params).slug);
  if (!r) notFound();
  return <Dashboard restaurant={r} initialStats={await getStats(r.slug)} />;
}
