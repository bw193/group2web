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
              <p className="kicker-plain mb-6" data-reveal>
                <span className="text-bronze mr-3">— Since 2005</span>
                Chengtai Mirror Co., Ltd
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
                Jiaxing, China — a 35,000 sqm studio building precision mirrors for global hospitality, retail, and residential brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4">
              <p className="kicker-plain sticky top-32" data-reveal>
                <span className="text-bronze mr-3">01</span>
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
                  <p className="font-display text-3xl md:text-4xl font-light text-ink leading-[1.25] tracking-[-0.015em] mb-8">
                    Established in 2005, Jiaxing Chengtai Mirror Co., Ltd. is a premier manufacturer
                    of <span className="italic">LED, bathroom, and full-body mirrors</span>.
                  </p>
                  <p className="text-[16px] font-body font-light text-ink-mid leading-[1.85] max-w-xl">
                    From a single production line to an integrated 35,000 sqm facility, our
                    mirrors now reach more than 60 countries — built to the specifications of
                    projects that demand consistent quality at scale.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Factory Stats — editorial dark band */}
      <section className="bg-ink text-cream">
        <div className="container-wide py-24 md:py-32">
          <p className="kicker-plain mb-12 text-cream/60" data-reveal>
            <span className="text-bronze-light mr-3">02</span>
            {t('factoryScale')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-14 gap-x-8 border-t border-cream/15 pt-14" data-reveal-stagger>
            {stats.map((stat, i) => (
              <div key={i} data-reveal className="md:border-r md:border-cream/15 md:pr-8 md:last:border-r-0">
                <p className="font-display text-5xl md:text-[64px] font-light text-cream leading-none tracking-[-0.02em]">
                  {stat.value}
                </p>
                {stat.unit && (
                  <p className="mt-3 text-[10px] font-body font-medium text-bronze-light tracking-[0.28em] uppercase">
                    {stat.unit}
                  </p>
                )}
                <p className="mt-5 text-[13px] font-body font-light text-cream/60">
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
          <div className="container-wide py-24 md:py-32">
            <div className="flex items-end justify-between mb-14" data-reveal>
              <div>
                <p className="kicker-plain mb-5">
                  <span className="text-bronze mr-3">03</span>
                  {t('factoryGallery')}
                </p>
                <h2 className="section-heading text-ink">
                  Inside the{' '}
                  <span className="italic font-extralight">studio.</span>
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
                  <span className="absolute top-4 left-4 font-body text-[10px] font-medium tracking-[0.28em] uppercase text-cream/90 mix-blend-difference">
                    {String(i + 1).padStart(2, '0')} — Facility
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-24 md:py-32">
          <div className="flex items-end justify-between mb-14" data-reveal>
            <div>
              <p className="kicker-plain mb-5">
                <span className="text-bronze mr-3">04</span>
                {t('certifications')}
              </p>
              <h2 className="section-heading text-ink">
                Compliance that <span className="italic font-extralight">travels.</span>
              </h2>
            </div>
          </div>

          {certPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-warm-border" data-reveal-stagger>
              {certPhotos.map((cert) => (
                <div
                  key={cert.id}
                  className="aspect-square border-r border-b border-warm-border flex items-center justify-center p-10 bg-cream"
                  data-reveal
                >
                  <Image
                    src={getUploadUrl(cert.imageUrl)}
                    alt="Certification"
                    width={200}
                    height={112}
                    className="max-h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-500"
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
                  <p className="font-display text-3xl md:text-4xl font-light text-ink group-hover:text-bronze transition-colors duration-300">
                    {cert}
                  </p>
                  <p className="mt-2 text-[9px] font-body font-medium text-ink-light tracking-[0.28em] uppercase">
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
        <div className="container-wide py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h2 className="section-heading text-ink">
                Plan a project with{' '}
                <span className="italic font-extralight">Chengtai.</span>
              </h2>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href={`/${locale}/contact`}
                className="group inline-flex items-center gap-3 border-b border-ink pb-2 text-[11px] font-body font-medium tracking-[0.26em] uppercase text-ink transition-colors hover:text-bronze hover:border-bronze"
              >
                Start an inquiry
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
