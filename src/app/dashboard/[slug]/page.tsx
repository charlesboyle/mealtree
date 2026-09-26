import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getRestaurant, restaurants } from "@/data/restaurants";

export function generateStaticParams() {
  return restaurants.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/dashboard/[slug]">): Promise<Metadata> {
  const r = getRestaurant((await props.params).slug);
  return r ? { title: `${r.name} dashboard`, robots: { index: false } } : {};
}

export default async function DashboardPage(props: PageProps<"/dashboard/[slug]">) {
  const r = getRestaurant((await props.params).slug);
  if (!r) notFound();
  return <Dashboard restaurant={r} />;
}
