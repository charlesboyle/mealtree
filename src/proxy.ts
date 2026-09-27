import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, verifySessionValue } from "@/lib/admin/session";
import { LOCALE_COOKIE, hasLocale, localePath, negotiateLocale } from "@/i18n/config";

/**
 * - /ops (outreach, claims, menu editor) stays behind the admin login.
 * - Public URLs without a language (/r/slug on a QR code, a Google listing, an
 *   old link) redirect to /en/… or /ar/…: the toggle's saved choice first, then
 *   the browser's Accept-Language, then English.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/ops" || pathname.startsWith("/ops/")) {
    if (pathname === "/ops/login") return NextResponse.next();
    const ok = await verifySessionValue(request.cookies.get(ADMIN_COOKIE)?.value, adminToken());
    if (ok) return NextResponse.next();
    const login = new URL("/ops/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const first = pathname.split("/")[1];
  if (hasLocale(first)) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = localePath(locale, pathname);
  const res = NextResponse.redirect(url);
  // Caches must key on the language signals, since the target depends on them.
  res.headers.set("Vary", "Cookie, Accept-Language");
  return res;
}

export const config = {
  // Everything except Next internals and files with an extension (favicon.ico, …).
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
};
