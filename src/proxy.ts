import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, verifySessionValue } from "@/lib/admin/session";

/** Keeps /ops (outreach, claims, menu editor) behind the admin login. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/ops/login") return NextResponse.next();

  const ok = await verifySessionValue(request.cookies.get(ADMIN_COOKIE)?.value, adminToken());
  if (ok) return NextResponse.next();

  const login = new URL("/ops/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/ops", "/ops/:path*"],
};
