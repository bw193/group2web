import { getTranslations } from 'next-intl/server';
import FacilityGallery from './FacilityGallery';
import { ArrowRight } from 'lucide-react';
import WordsReveal from './WordsReveal';
import CountUp from './CountUp';
import MagneticLink from './MagneticLink';

interface Props {
  locale: string;
  images?: (string | null)[];
}

export default async function FacilitySection({ locale, images = [] }: Props) {
  const t = await getTranslations('home');
  const gallerySrcs = images.filter((v): v is string => !!v);

  const capabilities = [
    'Vertical integration',
    'Certified quality',
    'In-house R&D studio',
    'Global logistics',
  ];

  const stats = [
    { to: 35, suffix: 'K', label: 'sqm facility' },
    { to: 200, suffix: '+', label: 'skilled staff' },
    { to: 500, suffix: 'K', label: 'units / year' },
    { to: 21, suffix: '+', label: 'years' },
  ];

  return (
    <section className="relative py-28 md:py-40 bg-cream overflow-hidden">
      {/* Drifting bronze atmosphere */}
      <span className="blob blob-a" style={{ width: 480, height: 480, top: '15%', left: '-150px' }} aria-hidden />
      <span className="blob blob-c" style={{ width: 600, height: 600, bottom: '-200px', right: '-200px' }} aria-hidden />

      {/* Decorative spinning ring — far background */}
      <span
        aria-hidden
        className="absolute top-20 right-10 md:right-32 w-32 h-32 md:w-44 md:h-44 rounded-full border border-bronze/20 animate-spin-slow pointer-events-none"
      />
      <span
        aria-hidden
        className="absolute top-28 right-16 md:right-40 w-20 h-20 md:w-28 md:h-28 rounded-full border border-bronze/30 pointer-events-none"
      />

      <div className="container-wide relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-start">
          {/* Image gallery — clip-path reveal */}
          <div className="lg:col-span-7 relative" data-reveal="clip">
            <FacilityGallery images={gallerySrcs} />
          </div>

          {/* Content */}
          <div className="lg:col-span-5 lg:pt-12">
            <div className="flex items-center gap-3 mb-8" data-reveal>
              <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
              <span className="text-[11px] font-body text-ink-mid tracking-[0.3em] uppercase">
                The facility
              </span>
            </div>

            <h2 className="text-5xl md:text-6xl font-display font-light leading-[0.95] text-ink">
              <WordsReveal text="A studio that ships." italicAt={[3]} />
            </h2>

            <p
              className="text-ink-mid font-body font-light leading-[1.85] text-base md:text-[17px] mt-10 max-w-md"
              data-reveal
            >
              Four production lines, an R&D studio, and an export-focused quality system —
              the craftsmanship of a studio at the throughput of a factory.
            </p>

            {/* Capability list — animated dots */}
            <ul className="mt-10 space-y-3" data-reveal-stagger>
              {capabilities.map((text) => (
                <li
                  key={text}
                  data-reveal
                  className="group flex items-center gap-4 py-1 text-[15px] font-body text-ink-mid hover:text-ink transition-colors duration-500 cursor-default"
                >
                  <span className="block w-8 h-px bg-bronze transition-all duration-500 group-hover:w-14" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-14" data-reveal>
              <MagneticLink
                href={`/${locale}/about`}
                className="group inline-flex items-center gap-3 px-7 py-4 border border-ink text-ink hover:bg-ink hover:text-cream text-[12px] font-body font-medium tracking-[0.18em] uppercase rounded-full transition-colors duration-500"
              >
                Inside the factory
                <ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />
              </MagneticLink>
            </div>
          </div>
        </div>

        {/* Stats — animated count-up */}
        <div className="mt-28 md:mt-36 grid grid-cols-2 md:grid-cols-4 gap-y-12" data-reveal-stagger>
          {stats.map((s) => (
            <div key={s.label} className="text-center md:text-left group" data-reveal>
              <p className="font-display text-6xl md:text-7xl font-light text-ink leading-none transition-colors duration-500 group-hover:text-bronze">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-4 text-[11px] font-body font-light text-ink-light tracking-[0.25em] uppercase">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
