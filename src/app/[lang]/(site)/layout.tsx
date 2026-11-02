import { SiteShell } from "@/components/site-shell";
import { listRestaurants } from "@/lib/data";

/** One persistent frame (header, tab bar, footer, search) for every public page, so navigating between them never remounts it. */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const knownSlugs = (await listRestaurants()).map((r) => r.slug);
  return <SiteShell knownSlugs={knownSlugs}>{children}</SiteShell>;
}
