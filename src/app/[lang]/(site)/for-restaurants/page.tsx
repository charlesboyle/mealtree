import type { Metadata } from "next";
import { CheckIcon, MessageCircleIcon } from "lucide-react";
import { ButtonLink } from "@/components/marketing/button-link";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { OwnerInterestCta } from "@/components/marketing/owner-interest-cta";
import type { Locale } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { pageAlternates, social } from "@/lib/seo";

const content = {
  en: {
    metaTitle: "NOMM for restaurants",
    metaDescription:
      "Diners find your menu on NOMM and message you on WhatsApp. No commission. Claim your page, free for the first year.",
    badge: "Free for your first year",
    title: "Your menu and prices, searchable. Orders straight to your WhatsApp.",
    lead: "Diners find your menu and message you on WhatsApp. You pay no commission.",
    claim: "Claim this page",
    remove: "Ask us to remove it",
    howTitle: "How it works",
    steps: [
      {
        title: "We turn your menu into a fast, browsable page",
        body: "Your printed menu or PDF becomes a fast digital page, with clean, professional photos of your dishes that stay true to what is on your menu. We show the date it was last updated.",
      },
      {
        title: "Diners message you on WhatsApp",
        body: "They build a list on NOMM and open a WhatsApp chat with you, with the message already written out. To you it is just a customer messaging you.",
      },
      {
        title: "You stay in control",
        body: "Get in touch to keep your page accurate, or ask us to take it down. Either way, it is your call.",
      },
    ],
    compareTitle: "How we compare",
    compareCaption: "NOMM compared with delivery apps",
    oursHeading: "NOMM",
    theirsHeading: "Delivery apps",
    rows: [
      {
        label: "Menu prices",
        ours: "Same as on your menu",
        theirs: "Delivery-app prices can differ from in-store prices",
      },
      { label: "Commission", ours: "0%", theirs: "Varies by app" },
      {
        label: "Delivery fee",
        ours: "Restaurant-set",
        theirs: "Varies by app",
      },
    ],
    topic: "Topic",
    pricingTitle: "Pricing",
    price: "Free",
    pricingSummary:
      "Free for your first year, with no commission (0%).",
    features: [
      "Your menu, read from your printed menu or website",
      "WhatsApp, call and directions buttons on your page",
      "Orders arrive as WhatsApp messages, already written out",
      "We help you keep prices, hours and photos accurate",
    ],
  },
  ar: {
    metaTitle: "NOMM للمطاعم",
    metaDescription:
      "يجد الزوار قائمتك على NOMM ويراسلونك عبر واتساب. بلا عمولة. استلم صفحتك مجانًا للسنة الأولى.",
    badge: "مجاني للسنة الأولى",
    title: "قائمتك وأسعارك قابلة للبحث. والطلبات تصلك مباشرة على واتساب.",
    lead: "يجد الزوار قائمتك ويراسلونك عبر واتساب. لا تدفع أي عمولة.",
    claim: "المطالبة بهذه الصفحة",
    remove: "اطلب إزالتها",
    howTitle: "كيف يعمل",
    steps: [
      {
        title: "نحوّل قائمتك إلى صفحة رقمية سريعة",
        body: "تتحول قائمتك المطبوعة أو ملف PDF إلى صفحة رقمية سريعة وسهلة التصفح، مع صور احترافية للأطباق تبقى وفية لما في قائمتك. ونعرض تاريخ آخر تحديث.",
      },
      {
        title: "يراسلك الزوار عبر واتساب",
        body: "يجهّزون قائمة طلباتهم على NOMM ثم يفتحون محادثة واتساب معك والرسالة مكتوبة مسبقًا. بالنسبة لك هو عميل يراسلك كأي عميل.",
      },
      {
        title: "القرار بيدك",
        body: "تواصل معنا لتبقى صفحتك دقيقة، أو اطلب منّا إزالتها. في الحالتين القرار لك.",
      },
    ],
    compareTitle: "كيف نقارن بغيرنا",
    compareCaption: "مقارنة NOMM بتطبيقات التوصيل",
    oursHeading: "NOMM",
    theirsHeading: "تطبيقات التوصيل",
    rows: [
      {
        label: "أسعار القائمة",
        ours: "كما في قائمتك",
        theirs: "قد تختلف أسعار تطبيقات التوصيل عن أسعار المطعم",
      },
      { label: "العمولة", ours: "0٪", theirs: "تختلف حسب التطبيق" },
      {
        label: "رسوم التوصيل",
        ours: "يحددها المطعم",
        theirs: "تختلف حسب التطبيق",
      },
    ],
    topic: "الموضوع",
    pricingTitle: "الأسعار",
    price: "مجاني",
    pricingSummary:
      "مجاني للسنة الأولى، وبلا أي عمولة (0٪).",
    features: [
      "قائمتك مقروءة من قائمتك المطبوعة أو موقعك",
      "أزرار واتساب والاتصال والاتجاهات في صفحتك",
      "تصلك الطلبات رسائل واتساب مكتوبة جاهزة",
      "نساعدك على إبقاء الأسعار وساعات العمل والصور دقيقة",
    ],
  },
} satisfies Record<Locale, unknown>;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = content[locale];
  return { title: { absolute: c.metaTitle }, description: c.metaDescription, ...social(locale, c.metaTitle, c.metaDescription), alternates: pageAlternates(locale, "/for-restaurants") };
}

export default async function ForRestaurantsPage() {
  const { locale, href } = await getI18n();
  const c = content[locale];

  return (
    <main className="w-full">
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-fresh-soft px-3 py-1 text-xs font-semibold text-fresh">
            {c.badge}
          </span>
          <h1 className="mt-4 max-w-3xl text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-plum sm:text-[52px]">
            {c.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {c.lead}
          </p>
          <div id="interest" className="mt-8 flex scroll-mt-24 flex-wrap gap-3">
            <OwnerInterestCta autoOpen>{c.claim}</OwnerInterestCta>
            <ButtonLink href={href("/remove")} variant="secondary">
              {c.remove}
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section aria-labelledby="how-heading" className="py-12 sm:py-16">
          <h2
            id="how-heading"
            className="text-2xl font-bold tracking-[-0.02em] text-plum sm:text-3xl"
          >
            {c.howTitle}
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {c.steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-paper p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-tomato shadow-card">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-bold tracking-[-0.01em] text-plum">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="compare-heading" className="pb-12 sm:pb-16">
          <h2
            id="compare-heading"
            className="text-2xl font-bold tracking-[-0.02em] text-plum sm:text-3xl"
          >
            {c.compareTitle}
          </h2>
          <ComparisonTable
            caption={c.compareCaption}
            topic={c.topic}
            oursHeading={c.oursHeading}
            theirsHeading={c.theirsHeading}
            rows={c.rows}
          />
        </section>

        <section aria-labelledby="pricing-heading" className="pb-24">
          <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-float ring-1 ring-line/70 sm:p-10 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <h2 id="pricing-heading" className="text-lg font-bold text-plum">
                {c.pricingTitle}
              </h2>
              <p className="mt-2 text-5xl font-bold tracking-[-0.03em] text-plum">
                {c.price}
              </p>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted">
                {c.pricingSummary}
              </p>
              <OwnerInterestCta className="mt-6">
                <MessageCircleIcon className="h-4 w-4" aria-hidden />
                {c.claim}
              </OwnerInterestCta>
            </div>
            <ul className="space-y-3">
              {c.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-[15px] text-plum"
                >
                  <CheckIcon
                    className="mt-0.5 h-4 w-4 shrink-0 text-fresh"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
