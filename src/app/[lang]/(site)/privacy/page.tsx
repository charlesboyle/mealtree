import type { Metadata } from "next";
import { LegalShell, Prose } from "@/components/legal/legal-shell";
import { getI18n } from "@/i18n/server";
import { pageAlternates, social } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t.meta.privacy, ...social(locale, `${t.meta.privacy} · NOMM`, t.meta.description), alternates: pageAlternates(locale, "/privacy") };
}

export default async function PrivacyPage() {
  const { locale } = await getI18n();
  if (locale === "ar") {
    return (
      <LegalShell title="الخصوصية" lead="ما الذي نجمعه ولماذا. آخر تحديث: نوفمبر 2026.">
        <Prose>
          <h2>الزوار</h2>
          <p>
            لا تحتاج إلى حساب لتصفّح القوائم. إن قسنا مشاهدات الصفحات أو مسح رموز QR، فنقيسها بشكل إجمالي لنُري المطاعم
            عدد مرات مشاهدة قوائمها. لا نبيع البيانات الشخصية ولا نعرض إعلانات.
          </p>
          <h2>المطاعم المحفوظة وقائمة الطلب</h2>
          <p>
            تُحفظ المطاعم التي تحفظها وقائمة الطلب التي تجهّزها في متصفحك فقط، على جهازك، ولا نحتاج إلى حساب. يمكنك
            مسحها في أي وقت بمسح بيانات الموقع من إعدادات المتصفح.
          </p>
          <h2>الطلب عبر واتساب</h2>
          <p>
            عند الضغط على زر واتساب تُفتح محادثة مع المطعم برسالة مكتوبة مسبقًا من قائمتك. تذهب هذه الرسالة إلى واتساب
            وإلى المطعم مباشرة، ولا نراها ولا نخزّن الطلبات. يخضع ما يحدث في واتساب لسياسة خصوصية واتساب.
          </p>
          <h2>التحليلات</h2>
          <p>
            نستخدم أدوات تحليلات، منها تسجيلات مجهولة للجلسات عبر PostHog، لنفهم كيف يُستخدم الموقع ونحسّنه. نُخفي ما يُكتب في
            النماذج، ولا نستخدم هذه البيانات للإعلانات. تمرّ بيانات التحليلات عبر PostHog وشركائه في البنية التحتية، وقد تُوجَّه
            حركة البيانات عبر Cloudflare.
          </p>
          <h2>أصحاب المطاعم</h2>
          <p>
            عند المطالبة بصفحة نحفظ اسمك ودورك وطريقة التحقق التي اخترتها. يحتفظ متصفحك بمفتاح خاص يتيح له تعديل قائمتك،
            ولا نخزّن منه إلا بصمة أحادية الاتجاه. نستخدم بيانات التواصل فقط للتحقق منك والرد بشأن صفحتك.
            تُحفظ بيانات التواصل التي ترسلها عبر نموذج «أدِر هذه القائمة» لدى مزوّد التحليلات PostHog (الاتحاد الأوروبي)، ولا نستخدمها إلا للتحقق من نشاطك التجاري.
          </p>
          <h2>قوائم الطعام التي يرسلها أصحاب المطاعم</h2>
          <p>
            عند إرسال قائمتك عبر نموذج «احصل على قائمتك الرقمية مجانًا»، نحفظ ملفات القائمة ورقم هاتفك وبقية بياناتك بشكل خاص
            لدى Supabase، ولا يطّلع عليها إلا فريقنا. نستخدمها فقط لبناء صفحتك والتواصل معك بشأنها.
          </p>
          <h2>طلبات الإزالة</h2>
          <p>نحتفظ بالاسم ووسيلة التواصل اللذين تقدّمهما لتأكيد الإزالة، ثم نحتفظ بسجل حتى لا تُدرج الصفحة مجددًا.</p>
          <h2>مزوّدو الخدمة</h2>
          <p>
            تُخزَّن القوائم لدى Supabase وتُقدَّم عبر Vercel، وتعالج PostHog التحليلات. قد تُعالَج صور القوائم التي نجمعها بواسطة Claude من Anthropic
            لنسخ محتواها، ولا تُستخدم الصور للتعرّف على الأشخاص.
          </p>
        </Prose>
      </LegalShell>
    );
  }
  return (
    <LegalShell title="Privacy" lead="What we collect, and why. Last updated November 2026.">
      <Prose>
        <h2>Diners</h2>
        <p>
          You don&apos;t need an account to browse menus. If we measure page views or QR scans, we do it in aggregate,
          to show restaurants how often their menu is seen. We don&apos;t sell personal data or show ads.
        </p>
        <h2>Saved restaurants and your order list</h2>
        <p>
          The restaurants you save and the order list you build are stored only in your browser, on your device. We
          don&apos;t need an account for this. You can clear them at any time by clearing the site&apos;s data in your
          browser settings.
        </p>
        <h2>Ordering over WhatsApp</h2>
        <p>
          When you tap the WhatsApp button, a chat with the restaurant opens with a message drafted from your list. That
          message goes to WhatsApp and the restaurant directly. We never see or store orders. What happens in WhatsApp is
          covered by WhatsApp&apos;s own privacy policy.
        </p>
        <h2>Analytics</h2>
        <p>
          We use analytics tools, including anonymous session recordings (via PostHog), to understand how the site is used and to
          improve it. Text typed into forms is masked, and we don&apos;t use this data for advertising. Analytics go through
          PostHog and its infrastructure partners, and traffic may be routed via Cloudflare.
        </p>
        <h2>Restaurant owners</h2>
        <p>
          When you claim a page we store your name, role, and how you asked to be verified. Your browser keeps a private
          key that lets it edit your menu; we store only a one-way hash of it. We use your contact details only to verify
          you and to reply about your listing. Contact details you submit through the &ldquo;Manage this menu&rdquo; form
          are stored with our analytics provider, PostHog (EU), and used only to verify your business.
        </p>
        <h2>Menus sent by restaurant owners</h2>
        <p>
          When you send your menu through the &ldquo;Get your digital menu for free&rdquo; form, we store the menu files,
          your phone number and the other details privately with Supabase, where only our team can see them. We use them
          only to build your page and to contact you about it.
        </p>
        <h2>Takedown requests</h2>
        <p>
          We keep the name and contact you give us to confirm the removal, then keep a record so the page isn&apos;t
          re-listed.
        </p>
        <h2>Service providers</h2>
        <p>
          Menus are stored with Supabase and served by Vercel, and PostHog processes analytics. Menu photos we collect may be processed by Anthropic&apos;s
          Claude to transcribe them; photos aren&apos;t used to identify people.
        </p>
      </Prose>
    </LegalShell>
  );
}
