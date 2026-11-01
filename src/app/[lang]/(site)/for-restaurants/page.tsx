import type { Metadata } from "next";
import { CheckIcon, MessageCircleIcon } from "lucide-react";
import { ButtonLink } from "@/components/marketing/button-link";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import type { Locale } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { pageAlternates } from "@/lib/seo";

const content = {
  en: {
    metaTitle: "nomm for restaurants",
    metaDescription:
      "Diners find your menu on nomm and message you on WhatsApp. No commission. Claim your page free during the beta.",
    badge: "Beta · free during the beta",
    title: "Get found by people nearby. Keep every order.",
    lead: "Diners find your menu and message you on WhatsApp. You pay no commission. Diners pay AED 1 per order.",
    claim: "Claim your page",
    remove: "Ask us to remove it",
    howTitle: "How it works",
    steps: [
      {
        title: "We read your public menu",
        body: "We take dishes, prices and contact details from your printed menu, website or PDF, and show the date we last checked it.",
      },
      {
        title: "Diners message you on WhatsApp",
        body: "They build a list on nomm and open a WhatsApp chat with you, with the message already written out. To you it is just a customer messaging you.",
      },
      {
        title: "You stay in control",
        body: "Claim your page for free to keep it accurate, or ask us to take it down. Either way, it is your call.",
      },
    ],
    compareTitle: "How we compare",
    compareCaption: "nomm compared with delivery apps",
    oursHeading: "nomm",
    theirsHeading: "Delivery apps",
    rows: [
      {
        label: "Menu prices",
        ours: "Same as on your menu",
        theirs: "Delivery-app prices can differ from in-store prices",
      },
      { label: "Service fee", ours: "AED 1 / order", theirs: "Varies by app" },
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
      "Free during the beta. Diners pay a AED 1 service fee per order, and we take no commission (0%).",
    features: [
      "Your menu, read from your printed menu or website",
      "WhatsApp, call and directions buttons on your page",
      "Orders arrive as WhatsApp messages, already written out",
      "Fix prices, hours and photos once you claim the page",
    ],
  },
  ar: {
    metaTitle: "nomm للمطاعم",
    metaDescription:
      "يجد الزوار قائمتك على nomm ويراسلونك عبر واتساب. بلا عمولة. طالب بصفحتك مجانًا خلال الفترة التجريبية.",
    badge: "تجريبي · مجاني خلال الفترة التجريبية",
    title: "يجدك من حولك. وتحتفظ بكل طلب.",
    lead: "يجد الزوار قائمتك ويراسلونك عبر واتساب. لا تدفع أي عمولة. يدفع الزائر 1 درهم عن كل طلب.",
    claim: "طالب بصفحتك",
    remove: "اطلب إزالتها",
    howTitle: "كيف يعمل",
    steps: [
      {
        title: "نقرأ قائمتك العامة",
        body: "نأخذ الأطباق والأسعار وبيانات التواصل من قائمتك المطبوعة أو موقعك أو ملف PDF، ونعرض تاريخ آخر تحقق منها.",
      },
      {
        title: "يراسلك الزوار عبر واتساب",
        body: "يجهّزون قائمة طلباتهم على nomm ثم يفتحون محادثة واتساب معك والرسالة مكتوبة مسبقًا. بالنسبة لك هو عميل يراسلك كأي عميل.",
      },
      {
        title: "القرار بيدك",
        body: "طالب بصفحتك مجانًا لتبقى دقيقة، أو اطلب منّا إزالتها. في الحالتين القرار لك.",
      },
    ],
    compareTitle: "كيف نقارن بغيرنا",
    compareCaption: "مقارنة nomm بتطبيقات التوصيل",
    oursHeading: "nomm",
    theirsHeading: "تطبيقات التوصيل",
    rows: [
      {
        label: "أسعار القائمة",
        ours: "كما في قائمتك",
        theirs: "قد تختلف أسعار تطبيقات التوصيل عن أسعار المطعم",
      },
      {
        label: "رسوم الخدمة",
        ours: "1 درهم / طلب",
        theirs: "تختلف حسب التطبيق",
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
      "مجاني خلال الفترة التجريبية. يدفع الزائر رسوم خدمة قدرها 1 درهم للطلب، ولا نأخذ أي عمولة (0٪).",
    features: [
      "قائمتك مقروءة من قائمتك المطبوعة أو موقعك",
      "أزرار واتساب والاتصال والاتجاهات في صفحتك",
      "تصلك الطلبات رسائل واتساب مكتوبة جاهزة",
      "عدّل الأسعار وساعات العمل والصور بعد أن تطالب بالصفحة",
    ],
  },
} satisfies Record<Locale, unknown>;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = content[locale];
  return { title: c.metaTitle, description: c.metaDescription, alternates: pageAlternates(locale, "/for-restaurants") };
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
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={href("/claim")}>{c.claim}</ButtonLink>
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
              <ButtonLink href={href("/claim")} className="mt-6">
                <MessageCircleIcon className="h-4 w-4" aria-hidden />
                {c.claim}
              </ButtonLink>
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
