import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FacilityGallery from './FacilityGallery';
import { ArrowRight } from 'lucide-react';
import CountUp from './CountUp';
import ProofPoints from './ProofPoints';

interface Props {
  locale: string;
  images?: (string | null)[];
}

export default async function FacilitySection({ locale, images = [] }: Props) {
  const t = await getTranslations('home');
  const gallerySrcs = images.filter((v): v is string => !!v);

  const capabilities = [
    { label: t('capability1Title'), note: t('capability1Desc') },
    { label: t('capability2Title'), note: t('capability2Desc') },
    { label: t('capability3Title'), note: t('capability3Desc') },
    { label: t('capability4Title'), note: t('capability4Desc') },
  ];

  const stats = [
    { to: 50, suffix: ',000', label: t('statsLabel1') },
    { to: 200, suffix: '+', label: t('statsLabel2') },
    { to: 2, suffix: 'M', label: t('statsLabel3') },
    { to: 21, suffix: '+', label: t('statsLabel4') },
  ];

  return (
    <section className="bg-sand border-b border-warm-border">
      <div className="container-wide py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Image gallery */}
          <div className="lg:col-span-7 relative" data-reveal="clip">
            <FacilityGallery images={gallerySrcs} />
          </div>

          {/* Content */}
          <div className="lg:col-span-5 lg:pt-6">
            <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5" data-reveal>
              {t('factoryEyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em]" data-reveal>
              {t('factoryHeading')}
            </h2>

            <p
              className="text-ink font-body font-normal leading-[1.6] text-[17px] md:text-[18px] mt-6 max-w-md"
              data-reveal
            >
              {t('factoryDescription')}
            </p>

            {/* Capability list — readable rows */}
            <ul className="mt-10" data-reveal-stagger>
              {capabilities.map((item) => (
                <li
                  key={item.label}
                  data-reveal
                  className="py-5 border-b border-warm-border first:border-t"
                >
                  <p className="font-display text-[20px] font-normal text-ink leading-snug">
                    {item.label}
                  </p>
                  <p className="text-[15px] font-body font-normal text-ink-mid mt-1.5 leading-[1.55]">
                    {item.note}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10" data-reveal>
              <Link
                href={`/${locale}/about`}
                className="btn-primary group"
              >
                {t('factoryButton')}
                <ArrowRight size={14} strokeWidth={1.75} className="ms-3 transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="mt-20 md:mt-24 py-12 md:py-16 border-t border-warm-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 items-center" data-reveal-stagger>
            {stats.map((s) => (
              <div key={s.label} data-reveal className="flex flex-col justify-center md:border-e md:border-warm-border md:pe-8 md:last:border-e-0">
                <p className="font-display text-5xl md:text-[56px] font-normal text-ink leading-none tracking-[-0.02em]">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-4 text-[14px] font-body font-semibold text-ink tracking-[0.08em] uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Proof points — what the factory earns the buyer; closes the section */}
        <ProofPoints className="pt-10 md:pt-12 border-t border-warm-border" />
      </div>
    </section>
  );
}
