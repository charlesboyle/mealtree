"use server";

import { revalidatePath, updateTag } from "next/cache";
import { locales } from "@/i18n/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDb, requireAdmin } from "@/lib/admin/server";
import { ADMIN_COOKIE, SESSION_DAYS, adminToken, createSessionValue, safeEqual } from "@/lib/admin/session";
import type { RestaurantInput } from "@/lib/supabase/database";

export type ActionResult = { ok: true; slug?: string } | { ok: false; error: string };

export async function signIn(_: unknown, form: FormData): Promise<{ error?: string }> {
  const token = adminToken();
  if (!token) return { error: "Admin access isn't configured on this deployment (MEALTREE_ADMIN_TOKEN)." };
  const entered = String(form.get("token") ?? "").trim();
  // Slow down guessing a little; the token itself is long and random.
  await new Promise((r) => setTimeout(r, 400));
  if (!entered || !(await safeEqual(entered, token))) return { error: "That key isn't right." };

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createSessionValue(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  const next = String(form.get("next") ?? "/ops");
  redirect(next.startsWith("/ops") ? next : "/ops");
}

export async function signOut() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/ops/login");
}

/** Refresh every page that shows restaurant data after an admin write. */
function refresh(slug?: string) {
  updateTag("mealtree");
  revalidatePath("/ops");
  for (const lang of locales) {
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}/claim`);
    if (slug) for (const base of ["/r", "/claim", "/dashboard"]) revalidatePath(`/${lang}${base}/${slug}`);
  }
}

function fail(error: { message?: string } | null | undefined, fallback: string): ActionResult {
  const m = error?.message ?? "";
  if (m.includes("not_authorized")) return { ok: false, error: "Your admin session isn't valid anymore. Sign in again." };
  if (m.includes("claim_not_pending")) return { ok: false, error: "That claim was already reviewed." };
  if (/duplicate key|unique/i.test(m)) return { ok: false, error: "That slug is taken." };
  if (/check constraint|violates/i.test(m)) return { ok: false, error: `Some fields are invalid: ${m}` };
  return { ok: false, error: m || fallback };
}

export async function reviewClaim(ownerId: string, slug: string, approve: boolean): Promise<ActionResult> {
  const token = await requireAdmin();
  const { error } = await adminDb().rpc("admin_review_claim", { p_token: token, p_owner_id: ownerId, p_approve: approve });
  if (error) return fail(error, "Couldn't update the claim.");
  refresh(slug);
  return { ok: true };
}

export async function resolveRemoval(id: string, slug: string | null, remove: boolean): Promise<ActionResult> {
  const token = await requireAdmin();
  const { error } = await adminDb().rpc("admin_resolve_removal", { p_token: token, p_id: id, p_remove: remove });
  if (error) return fail(error, "Couldn't update the request.");
  refresh(slug ?? undefined);
  return { ok: true };
}

export async function setPublished(slug: string, published: boolean): Promise<ActionResult> {
  const token = await requireAdmin();
  const { error } = await adminDb().rpc("admin_set_published", { p_token: token, p_slug: slug, p_published: published });
  if (error) return fail(error, "Couldn't change visibility.");
  refresh(slug);
  return { ok: true };
}

export async function saveRestaurant(data: RestaurantInput, previousSlug?: string): Promise<ActionResult> {
  const token = await requireAdmin();
  if (previousSlug && previousSlug !== data.slug) {
    return { ok: false, error: "Changing the slug of a published restaurant would break its links and QR codes." };
  }
  const { data: slug, error } = await adminDb().rpc("admin_upsert_restaurant", { p_token: token, p_data: data });
  if (error) return fail(error, "Couldn't save the restaurant.");
  refresh(slug);
  return { ok: true, slug };
}
