import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Prose } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalShell title="Terms of use" lead="Plain-language terms for diners and restaurants. Last updated September 2026.">
      <Prose>
        <h2>What mealtree is</h2>
        <p>
          mealtree publishes restaurant menus so diners can check dishes and prices before they visit. Menus come from
          in-person visits, public menu photos, restaurant websites, and restaurant owners.
        </p>
        <h2>Menus can be out of date</h2>
        <p>
          Unless a page says it&apos;s managed by the restaurant, it&apos;s an unofficial copy. Each page shows when it
          was last verified. Prices, availability, and dietary details can change. Always confirm with the restaurant,
          especially for allergies.
        </p>
        <h2>We&apos;re not affiliated with listed restaurants</h2>
        <p>
          Restaurant names are used only to identify the restaurant. A listing doesn&apos;t mean the restaurant endorses
          mealtree until it claims its page.
        </p>
        <h2>For restaurants</h2>
        <ul>
          <li>Claiming your page is free. We verify every claim by calling the number on your public listing.</li>
          <li>You&apos;re responsible for what you publish once your page is claimed.</li>
          <li>
            Don&apos;t want to be listed? <Link href="/remove">Ask us to take your page down</Link> and we will.
          </li>
        </ul>
        <h2>Reporting problems</h2>
        <p>Use &ldquo;Wrong info?&rdquo; on any dish to flag a price or description, and we&apos;ll re-verify it.</p>
      </Prose>
    </LegalShell>
  );
}
