"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";

/** The business promise, stated once on the landing page as plain facts. */
export function FairPromise() {
  const { t, href } = useI18n();
  const f = t.site.fair;
  return (
    <section aria-labelledby="fair-heading" className="mt-8 grid gap-8 rounded-3xl bg-paper p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <div>
        <h2 id="fair-heading" className="max-w-sm text-2xl font-bold leading-tight tracking-[-0.02em] text-plum sm:text-[28px]">
          {f.title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">{f.body}</p>
        <Link
          href={href("/for-restaurants")}
          className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-plum underline-offset-4 hover:underline"
        >
          {f.link}
          <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
        </Link>
      </div>
      <dl className="space-y-1 self-center">
        {f.rows.map((p) => (
          <div key={p.label} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-3 sm:px-4">
            <dt className="text-sm text-muted">{p.label}</dt>
            <dd className="flex shrink-0 items-center gap-2 text-end text-sm font-semibold text-plum">
              {p.ours}
              <Check className="h-4 w-4 shrink-0 text-fresh" strokeWidth={2.5} aria-hidden />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
