# mealtree

Menu pages for restaurants, like Linktree but for menus: mobile-first, searchable, with prices and photos. It launches in the UAE: prices are in AED, times are in Dubai time, and every public page is in **English and Arabic (RTL)** with a language toggle. The MVP runs on placeholder data for 8 fictional Dubai restaurants (Emirati, shawarma, Lebanese, Kerala, Afghan, specialty coffee, Japanese, Iranian).

**Live:** https://mealtree-zeta.vercel.app (Vercel project `mealtree`, deploys from this repo; admin at `/ops`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # every page is prerendered as static HTML
npm run lint
```

The Supabase URL and publishable key are committed in `.env`, so a fresh clone connects to the database with no setup. Both are public values that ship to the browser anyway, and the database rules decide what they can do. To run offline on the bundled placeholder data instead, set both to empty in `.env.local` (see `.env.example`). Never commit a `service_role` or other secret key. Set `NEXT_PUBLIC_SITE_URL` in production so canonical and Open Graph URLs resolve. The build loads data from Supabase, so it fails if Supabase can't be reached.

## Pages

Public pages live under `/en/…` and `/ar/…`. A bare URL (`/r/slug` on a QR code or Google listing) redirects to the visitor's language: the toggle's saved choice (`mt_lang` cookie) first, then the browser's `Accept-Language`, then English (`src/proxy.ts`).

| Route | What it is |
| --- | --- |
| `/[lang]` | Discover: search dishes across every restaurant in either language ("shawarma under 15", "برياني أقل من 30 درهم", "karak", "rice"), plus quick filters (open now, price caps, vegetarian). |
| `/[lang]/r/[slug]` | The public menu page. Includes links (reserve, order, call, directions), open/closed status in the restaurant's timezone, sticky section tabs that follow your scroll, menu search, diet filters, a dish detail sheet you drag down to close, deep links (`#dish-<id>`), a "report wrong info" form, hours and location, and schema.org `Restaurant` + `Menu` JSON-LD. |
| `/[lang]/claim` | Owner-side search: find your restaurant. |
| `/[lang]/claim/[slug]` | Claim flow: pitch (real view count) → choose verification method → 6-digit code → name/role, plus opt-in to add the menu link to Google Business Profile → done. |
| `/[lang]/dashboard/[slug]` | Owner dashboard: views, QR scans, link clicks, a daily-views chart, most-viewed dishes, inline price edits, sold-out switches, a downloadable table QR code, and share links tagged by channel. |
| `/ops` | **Admin only, English** (sign in at `/ops/login`). Outreach pipeline (claim and Google-link status, stale menus, one-click pitch), **claim review** (call the listed number, then approve/reject), and **takedown requests**. |
| `/ops/new`, `/ops/edit/[slug]` | **Admin only.** Restaurant editor: read a menu from photos with Claude, review and fix every dish, set hours, links and brand color, then publish or save a hidden draft. |
| `/[lang]/remove` | Public takedown form for restaurants that don't want a page. |
| `/[lang]/terms`, `/[lang]/privacy` | Plain-language terms and privacy. |

## How it's put together

- **Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Motion.** Every route is prerendered and refreshed from the database every 5 minutes, so menu pages stay fast and indexable.
- **Data**: server pages load restaurants through `src/lib/data.ts`, from Supabase when configured, otherwise from `src/data/restaurants.ts`. Types are in `src/lib/types.ts`. Views and other stats are still deterministic mock numbers from `src/data/helpers.ts`.
- **Brand color**: each restaurant has one `accent` hex. `src/lib/accent.ts` derives light/dark variants and a readable text color, applied through `[data-accent]` CSS variables.
- **Owner edits** (claim, sold-out, price, Google link request) go through `src/lib/store.ts`. With Supabase configured they're saved to the database and every visitor sees them right away, because the menu page loads edits in the browser rather than waiting for the 5-minute refresh. Without Supabase they're kept in `localStorage`.
- **Languages** (`src/i18n`): `config.ts` (locales, cookie, redirects), `dictionaries/en.ts` + `ar.ts` (every UI string; Arabic plurals are handled in `ar.ts`), `format.ts` (AED prices, 12-hour times, dates, `+971` phone numbers; Western digits in both languages, as UAE menus print them). Client components call `useI18n()`, server components `getI18n()` (via `next/root-params`). `/[lang]` and `/ops` are separate root layouts, so `<html lang dir>` is set per language, and unmatched URLs fall to `app/global-not-found.tsx`.
- **Bilingual content**: restaurants have `nameAr`, `taglineAr`, `neighborhoodAr`, `addressAr`; menus, sections, dishes and options have `nameAr` / `descriptionAr` / `labelAr` inside the menu JSON. Arabic pages show the Arabic text when it exists and fall back to English; the dish sheet shows the other language's name too, for ordering. Cuisine names are translated in the dictionary.
- **RTL**: layouts use logical properties (`ms-`/`pe-`/`start-`/`text-start`), directional icons flip, tab centering is measured from rects (RTL `scrollLeft` runs negative), phone numbers and codes stay LTR, and charts keep time running left to right.
- **Type**: IBM Plex Sans + IBM Plex Sans Arabic (one family drawn for both scripts), on a fixed type scale in `globals.css`; Arabic gets taller line heights and no letter-spacing.
- **Search** (`src/lib/search.ts`): matches English and Arabic at once. It's accent-insensitive, folds Arabic letter variants and diacritics (أ/ا, ة/ه, كُنافة = كنافه), ignores the article "ال", reads Arabic-Indic digits, understands budget phrases in both languages ("under 15", "under aed 20", "أقل من 20 درهم"), and knows craving synonyms ("rice" → machboos, biryani, pulao; "حلويات" → لقيمات، كنافة).
- **Photos** come from Unsplash by photo id (`photoUrl` in `src/lib/format.ts`). Most scraped menus have none; dish rows then go text-only, and restaurants without a cover show a cuisine glyph on a tint of their color.
- Supports light and dark mode and `prefers-reduced-motion`. Layouts are checked at 390px and desktop widths.

## Backend (Supabase)

mealtree lives in its own **`mealtree` schema** inside the existing Ketticho project (Pro org). It doesn't touch Ketticho's `public` tables.

| Table | Purpose | Public access |
| --- | --- | --- |
| `mealtree.restaurants` | Restaurant info (with `*_ar` Arabic columns and `currency`, default AED) plus menus (as JSON), `claimed_at`, placeholder `stats` | read |
| `mealtree.item_overrides` | Per-dish owner edits: `sold_out`, `price` | read |
| `mealtree.owners` | Verified owner per restaurant: name, role, Google opt-in, SHA-256 hash of the claim token | none |

All writes go through `SECURITY DEFINER` functions: `claim_restaurant`, `owner_session`, `set_item_override`, `reset_overrides`, `request_google_link`. Row Level Security is on for every table, and anonymous users have no direct write grants. Claiming returns a random token that's kept in the owner's browser (only its hash is stored). Every other function checks it and only lets the owner edit their own restaurant.

- **Schema:** `supabase/migrations/20260926120000_mealtree_schema.sql`
- **Seed:** `supabase/seed.sql`, regenerated with `npm run db:seed-sql` from `src/data/restaurants.ts`. It's re-runnable (upsert by slug).
- The migration is deliberately **not** recorded in Ketticho's `supabase_migrations` history. Recording it there would make Ketticho's own `supabase db push` complain about unknown remote migrations. Apply mealtree SQL changes manually, or move to a dedicated project later.

**One-time setup (done):** `mealtree` has been added to Ketticho → *Project Settings → Data API → Exposed schemas*. If it's ever removed, the API returns "schema must be one of…" errors.

### Claims and admin (migration `20260927090000_admin_and_claim_review.sql`)

- **Claims start as `pending`.** The 6-digit code step is still a demo, so a claim does nothing until an admin approves it in `/ops` → Claims. Before approving, call the number on the restaurant's Google listing (not one the claimant gave you). Only approved owners can edit.
- **Admin access** uses one secret, `MEALTREE_ADMIN_TOKEN` (a server-side env var on Vercel and in `.env.local` locally, never committed). You type it at `/ops/login`, and the server sets a signed, httpOnly cookie that lasts 14 days. `src/proxy.ts` gates every `/ops` route, and each admin action checks the session again. Admin database functions (`admin_*`) require the token too; `mealtree.admin_keys` stores only its SHA-256 hash. To rotate the key: insert a new hash, update the env var, delete the old row.
- **Publishing:** `restaurants.published` hides a page everywhere; hidden pages return 404. Takedown requests land in `mealtree.removal_requests`, and resolving one with "Hide page" unpublishes it.

### UAE + Arabic (migration `20260928090000_uae_bilingual.sql`)

Adds `name_ar`, `tagline_ar`, `neighborhood_ar`, `address_ar` and `currency` (default `AED`) to `mealtree.restaurants`, makes `Asia/Dubai` the default time zone, and updates `admin_upsert_restaurant` to save them. The 8 SF placeholder restaurants were replaced by the Dubai set.

### Menu photos → Claude

`src/app/ops/extract-action.ts` sends up to 8 photos (downscaled in the browser to 1600px) to `claude-opus-5`. Bilingual menus come back with the Arabic names and descriptions as printed (never translated), prices in AED. It uses structured outputs (zod schema), adaptive thinking at `medium` effort, and server-side refusal fallbacks (`fallbacks: "default"`). The result is a draft; nothing is published until you save. It needs `ANTHROPIC_API_KEY` set on the server. Without it the editor still works, and the photo button shows a clear error.

| Env var | Where | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | committed `.env` | no (public by design) |
| `MEALTREE_ADMIN_TOKEN` | Vercel (production) + `.env.local` | **yes** |
| `ANTHROPIC_API_KEY` | Vercel (production) + `.env.local` | **yes** |
| `NEXT_PUBLIC_SITE_URL` | Vercel | no |

**Known gaps:** there's no rate limiting on claims or takedown requests yet. Someone could file junk claims, which would block the real owner until you reject them in `/ops`. Add rate limiting, and real SMS/email codes, before scaling up outreach.

## Not built yet (next steps)

- Automated owner verification (SMS/email codes) to replace calling each restaurant, multiple owners per restaurant, an audit log of edits, and rate limits on public endpoints.
- Uploading your own photos to storage (the editor takes image URLs for now).
- An ingestion pipeline: menu photo → OCR/LLM extraction → human QA → publish, with a `verifiedAt` date per menu.
- Real view and QR-scan analytics (`utm_source` is already on every share/QR link).
- Google Business Profile integration for owners who opt in during the claim flow.
- Real dish photos for the Dubai set (placeholder data reuses the few Unsplash photos that match), and other emirates beyond Dubai.
