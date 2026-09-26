import type { Metadata } from "next";
import { LegalShell, Prose } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy" lead="What we collect, and why. Last updated September 2026.">
      <Prose>
        <h2>Diners</h2>
        <p>
          You don&apos;t need an account to browse menus. If we measure page views or QR scans, we do it in
          aggregate, to show restaurants how often their menu is seen. We don&apos;t sell personal data or show ads.
        </p>
        <h2>Restaurant owners</h2>
        <p>
          When you claim a page we store your name, role, and how you asked to be verified. Your browser keeps a private
          key that lets it edit your menu; we store only a one-way hash of it. We use your contact details only to
          verify you and to reply about your listing.
        </p>
        <h2>Takedown requests</h2>
        <p>We keep the name and contact you give us to confirm the removal, then keep a record so the page isn&apos;t re-listed.</p>
        <h2>Service providers</h2>
        <p>
          Menus are stored with Supabase and served by Vercel. Menu photos we collect may be processed by Anthropic&apos;s
          Claude to transcribe them; photos aren&apos;t used to identify people.
        </p>
      </Prose>
    </LegalShell>
  );
}
