# mealtree

Menu pages for restaurants, like Linktree but for menus: mobile-first, searchable, with prices and photos. The MVP runs on placeholder data for 8 fictional restaurants in SF's Mission District.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # every page is prerendered as static HTML
npm run lint
```

Set `NEXT_PUBLIC_SITE_URL` in production so canonical and Open Graph URLs resolve.

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

- **Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Motion.** All routes are static (SSG), so menu pages are fast and indexable.
- **Data**: `src/data/restaurants.ts` (typed in `src/lib/types.ts`). Swap this for a database (e.g. Supabase) when there's a backend. Views and other stats are deterministic mock numbers from `src/data/helpers.ts`.
- **Brand color**: each restaurant has one `accent` hex. `src/lib/accent.ts` derives light/dark variants and a readable text color, applied through `[data-accent]` CSS variables.
- **Owner edits** (claim, sold-out, price) are saved in `localStorage` (`src/lib/store.ts`), and the public menu reads the same store. That lets you demo the full loop in one browser: claim → edit in the dashboard → see it live. Replace this with API calls when there's a backend.
- **Search** (`src/lib/search.ts`): accent-insensitive word-prefix matching, understands budget phrases ("under $15"), and knows a few craving synonyms ("noodles" → ramen, pho, pasta).
- **Photos** come from Unsplash by photo id (`photoUrl` in `src/lib/format.ts`). Missing or broken images fall back to a tile tinted with the restaurant's color, so text-only menus still look intentional.
- Supports light and dark mode and `prefers-reduced-motion`. Layouts are checked at 390px and desktop widths.

## Not built yet (next steps)

- A real backend and auth (owner accounts, real SMS/email verification, audit log of edits).
- An ingestion pipeline: menu photo → OCR/LLM extraction → human QA → publish, with a `verifiedAt` date per menu.
- Real view and QR-scan analytics (`utm_source` is already on every share/QR link).
- Google Business Profile integration for owners who opt in during the claim flow.
