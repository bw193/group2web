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
            <h2 className="section-heading text-ink" data-reveal>
              A studio that<br />
              <span className="italic font-extralight">ships.</span>
            </h2>

            <p
              className="text-ink-mid font-body font-light leading-[1.85] text-[16px] md:text-[17px] mt-8 max-w-md"
              data-reveal
            >
              Four production lines, an R&D studio, and an export-focused quality system —
              the craftsmanship of a studio at the throughput of a factory.
            </p>

            {/* Capability list — numbered rows with hairlines */}
            <ul className="mt-12 border-t border-warm-border" data-reveal-stagger>
              {capabilities.map((item, i) => (
                <li
                  key={item.label}
                  data-reveal
                  className="group grid grid-cols-[32px_1fr] gap-6 py-5 border-b border-warm-border"
                >
                  <span className="font-body text-[10px] font-medium tracking-[0.2em] uppercase text-bronze mt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-display text-[19px] font-light text-ink leading-snug">
                      {item.label}
                    </p>
                    <p className="text-[13px] font-body font-light text-ink-mid mt-1 leading-relaxed">
                      {item.note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-12" data-reveal>
              <Link
                href={`/${locale}/about`}
                className="group inline-flex items-center gap-3 border-b border-ink pb-2 text-[11px] font-body font-medium tracking-[0.26em] uppercase text-ink transition-colors hover:text-bronze hover:border-bronze"
              >
                Inside the factory
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats — refined editorial band */}
        <div className="mt-24 md:mt-32 pt-12 border-t border-warm-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10" data-reveal-stagger>
            {stats.map((s) => (
              <div key={s.label} data-reveal className="md:border-r md:border-warm-border md:pr-8 md:last:border-r-0">
                <p className="font-display text-5xl md:text-[56px] font-light text-ink leading-none tracking-[-0.02em]">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-5 text-[10px] font-body font-medium text-ink-mid tracking-[0.28em] uppercase">
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
