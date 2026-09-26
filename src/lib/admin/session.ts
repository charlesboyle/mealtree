/**
 * Admin sessions without user accounts: the admin signs in with the shared
 * MEALTREE_ADMIN_TOKEN, and we set an httpOnly cookie holding an expiry plus
 * an HMAC of it keyed by that token. Rotating the token logs everyone out.
 *
 * Uses Web Crypto only so the same code runs in `proxy.ts` and on the server.
 */

export const ADMIN_COOKIE = "mt_admin";
export const SESSION_DAYS = 14;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Length-independent comparison so timing doesn't leak the token. */
export async function safeEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function adminToken() {
  const t = process.env.MEALTREE_ADMIN_TOKEN;
  return t && t.length >= 24 ? t : null;
}

export async function createSessionValue(token: string, now = Date.now()) {
  const exp = now + SESSION_DAYS * 86400_000;
  return `${exp}.${await hmac(token, `mealtree-admin:${exp}`)}`;
}

export async function verifySessionValue(value: string | undefined, token: string | null, now = Date.now()) {
  if (!value || !token) return false;
  const [expRaw, sig] = value.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < now || !sig) return false;
  return safeEqual(sig, await hmac(token, `mealtree-admin:${exp}`));
}
