import { getTranslations } from 'next-intl/server';
import { getDb } from '@/lib/db';
import { productCategories, categoryTranslations } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Mail, Phone, MapPin } from 'lucide-react';
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
    <div className="pt-20 md:pt-24">
      {/* Header */}
      <section className="bg-sand py-16 md:py-24">
        <div className="container-wide text-center">
          <h1 className="text-4xl md:text-6xl font-display font-medium">{t('title')}</h1>
          <div className="w-10 h-px bg-bronze mx-auto mt-6" />
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-20">
            {/* Form */}
            <div className="lg:col-span-2" data-reveal>
              <h2 className="text-2xl md:text-3xl font-display font-medium mb-2">{t('formTitle')}</h2>
              <div className="w-12 h-px bg-bronze mb-10" />
              <InquiryForm categories={categories} />
            </div>

            {/* Contact Info */}
            <div data-reveal>
              <h2 className="text-2xl md:text-3xl font-display font-medium mb-2">{t('info')}</h2>
              <div className="w-12 h-px bg-bronze mb-10" />

              <div className="space-y-0">
                <div className="flex items-start gap-5 py-6 border-b border-warm-border">
                  <div className="w-10 h-10 border border-warm-border flex items-center justify-center flex-shrink-0">
                    <Mail className="text-bronze" size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-2">
                      {t('emailLabel')}
                    </p>
                    <a href="mailto:bolen5@cnjxctm.com" className="text-sm font-body text-ink hover:text-bronze transition-colors">
                      bolen5@cnjxctm.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5 py-6 border-b border-warm-border">
                  <div className="w-10 h-10 border border-warm-border flex items-center justify-center flex-shrink-0">
                    <Phone className="text-bronze" size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-2">
                      {t('whatsappLabel')}
                    </p>
                    <a href="https://wa.me/8617860567239" target="_blank" rel="noopener noreferrer" className="text-sm font-body text-ink hover:text-bronze transition-colors">
                      +86 17860567239
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5 py-6">
                  <div className="w-10 h-10 border border-warm-border flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-bronze" size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-2">
                      {t('addressLabel')}
                    </p>
                    <p className="text-sm font-body text-ink-mid leading-relaxed">
                      No.768, Xinda Road, Xinfeng Town, Nanhu District, Jiaxing, Zhejiang, China
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
