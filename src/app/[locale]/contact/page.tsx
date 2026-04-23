import { getTranslations } from 'next-intl/server';
import { getDb } from '@/lib/db';
import { productCategories, categoryTranslations } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import InquiryForm from '@/components/public/InquiryForm';
import { Mail, MessageCircle, MapPin } from 'lucide-react';

export const revalidate = 600;

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('contact');
  const db = getDb();

  const allCats = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.isActive, true))
    .orderBy(productCategories.displayOrder);

  const catIds = allCats.map((c) => c.id);
  const [catTrans, catTransEn] = catIds.length
    ? await Promise.all([
        db
          .select()
          .from(categoryTranslations)
          .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, locale))),
        locale !== 'en'
          ? db
              .select()
              .from(categoryTranslations)
              .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, 'en')))
          : Promise.resolve([]),
      ])
    : [[], []];

  const transMap = new Map(catTrans.map((t) => [t.categoryId, t]));
  const transEnMap = new Map(catTransEn.map((t) => [t.categoryId, t]));

  const categories = allCats.map((cat) => ({
    id: cat.id,
    name: transMap.get(cat.id)?.name || transEnMap.get(cat.id)?.name || `Category ${cat.id}`,
  }));

  return (
    <section className="bg-cream">
      <div className="container-narrow pt-16 pb-24 md:pt-20 md:pb-32">
        {/* Header — one line, readable, no decorative chrome */}
        <header className="mb-14 md:mb-16">
          <p className="text-[13px] font-body font-medium text-bronze uppercase tracking-[0.18em] mb-5">
            Contact
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] font-normal text-ink tracking-[-0.02em] leading-[1.05]">
            Send us an inquiry
          </h1>
          <p className="mt-5 text-[17px] md:text-[18px] font-body font-normal text-ink leading-[1.6] max-w-2xl">
            Share your project details and our export team will reply within one business day.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-8">
            <InquiryForm categories={categories} />
          </div>

          {/* Direct contact — simple, readable, no vertical rule or quote */}
          <aside className="lg:col-span-4">
            <div className="bg-sand p-6 md:p-7">
              <h2 className="font-display text-[24px] font-normal text-ink mb-6">
                Prefer a direct line?
              </h2>

              <ul className="space-y-5">
                <ContactRow
                  icon={<Mail size={18} strokeWidth={1.75} />}
                  label="Email"
                  value="bolen5@cnjxctm.com"
                  href="mailto:bolen5@cnjxctm.com"
                />
                <ContactRow
                  icon={<MessageCircle size={18} strokeWidth={1.75} />}
                  label="WhatsApp"
                  value="+86 178 6056 7239"
                  href="https://wa.me/8617860567239"
                  external
                />
                <ContactRow
                  icon={<MapPin size={18} strokeWidth={1.75} />}
                  label="Address"
                  value={
                    <>
                      No. 768 Xinda Road,<br />
                      Xinfeng Town, Nanhu District,<br />
                      Jiaxing, Zhejiang, China
                    </>
                  }
                />
              </ul>

              <p className="mt-7 pt-5 border-t border-warm-border text-[14px] font-body text-ink">
                <span className="font-medium">Hours:</span>{' '}
                <span className="text-ink-mid">Mon&ndash;Sat, 09:00&ndash;18:00 (GMT+8)</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ----- Direct-contact row: icon + label + value, all readable ----- */
function ContactRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="shrink-0 mt-0.5 text-bronze">{icon}</span>
      <div>
        <p className="text-[12px] font-body font-medium text-ink-mid uppercase tracking-[0.1em] mb-1">
          {label}
        </p>
        <p className="text-[15px] font-body text-ink leading-[1.55]">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="flex items-start gap-3 hover:text-bronze transition-colors"
        >
          {content}
        </a>
      </li>
    );
  }
  return <li className="flex items-start gap-3">{content}</li>;
}
