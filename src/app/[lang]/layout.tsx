import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Providers } from "@/components/providers";
import { dirOf, hasLocale, locales } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import { dictionaries } from "@/i18n/dictionaries";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(props: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const t = dictionaries[lang].meta;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t.title, template: t.template },
    description: t.description,
    alternates: { languages: { en: "/en", ar: "/ar" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${fontVariables} antialiased`}>
      <body className="min-h-dvh">
        <I18nProvider locale={lang}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
