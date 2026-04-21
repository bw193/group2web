import { getTranslations } from 'next-intl/server';
import { getDb } from '@/lib/db';
import { productCategories, categoryTranslations } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import InquiryForm from '@/components/public/InquiryForm';

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
    <>
      {/* Intro */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-16 pb-16 md:pt-20 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="kicker-plain mb-6" data-reveal>
                <span className="text-bronze mr-3">— Inquiries</span>
                {t('info')}
              </p>
              <h1
                className="font-display text-5xl md:text-6xl lg:text-[80px] font-light text-ink leading-[0.98] tracking-[-0.02em]"
                data-reveal
              >
                {t('title')}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-right" data-reveal>
              <p className="text-[15px] font-body font-light text-ink-mid leading-[1.85] max-w-sm lg:ml-auto">
                Share project details, and our export team will reply within a single business day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-cream">
        <div className="container-wide py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20">
            {/* Form */}
            <div className="lg:col-span-7" data-reveal>
              <p className="kicker-plain mb-4">
                <span className="text-bronze mr-3">01</span>
                {t('formTitle')}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light text-ink tracking-[-0.015em] mb-10">
                Tell us about the <span className="italic font-extralight">project.</span>
              </h2>
              <InquiryForm categories={categories} />
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-warm-border" data-reveal>
              <p className="kicker-plain mb-4">
                <span className="text-bronze mr-3">02</span>
                Direct contact
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light text-ink tracking-[-0.015em] mb-10">
                Reach out <span className="italic font-extralight">directly.</span>
              </h2>

              <dl className="border-t border-warm-border">
                <div className="grid grid-cols-[100px_1fr] gap-4 py-5 border-b border-warm-border">
                  <dt className="text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase pt-1">
                    {t('emailLabel')}
                  </dt>
                  <dd>
                    <a href="mailto:bolen5@cnjxctm.com" className="text-[16px] font-body font-light text-ink hover:text-bronze transition-colors border-b border-warm-border hover:border-bronze pb-0.5">
                      bolen5@cnjxctm.com
                    </a>
                  </dd>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 py-5 border-b border-warm-border">
                  <dt className="text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase pt-1">
                    {t('whatsappLabel')}
                  </dt>
                  <dd>
                    <a
                      href="https://wa.me/8617860567239"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[16px] font-body font-light text-ink hover:text-bronze transition-colors border-b border-warm-border hover:border-bronze pb-0.5"
                    >
                      +86 178 6056 7239
                    </a>
                  </dd>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 py-5 border-b border-warm-border">
                  <dt className="text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase pt-1">
                    {t('addressLabel')}
                  </dt>
                  <dd className="text-[15px] font-body font-light text-ink-mid leading-[1.75]">
                    No. 768 Xinda Road,<br />
                    Xinfeng Town, Nanhu District,<br />
                    Jiaxing, Zhejiang, China
                  </dd>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 py-5">
                  <dt className="text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase pt-1">
                    Hours
                  </dt>
                  <dd className="text-[15px] font-body font-light text-ink-mid leading-[1.75]">
                    Mon–Sat, 09:00–18:00 CST<br />
                    <span className="text-ink-light">(GMT+8)</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
