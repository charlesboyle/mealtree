import { SiteShell } from "@/components/site-shell";

/** One persistent frame (header, tab bar, footer, search) for every public page, so navigating between them never remounts it. */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
