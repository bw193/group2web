import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { aboutPage, aboutGallery } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUploadUrl } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

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
    <>
      {/* Intro */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-16 pb-20 md:pt-20 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5" data-reveal>
                Chengtai Mirror Co., Ltd — Since 2005
              </p>
              <h1
                className="font-display text-4xl md:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]"
                data-reveal
              >
                {t('title')}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-right" data-reveal>
              <p className="text-[17px] font-body font-normal text-ink leading-[1.6] max-w-sm lg:ml-auto">
                Jiaxing, China — a 35,000 sqm studio building precision mirrors for global hospitality, retail, and residential brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] sticky top-32" data-reveal>
                {t('companyIntro')}
              </p>
            </div>
            <div className="lg:col-span-8 max-w-3xl">
              {about?.content ? (
                <div
                  className="prose-content text-[17px]"
                  data-reveal
                  dangerouslySetInnerHTML={{ __html: about.content }}
                />
              ) : (
                <div data-reveal>
                  <p className="font-display text-2xl md:text-3xl font-normal text-ink leading-[1.3] tracking-[-0.01em] mb-6">
                    Established in 2005, Jiaxing Chengtai Mirror Co., Ltd. is a premier manufacturer of LED, bathroom, and full-body mirrors.
                  </p>
                  <p className="text-[17px] font-body font-normal text-ink leading-[1.65] max-w-xl">
                    From a single production line to an integrated 35,000 sqm facility, our mirrors now reach more than 60 countries — built to the specifications of projects that demand consistent quality at scale.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Factory Stats — editorial dark band */}
      <section className="bg-ink text-cream">
        <div className="container-wide py-20 md:py-24">
          <p className="text-[13px] font-body font-semibold text-bronze-light uppercase tracking-[0.18em] mb-10" data-reveal>
            {t('factoryScale')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 border-t border-cream/15 pt-12" data-reveal-stagger>
            {stats.map((stat, i) => (
              <div key={i} data-reveal className="md:border-r md:border-cream/15 md:pr-8 md:last:border-r-0">
                <p className="font-display text-5xl md:text-[56px] font-normal text-cream leading-none tracking-[-0.02em]">
                  {stat.value}
                </p>
                {stat.unit && (
                  <p className="mt-3 text-[13px] font-body font-semibold text-bronze-light tracking-[0.16em] uppercase">
                    {stat.unit}
                  </p>
                )}
                <p className="mt-4 text-[15px] font-body font-normal text-cream/85">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factory Gallery */}
      {factoryPhotos.length > 0 && (
        <section className="bg-cream border-b border-warm-border">
          <div className="container-wide py-20 md:py-24">
            <div className="flex items-end justify-between mb-12" data-reveal>
              <div>
                <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-4">
                  {t('factoryGallery')}
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                  Inside the studio
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3" data-reveal-stagger>
              {factoryPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`relative overflow-hidden bg-warm-gray group ${
                    i === 0 ? 'md:col-span-2 md:row-span-2 aspect-[4/5] md:aspect-auto' : 'aspect-[4/3]'
                  }`}
                  data-reveal
                >
                  <Image
                    src={getUploadUrl(photo.imageUrl)}
                    alt="Factory"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-20 md:py-24">
          <div className="flex items-end justify-between mb-12" data-reveal>
            <div>
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-4">
                {t('certifications')}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                Compliance that travels
              </h2>
            </div>
          </div>

          {certPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-warm-border" data-reveal-stagger>
              {certPhotos.map((cert) => (
                <div
                  key={cert.id}
                  className="aspect-square border-r border-b border-warm-border flex items-center justify-center p-4 md:p-6 bg-cream"
                  data-reveal
                >
                  <Image
                    src={getUploadUrl(cert.imageUrl)}
                    alt="Certification"
                    width={420}
                    height={420}
                    className="max-h-full max-w-full w-auto h-auto object-contain grayscale hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-warm-border" data-reveal-stagger>
              {['CE', 'CB', 'SAA', 'ETL', 'IP44', 'IP54', 'RoHS', 'ISO 9001'].map((cert) => (
                <div
                  key={cert}
                  className="aspect-square border-r border-b border-warm-border flex flex-col items-center justify-center text-center group hover:bg-sand transition-colors duration-300"
                  data-reveal
                >
                  <p className="font-display text-3xl md:text-4xl font-normal text-ink group-hover:text-bronze transition-colors duration-300">
                    {cert}
                  </p>
                  <p className="mt-2 text-[12px] font-body font-semibold text-ink-mid tracking-[0.16em] uppercase">
                    Certified
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-cream">
        <div className="container-wide py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink tracking-[-0.02em] leading-[1.05]">
                Plan a project with Chengtai
              </h2>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href={`/${locale}/contact`}
                className="btn-primary group"
              >
                Start an inquiry
                <ArrowRight size={14} strokeWidth={1.75} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
