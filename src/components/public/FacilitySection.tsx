import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FacilityGallery from './FacilityGallery';
import { ArrowRight } from 'lucide-react';
import CountUp from './CountUp';

interface Props {
  locale: string;
  images?: (string | null)[];
}

export default async function FacilitySection({ locale, images = [] }: Props) {
  const t = await getTranslations('home');
  const gallerySrcs = images.filter((v): v is string => !!v);

  const capabilities = [
    { label: 'Vertical integration', note: 'In-house glass, coating, LED, and finishing' },
    { label: 'Certified quality', note: 'CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001' },
    { label: 'In-house R&D studio', note: 'Prototype-to-mold in under 21 days' },
    { label: 'Global logistics', note: 'Export-ready to 60+ countries' },
  ];

  const stats = [
    { to: 35, suffix: ',000', label: 'Square meters' },
    { to: 200, suffix: '+', label: 'Skilled staff' },
    { to: 500, suffix: 'K', label: 'Units per year' },
    { to: 21, suffix: '+', label: 'Years of craft' },
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
              The factory
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em]" data-reveal>
              A studio that ships
            </h2>

            <p
              className="text-ink font-body font-normal leading-[1.6] text-[17px] md:text-[18px] mt-6 max-w-md"
              data-reveal
            >
              Four production lines, an R&D studio, and an export-focused quality system — the craftsmanship of a studio at the throughput of a factory.
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
                Inside the factory
                <ArrowRight size={14} strokeWidth={1.75} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="mt-20 md:mt-24 py-12 md:py-16 border-t border-warm-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 items-center" data-reveal-stagger>
            {stats.map((s) => (
              <div key={s.label} data-reveal className="flex flex-col justify-center md:border-r md:border-warm-border md:pr-8 md:last:border-r-0">
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
      </div>
    </section>
  );
}
