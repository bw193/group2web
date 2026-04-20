import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getUploadUrl } from '@/lib/utils';

interface Props {
  images?: (string | null)[];
}

const FALLBACK_LABELS = ['CE', 'CB', 'SAA', 'ETL', 'IP44', 'IP54', 'RoHS', 'ISO 9001'];

export default async function CertificationsSection({ images = [] }: Props) {
  const t = await getTranslations('home');
  const photos = images.filter((v): v is string => !!v);
  const hasPhotos = photos.length > 0;

  // Duplicate the source for a seamless infinite marquee
  const marqueePhotos = hasPhotos ? [...photos, ...photos] : [];
  const marqueeLabels = [...FALLBACK_LABELS, ...FALLBACK_LABELS];

  return (
    <section className="relative py-28 md:py-36 bg-ink text-cream overflow-hidden">
      {/* Faint bronze wash */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(205,185,154,0.9), transparent 70%)',
        }}
      />
      <span
        className="blob blob-b"
        style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.25 }}
        aria-hidden
      />

      <div className="container-wide relative">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20" data-reveal>
          <p className="text-[11px] font-body text-bronze-light tracking-[0.4em] uppercase mb-6">
            Certified
          </p>
          <h2 className="text-4xl md:text-6xl font-display font-light leading-[1.05] text-cream">
            Trusted in{' '}
            <span className="italic text-bronze-light">60+</span>{' '}
            countries.
          </h2>
        </div>
      </div>

      {/* Full-bleed marquee strip */}
      <div className="relative marquee-mask" data-reveal>
        {hasPhotos ? (
          <div className="marquee-track py-6">
            {marqueePhotos.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="group relative shrink-0 mx-8 md:mx-12 w-[120px] md:w-[150px] aspect-[4/5] flex items-center justify-center"
              >
                <Image
                  src={getUploadUrl(src)}
                  alt={`Certification ${(i % photos.length) + 1}`}
                  fill
                  sizes="150px"
                  quality={80}
                  className="object-contain transition-all duration-700 ease-out-expo grayscale brightness-[1.8] opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="marquee-track py-6">
            {marqueeLabels.map((cert, i) => (
              <div
                key={`${cert}-${i}`}
                className="group shrink-0 mx-10 md:mx-16 flex items-center"
              >
                <span className="font-display text-3xl md:text-5xl font-light text-cream/40 group-hover:text-bronze-light transition-colors duration-500 tracking-wider whitespace-nowrap">
                  {cert}
                </span>
                <span className="ml-10 md:ml-16 w-1.5 h-1.5 rounded-full bg-bronze-light/50" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
