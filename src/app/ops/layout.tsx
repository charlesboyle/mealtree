import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { I18nProvider } from "@/i18n/client";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "nomm ops", template: "%s · nomm ops" },
  robots: { index: false, follow: false },
};

/** The admin tools are English-only, so they sit outside /[lang] with their own root layout. */
export default function OpsLayout({ children }: LayoutProps<"/ops">) {
  return (
    <html lang="en" dir="ltr" className={`${fontVariables} antialiased`}>
      <body className="min-h-dvh">
        <I18nProvider locale="en">
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
