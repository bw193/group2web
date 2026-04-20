import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import { aboutPage, aboutGallery } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUploadUrl } from '@/lib/utils';

export const revalidate = 600;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('about');
  const db = getDb();

  let [about] = await db.select().from(aboutPage).where(eq(aboutPage.locale, locale)).limit(1);
  if (!about && locale !== 'en') {
    [about] = await db.select().from(aboutPage).where(eq(aboutPage.locale, 'en')).limit(1);
  }

  const [factoryPhotos, certPhotos] = await Promise.all([
    db.select().from(aboutGallery).where(eq(aboutGallery.imageType, 'factory')).orderBy(aboutGallery.displayOrder),
    db.select().from(aboutGallery).where(eq(aboutGallery.imageType, 'certification')).orderBy(aboutGallery.displayOrder),
  ]);

  const stats = [
    { value: about?.factorySize || '35,000', unit: 'sqm', label: t('facilitySize') },
    { value: about?.employeeCount || '200+', unit: '', label: t('employees') },
    { value: about?.annualCapacity || '500,000', unit: 'units', label: t('annualCapacity') },
    { value: '21+', unit: 'years', label: t('yearsExperience') },
  ];

  return (
    <div className="pt-20 md:pt-24">
      {/* Header */}
      <section className="bg-sand py-16 md:py-24">
        <div className="container-wide text-center">
          <h1 className="text-4xl md:text-6xl font-display font-medium">{t('title')}</h1>
          <div className="w-10 h-px bg-bronze mx-auto mt-6" />
        </div>
      </section>

      {/* Company Introduction */}
      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-medium mb-8" data-reveal>
              {t('companyIntro')}
            </h2>
            <div className="w-12 h-px bg-bronze mb-8" data-reveal />
            {about?.content ? (
              <div
                className="prose-content text-lg font-body font-light leading-relaxed"
                data-reveal
                dangerouslySetInnerHTML={{ __html: about.content }}
              />
            ) : (
              <p className="text-lg font-body font-light text-ink-mid leading-relaxed" data-reveal>
                Established in 2005, Jiaxing Chengtai Mirror Co., Ltd. is a premier manufacturer
                specializing in high-end mirror solutions, including LED, bathroom, and full-body
                mirrors.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Factory Stats */}
      <section className="py-20 md:py-28 bg-espresso text-cream">
        <div className="container-wide">
          <h2 className="text-2xl font-display font-medium text-center mb-16 text-cream/60">
            {t('factoryScale')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-5xl md:text-6xl font-display font-light text-bronze-light mb-1">
                  {stat.value}
                </p>
                {stat.unit && (
                  <p className="text-xs font-body text-cream/30 tracking-[0.2em] uppercase mb-3">
                    {stat.unit}
                  </p>
                )}
                <p className="text-sm font-body font-light text-cream/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factory Gallery */}
      {factoryPhotos.length > 0 && (
        <section className="section-padding bg-cream">
          <div className="container-wide">
            <div className="text-center mb-16" data-reveal>
              <h2 className="text-3xl md:text-4xl font-display font-medium">
                {t('factoryGallery')}
              </h2>
              <div className="w-10 h-px bg-bronze mx-auto mt-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-reveal-stagger>
              {factoryPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-video overflow-hidden bg-sand group" data-reveal>
                  <Image
                    src={getUploadUrl(photo.imageUrl)}
                    alt="Factory"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications */}
      <section className="section-padding bg-sand">
        <div className="container-wide">
          <div className="text-center mb-16" data-reveal>
            <h2 className="text-3xl md:text-4xl font-display font-medium">
              {t('certifications')}
            </h2>
            <div className="w-10 h-px bg-bronze mx-auto mt-6" />
          </div>

          {certPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-reveal-stagger>
              {certPhotos.map((cert) => (
                <div key={cert.id} className="bg-cream p-8 flex items-center justify-center border border-warm-border" data-reveal>
                  <Image
                    src={getUploadUrl(cert.imageUrl)}
                    alt="Certification"
                    width={200}
                    height={112}
                    className="max-h-28 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto" data-reveal-stagger>
              {['CE', 'CB', 'SAA', 'ETL', 'IP44', 'IP54', 'RoHS', 'ISO9001'].map((cert) => (
                <div key={cert} className="bg-cream p-8 text-center border border-warm-border hover:border-bronze transition-colors duration-300" data-reveal>
                  <p className="text-2xl font-display font-medium text-bronze">{cert}</p>
                  <p className="text-[10px] font-body text-ink-light tracking-[0.15em] uppercase mt-2">Certified</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
