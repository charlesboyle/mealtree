# nomm: every menu in Dubai, searchable

*Working name. One page, September 2026.*

## Problem

Diners in the UAE decide where to eat from Google Maps and Instagram, but most restaurants there have no usable menu online: a blurry photo at best, often none, rarely with current prices and almost never in both Arabic and English. Delivery apps have menus but charge different prices and don't help people who want to walk in. Restaurants lose guests at the "what do they serve, and how much?" step, and most have no simple way to fix it.

## Solution

One clean, fast menu page per restaurant (like Linktree, but for menus), in English and Arabic, with prices in AED and photos where they exist. Diners can search across every restaurant by dish and budget ("shawarma under 15", "برياني أقل من 30 درهم"). Owners claim their page for free to edit prices, mark dishes sold out, get table QR codes, and see how many people looked.

## How it grows (the GTM loop)

1. **We build the page first.** From in-person visits and menu photos, read by Claude and checked by a person before publishing.
2. **Diners find it.** Search results in both languages, table QR codes, and links shared in UAE food communities.
3. **We tell the owner** on WhatsApp, in Arabic and English: *"X people viewed your menu this month. Claim it for free."* The numbers are real, tracked per page and per channel.
4. **The owner claims it** and opts in to having the menu link added to their Google Business Profile. That link drives more views, which makes the next message stronger.

## Why the UAE first

- Dense, menu-hungry dining scene with a huge long tail of independent restaurants (Karama, Satwa, Deira).
- Bilingual by default: Arabic and English support is a real edge over generic menu builders.
- WhatsApp is how businesses talk here, so outreach and verification can happen where owners already are.
- High smartphone and QR-code habits since 2020.

## What exists today

Bilingual (RTL) public menu pages, cross-restaurant dish search, claim flow, owner dashboard with real analytics (views, QR scans, link clicks, top dishes, traffic sources), inline price and sold-out editing, QR codes, takedown requests, and an admin tool that turns menu photos into structured menus with Claude. Live at nomm-zeta.vercel.app. Built on Next.js, Supabase and Vercel.

## The test (next 2 weeks)

**Scope:** 50 real restaurants in one neighbourhood, photographed in person.

| Metric | What it tells us | Promising if |
| --- | --- | --- |
| Views per page per week | Is there diner demand? | ≥ 20 |
| Outreach → reply rate | Do owners care? | ≥ 30% |
| Reply → claim rate | Is "free + your numbers" enough? | ≥ 40% |
| Claims that add the Google menu link | Does the growth loop close? | ≥ 50% |
| Claimed owners who edit within 7 days | Will they keep it accurate? | ≥ 30% |

## Business model (later, not part of the test)

Free forever to claim and edit. Paid tier for multi-branch groups, deeper analytics, promoted dishes, and WhatsApp or pickup ordering. Possible data and API revenue from the most complete, current menu dataset in the region.

## Key risks

- **Accuracy:** unclaimed prices go stale. Mitigated by visible "checked on" dates, a "wrong info?" report button, and re-verification.
- **Owner pushback on unsolicited pages:** one-tap takedown, and we never list a restaurant again after a removal request.
- **Distribution:** without Google menu links, traffic depends on search and communities. This is the main thing the test measures.
- **Verification:** claims are confirmed by calling the number on the Google listing for now. Automated WhatsApp codes come next.
