import type { Metadata } from "next";
import { CheckIcon, MessageCircleMoreIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/marketing/button-link";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { OwnerInterestCta } from "@/components/marketing/owner-interest-cta";
import { MenuFormButton } from "@/components/menu-submission-form";
import type { Locale } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { pageAlternates, social } from "@/lib/seo";
import { ownerWhatsAppUrl } from "@/lib/surveys";

const content = {
  en: {
    metaTitle: "Get your digital menu for free · NOMM for restaurants",
    metaDescription:
      "Send us your menu and we build your NOMM page for free. Diners find your dishes and prices and order on your WhatsApp. No commission.",
    badge: "Free · No commission",
    title: "Get your digital menu for free",
    lead: "Send us your menu as photos or a PDF. We turn it into a NOMM page diners can search, and they order straight on your WhatsApp.",
    send: "Send your menu",
    whatsapp: "Send it on WhatsApp",
    heroNote: "Takes a minute. We message you on WhatsApp when your page is ready.",
    howTitle: "How it works",
    steps: [
      {
        title: "Send your menu",
        body: "Upload photos or a PDF of your printed menu here, or send them to us on WhatsApp. That's all we need.",
      },
      {
        title: "We build your page",
        body: "Your menu becomes a fast digital page, with clean, professional photos of your dishes that stay true to what is on your menu. We show the date it was last updated.",
      },
      {
        title: "Diners message you on WhatsApp",
        body: "They build a list on NOMM and open a WhatsApp chat with you, with the message already written out. To you it is just a customer messaging you.",
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
    pricingSummary: "Your digital menu is free for your first year, with no commission (0%).",
    pricingCta: "Get your free menu",
    features: [
      "Your menu, built from your photos or PDF",
      "WhatsApp, call and directions buttons on your page",
      "Orders arrive as WhatsApp messages, already written out",
      "We help you keep prices, hours and photos accurate",
    ],
    claimTitle: "Already on NOMM?",
    claimBody:
      "If your restaurant already has a page, claim it to keep prices, hours and photos accurate. Or ask us to take it down: it's your call.",
    claim: "Claim this page",
    remove: "Ask us to remove it",
  },
  ar: {
    metaTitle: "احصل على قائمتك الرقمية مجانًا · NOMM للمطاعم",
    metaDescription:
      "أرسل لنا قائمتك ونبني صفحة مطعمك على NOMM مجانًا. يجد الزوار أطباقك وأسعارك ويطلبون عبر واتساب. بلا عمولة.",
    badge: "مجاني · بلا عمولة",
    title: "احصل على قائمتك الرقمية مجانًا",
    lead: "أرسل لنا قائمتك صورًا أو ملف PDF، ونحوّلها إلى صفحة على NOMM يبحث فيها الزوار، ويطلبون منك مباشرة عبر واتساب.",
    send: "أرسل قائمتك",
    whatsapp: "أرسلها على واتساب",
    heroNote: "يستغرق الأمر دقيقة. نراسلك على واتساب عندما تصبح صفحتك جاهزة.",
    howTitle: "كيف يعمل",
    steps: [
      {
        title: "أرسل قائمتك",
        body: "ارفع صور قائمتك المطبوعة أو ملف PDF هنا، أو أرسلها لنا على واتساب. هذا كل ما نحتاجه.",
      },
      {
        title: "نبني صفحتك",
        body: "تتحول قائمتك إلى صفحة رقمية سريعة وسهلة التصفح، مع صور احترافية للأطباق تبقى وفية لما في قائمتك. ونعرض تاريخ آخر تحديث.",
      },
      {
        title: "يراسلك الزوار عبر واتساب",
        body: "يجهّزون قائمة طلباتهم على NOMM ثم يفتحون محادثة واتساب معك والرسالة مكتوبة مسبقًا. بالنسبة لك هو عميل يراسلك كأي عميل.",
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
    pricingSummary: "قائمتك الرقمية مجانية للسنة الأولى، وبلا أي عمولة (0٪).",
    pricingCta: "احصل على قائمتك مجانًا",
    features: [
      "قائمتك مبنية من صورك أو ملف PDF",
      "أزرار واتساب والاتصال والاتجاهات في صفحتك",
      "تصلك الطلبات رسائل واتساب مكتوبة جاهزة",
      "نساعدك على إبقاء الأسعار وساعات العمل والصور دقيقة",
    ],
    claimTitle: "مطعمك موجود على NOMM؟",
    claimBody: "إن كانت لمطعمك صفحة بالفعل، فاطلب إدارتها لتبقى الأسعار وساعات العمل والصور دقيقة. أو اطلب منّا إزالتها، فالقرار لك.",
    claim: "المطالبة بهذه الصفحة",
    remove: "اطلب إزالتها",
  },
} satisfies Record<Locale, unknown>;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = content[locale];
  return { title: { absolute: c.metaTitle }, description: c.metaDescription, ...social(locale, c.metaTitle, c.metaDescription), alternates: pageAlternates(locale, "/for-restaurants") };
}

export default async function ForRestaurantsPage() {
  const { locale, href, t } = await getI18n();
  const c = content[locale];
  const whatsappHref = ownerWhatsAppUrl(t.menuForm.whatsappMessage(""));

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
            <MenuFormButton source="for_restaurants" className={buttonStyles("primary")}>
              <UploadIcon className="h-4 w-4" aria-hidden />
              {c.send}
            </MenuFormButton>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonStyles("secondary")}>
              <MessageCircleMoreIcon className="h-4 w-4 text-whatsapp" aria-hidden />
              {c.whatsapp}
            </a>
          </div>
          <p className="mt-4 max-w-xl text-sm text-muted">{c.heroNote}</p>
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

        <section aria-labelledby="pricing-heading" className="pb-12 sm:pb-16">
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
              <MenuFormButton source="for_restaurants" className={buttonStyles("primary", "mt-6")}>
                <UploadIcon className="h-4 w-4" aria-hidden />
                {c.pricingCta}
              </MenuFormButton>
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

        <section id="interest" aria-labelledby="claim-heading" className="scroll-mt-24 pb-24">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-line/70 sm:p-8">
            <h2 id="claim-heading" className="text-lg font-bold text-plum">
              {c.claimTitle}
            </h2>
            <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted">{c.claimBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <OwnerInterestCta autoOpen variant="secondary">
                {c.claim}
              </OwnerInterestCta>
              <Link
                href={href("/remove")}
                className="inline-flex h-12 items-center px-2 text-[15px] font-medium text-muted underline decoration-dashed decoration-1 underline-offset-4 transition-colors duration-150 hover:text-plum"
              >
                {c.remove}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
