import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaimFlow } from "@/components/claim/claim-flow";
import { getRestaurant, restaurants } from "@/data/restaurants";

export function generateStaticParams() {
  return restaurants.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/claim/[slug]">): Promise<Metadata> {
  const r = getRestaurant((await props.params).slug);
  return r ? { title: `Claim ${r.name}`, robots: { index: false } } : {};
}

export default async function ClaimPage(props: PageProps<"/claim/[slug]">) {
  const r = getRestaurant((await props.params).slug);
  if (!r) notFound();
  return <ClaimFlow restaurant={r} />;
}
