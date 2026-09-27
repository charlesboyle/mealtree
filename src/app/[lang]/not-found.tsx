import Link from "next/link";
import { lang } from "next/root-params";
import { LogoMark } from "@/components/logo";
import { hasLocale, makeI18n } from "@/i18n";

export default async function NotFound() {
  const locale = await lang();
  const { t, href } = makeI18n(hasLocale(locale) ? locale : "en");
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="animate-rise">
        <LogoMark className="mx-auto size-9" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{t.notFound.title}</h1>
        <p className="mt-2 text-base text-ink-2">{t.notFound.body}</p>
        <Link
          href={href("/")}
          className="pressable mt-6 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-bg"
        >
          {t.notFound.cta}
        </Link>
      </div>
    </main>
  );
}
