import { MapPinOffIcon } from "lucide-react";
import Link from "next/link";
import { lang } from "next/root-params";
import { EmptyState } from "@/components/empty-state";
import { SiteShell } from "@/components/site-shell";
import { hasLocale, makeI18n } from "@/i18n";
import { listRestaurants } from "@/lib/data";

const content = {
  en: {
    title: "We can’t find that page",
    body: "The restaurant may have left NOMM, or the link is broken.",
    cta: "Go to Discover",
  },
  ar: {
    title: "لا نجد هذه الصفحة",
    body: "ربما غادر المطعم NOMM، أو أن الرابط معطّل.",
    cta: "العودة إلى الاستكشاف",
  },
};

export default async function NotFound() {
  const locale = await lang();
  const { locale: l, href } = makeI18n(hasLocale(locale) ? locale : "en");
  const c = content[l];
  return (
    <SiteShell knownSlugs={(await listRestaurants()).map((r) => r.slug)}>
      <main className="mx-auto max-w-xl px-4 py-16">
        <EmptyState icon={MapPinOffIcon} title={c.title} body={c.body}>
          <Link
            href={href("/")}
            className="inline-flex h-11 items-center rounded-full bg-tomato px-6 text-sm font-semibold text-white transition-colors duration-150 hover:bg-tomato-dark"
          >
            {c.cta}
          </Link>
        </EmptyState>
      </main>
    </SiteShell>
  );
}
