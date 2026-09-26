# mealtree

Menu pages for restaurants, like Linktree but for menus: mobile-first, searchable, with prices and photos. The MVP runs on placeholder data for 8 fictional restaurants in SF's Mission District.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # every page is prerendered as static HTML
npm run lint
```

Without environment variables the app runs on the bundled placeholder data, and owner edits are saved in the browser. To use Supabase, `cp .env.example .env.local` (see [Backend](#backend-supabase)). Set `NEXT_PUBLIC_SITE_URL` in production so canonical and Open Graph URLs resolve.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Discover: search dishes across every restaurant ("tacos under $6", "vegan ramen", "noodles"), plus quick filters (open now, price caps, vegan). |
| `/r/[slug]` | The public menu page. Includes links (reserve, order, call, directions), open/closed status in the restaurant's timezone, sticky section tabs that follow your scroll, menu search, diet filters, a dish detail sheet you drag down to close, deep links (`#dish-<id>`), a "report wrong info" form, hours and location, and schema.org `Restaurant` + `Menu` JSON-LD. |
| `/claim` | Owner-side search: find your restaurant. |
| `/claim/[slug]` | Claim flow: pitch (real view count) → choose verification method → 6-digit code → name/role, plus opt-in to add the menu link to Google Business Profile → done. |
| `/dashboard/[slug]` | Owner dashboard: views, QR scans, link clicks, a daily-views chart, most-viewed dishes, inline price edits, sold-out switches, a downloadable table QR code, and share links tagged by channel. |
| `/ops` | Internal GTM pipeline: claim status, Google menu-link status, stale menus, and a one-click "copy pitch" outreach message per restaurant. |

## How it's put together

- **Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Motion.** Every route is prerendered and refreshed from the database every 5 minutes, so menu pages stay fast and indexable.
- **Data**: server pages load restaurants through `src/lib/data.ts`, from Supabase when configured, otherwise from `src/data/restaurants.ts`. Types are in `src/lib/types.ts`. Views and other stats are still deterministic mock numbers from `src/data/helpers.ts`.
- **Brand color**: each restaurant has one `accent` hex. `src/lib/accent.ts` derives light/dark variants and a readable text color, applied through `[data-accent]` CSS variables.
- **Owner edits** (claim, sold-out, price, Google link request) go through `src/lib/store.ts`. With Supabase configured they're saved to the database and every visitor sees them right away, because the menu page loads edits in the browser rather than waiting for the 5-minute refresh. Without Supabase they're kept in `localStorage`.
- **Search** (`src/lib/search.ts`): accent-insensitive word-prefix matching, understands budget phrases ("under $15"), and knows a few craving synonyms ("noodles" → ramen, pho, pasta).
- **Photos** come from Unsplash by photo id (`photoUrl` in `src/lib/format.ts`). Missing or broken images fall back to a tile tinted with the restaurant's color, so text-only menus still look intentional.
- Supports light and dark mode and `prefers-reduced-motion`. Layouts are checked at 390px and desktop widths.

## Backend (Supabase)

mealtree lives in its own **`mealtree` schema** inside the existing Ketticho project (Pro org). It doesn't touch Ketticho's `public` tables.

| Table | Purpose | Public access |
| --- | --- | --- |
| `mealtree.restaurants` | Restaurant info plus menus (as JSON), `claimed_at`, placeholder `stats` | read |
| `mealtree.item_overrides` | Per-dish owner edits: `sold_out`, `price` | read |
| `mealtree.owners` | Verified owner per restaurant: name, role, Google opt-in, SHA-256 hash of the claim token | none |

All writes go through `SECURITY DEFINER` functions: `claim_restaurant`, `owner_session`, `set_item_override`, `reset_overrides`, `request_google_link`. Row Level Security is on for every table, and anonymous users have no direct write grants. Claiming returns a random token that's kept in the owner's browser (only its hash is stored). Every other function checks it and only lets the owner edit their own restaurant.

- **Schema:** `supabase/migrations/20260926120000_mealtree_schema.sql`
- **Seed:** `supabase/seed.sql`, regenerated with `npm run db:seed-sql` from `src/data/restaurants.ts`. It's re-runnable (upsert by slug).
- The migration is deliberately **not** recorded in Ketticho's `supabase_migrations` history. Recording it there would make Ketticho's own `supabase db push` complain about unknown remote migrations. Apply mealtree SQL changes manually, or move to a dedicated project later.

**One-time setup:** in the Supabase dashboard, open Ketticho → *Project Settings → Data API → Exposed schemas* and add `mealtree`. Until then, the API returns "schema must be one of…" errors.

**Before real outreach:** verification in the claim flow is still a demo (any 6-digit code works), so anyone could claim an unclaimed restaurant first. Add real phone or email OTP inside `claim_restaurant` before you send restaurants the claim link.

## Not built yet (next steps)

- Real owner verification (SMS/email OTP), multiple owners per restaurant, and an audit log of edits.
- An ingestion pipeline: menu photo → OCR/LLM extraction → human QA → publish, with a `verifiedAt` date per menu.
- Real view and QR-scan analytics (`utm_source` is already on every share/QR link).
- Google Business Profile integration for owners who opt in during the claim flow.
