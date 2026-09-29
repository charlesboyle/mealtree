import type { Metadata } from "next";
import Link from "next/link";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = { title: "Not found · nomm" };

/** For URLs outside /en, /ar and /ops (the proxy redirects almost everything else). */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fontVariables} antialiased`}>
      <body className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-ink">
        <main>
          <h1 className="text-2xl font-semibold">This page isn&apos;t here</h1>
          <p lang="ar" dir="rtl" className="mt-1 text-lg text-ink-2">
            هذه الصفحة غير موجودة
          </p>
          <p className="mt-6 flex justify-center gap-3 text-base">
            <Link href="/en" className="font-medium text-brand">
              Browse restaurants
            </Link>
            <span className="text-ink-3">·</span>
            <Link href="/ar" lang="ar" className="font-medium text-brand">
              تصفّح المطاعم
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
