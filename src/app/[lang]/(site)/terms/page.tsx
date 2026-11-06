import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Prose } from "@/components/legal/legal-shell";
import { getI18n } from "@/i18n/server";
import { pageAlternates, social } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t.meta.terms, ...social(locale, `${t.meta.terms} · NOMM`, t.meta.description), alternates: pageAlternates(locale, "/terms") };
}

export default async function TermsPage() {
  const { locale, href } = await getI18n();
  if (locale === "ar") {
    return (
      <LegalShell title="شروط الاستخدام" lead="شروط بلغة واضحة للزوار والمطاعم. آخر تحديث: أكتوبر 2026.">
        <Prose>
          <h2>ما هو NOMM</h2>
          <p>
            ينشر NOMM قوائم طعام المطاعم ليطّلع الزوار على الأطباق والأسعار قبل زيارتهم. نجمع القوائم من زيارات
            شخصية، وصور القوائم المنشورة، ومواقع المطاعم، ومن أصحاب المطاعم أنفسهم.
          </p>
          <h2>قد تكون القوائم قديمة</h2>
          <p>
            ما لم تذكر الصفحة أن المطعم يديرها، فهي نسخة غير رسمية. تعرض كل صفحة تاريخ آخر تحقق منها. قد تتغير الأسعار
            وتوفّر الأطباق والمعلومات الغذائية، لذا تأكد دائمًا من المطعم، خاصةً بشأن الحساسية.
          </p>
          <h2>لسنا تابعين للمطاعم المدرجة</h2>
          <p>
            نستخدم أسماء المطاعم لتعريفها فقط. إدراج مطعم لا يعني أنه يؤيد NOMM إلى أن يطالب بصفحته.
          </p>
          <h2>الطلب عبر واتساب</h2>
          <ul>
            <li>الطلب اتفاق بينك وبين المطعم عبر واتساب. NOMM ليس طرفًا في عملية البيع ولا يتسلّم أي مدفوعات.</li>
            <li>تأتي الأسعار من قائمة المطعم، وقد تختلف عمّا يطلبه المطعم فعليًا أو تكون قديمة. يؤكد المطعم السعر النهائي.</li>
            <li>توفّر الأطباق والتحضير والتوصيل أو الاستلام مسؤولية المطعم وحده.</li>
          </ul>
          <h2>للمطاعم</h2>
          <ul>
            <li>المطالبة بصفحتك مجانية. نتحقق من كل طلب بالاتصال بالرقم المسجّل في صفحتك العامة.</li>
            <li>بعد المطالبة بصفحتك، تكون مسؤولًا عمّا تنشره فيها.</li>
            <li>
              لا تريد أن تكون مدرجًا؟ <Link href={href("/remove")}>اطلب منّا إزالة صفحتك</Link> وسنفعل.
            </li>
          </ul>
          <h2>الإبلاغ عن مشكلة</h2>
          <p>استخدم «معلومة خاطئة؟» في أي طبق للإبلاغ عن سعر أو وصف، وسنتحقق منه مجددًا.</p>
        </Prose>
      </LegalShell>
    );
  }
  return (
    <LegalShell title="Terms of use" lead="Plain-language terms for diners and restaurants. Last updated October 2026.">
      <Prose>
        <h2>What NOMM is</h2>
        <p>
          NOMM publishes restaurant menus so diners can check dishes and prices before they visit. Menus come from
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
          NOMM until it claims its page.
        </p>
        <h2>Ordering over WhatsApp</h2>
        <ul>
          <li>
            An order is an arrangement between you and the restaurant over WhatsApp. NOMM is not a party to the sale and
            does not take payment.
          </li>
          <li>
            Prices come from the restaurant&apos;s menu. They may differ from what the restaurant charges or be out of
            date, and the restaurant confirms the final price.
          </li>
          <li>Availability, preparation, and delivery or pickup are the restaurant&apos;s responsibility.</li>
        </ul>
        <h2>For restaurants</h2>
        <ul>
          <li>Claiming your page is free. We verify every claim by calling the number on your public listing.</li>
          <li>You&apos;re responsible for what you publish once your page is claimed.</li>
          <li>
            Don&apos;t want to be listed? <Link href={href("/remove")}>Ask us to take your page down</Link> and we will.
          </li>
        </ul>
        <h2>Reporting problems</h2>
        <p>Use &ldquo;Wrong info?&rdquo; on any dish to flag a price or description, and we&apos;ll re-verify it.</p>
      </Prose>
    </LegalShell>
  );
}
