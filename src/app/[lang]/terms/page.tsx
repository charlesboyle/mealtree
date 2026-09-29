import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Prose } from "@/components/legal/legal-shell";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.terms };
}

export default async function TermsPage() {
  const { locale, href } = await getI18n();
  if (locale === "ar") {
    return (
      <LegalShell title="شروط الاستخدام" lead="شروط بلغة واضحة للزوار والمطاعم. آخر تحديث: سبتمبر 2026.">
        <Prose>
          <h2>ما هو nomm</h2>
          <p>
            ينشر nomm قوائم طعام المطاعم ليطّلع الزوار على الأطباق والأسعار قبل زيارتهم. نجمع القوائم من زيارات
            شخصية، وصور القوائم المنشورة، ومواقع المطاعم، ومن أصحاب المطاعم أنفسهم.
          </p>
          <h2>قد تكون القوائم قديمة</h2>
          <p>
            ما لم تذكر الصفحة أن المطعم يديرها، فهي نسخة غير رسمية. تعرض كل صفحة تاريخ آخر تحقق منها. قد تتغير الأسعار
            وتوفّر الأطباق والمعلومات الغذائية، لذا تأكد دائمًا من المطعم، خاصةً بشأن الحساسية.
          </p>
          <h2>لسنا تابعين للمطاعم المدرجة</h2>
          <p>
            نستخدم أسماء المطاعم لتعريفها فقط. إدراج مطعم لا يعني أنه يؤيد nomm إلى أن يطالب بصفحته.
          </p>
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
    <LegalShell title="Terms of use" lead="Plain-language terms for diners and restaurants. Last updated September 2026.">
      <Prose>
        <h2>What nomm is</h2>
        <p>
          nomm publishes restaurant menus so diners can check dishes and prices before they visit. Menus come from
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
          nomm until it claims its page.
        </p>
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
