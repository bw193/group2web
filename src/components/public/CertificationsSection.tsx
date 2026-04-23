import Image from 'next/image';
import { getUploadUrl } from '@/lib/utils';

interface Props {
  images?: (string | null)[];
}

const FALLBACK_LABELS = ['CE', 'CB', 'SAA', 'ETL', 'IP44', 'IP54', 'RoHS', 'ISO 9001'];

export default async function CertificationsSection({ images = [] }: Props) {
  const photos = images.filter((v): v is string => !!v);
  const hasPhotos = photos.length > 0;

  // Each visual item is ~332px wide (220 + 2×56 margin). To guarantee the
  // marquee covers any realistic viewport AND loops seamlessly, we need at
  // least ~12 items per track (two sets of ≥6). Repeat photos as needed.
  const MIN_PER_SET = 6;
  const copiesPerSet = hasPhotos ? Math.max(1, Math.ceil(MIN_PER_SET / photos.length)) : 0;
  const oneSet = hasPhotos
    ? Array.from({ length: copiesPerSet }, () => photos).flat()
    : [];
  const photoTrack = [...oneSet, ...oneSet];
  const labelTrack = [...FALLBACK_LABELS, ...FALLBACK_LABELS];

  return (
    <section className="bg-cream border-b border-warm-border">
      <div className="container-wide pt-24 md:pt-32 pb-12 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 md:mb-16">
          <div className="lg:col-span-7" data-reveal>
            <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5">
              Certifications
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em]">
              Trusted in 60+ countries
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right" data-reveal>
            <p className="text-[17px] font-body font-normal text-ink leading-[1.6] max-w-md lg:ml-auto">
              Every mirror ships with the paperwork to clear the most demanding markets — from European bathrooms to North American hospitality projects.
            </p>
          </div>
        </div>
      </div>

      {/* Rolling ticker — edge-to-edge */}
      <div className="relative bg-sand/40" data-reveal>
        <div className="marquee-viewport py-10 md:py-12">
          {hasPhotos ? (
            <div className="marquee-track">
              {photoTrack.map((src, i) => (
                <div
                  key={`p-${i}`}
                  className="relative flex items-center justify-center w-[260px] md:w-[320px] h-[130px] md:h-[160px] mx-8 md:mx-12 shrink-0"
                  aria-hidden={i >= photos.length}
                >
                  <Image
                    src={getUploadUrl(src)}
                    alt={i < photos.length ? `Certification ${(i % photos.length) + 1}` : ''}
                    fill
                    sizes="320px"
                    quality={80}
                    className="object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="marquee-track">
              {labelTrack.map((cert, i) => (
                <div
                  key={`l-${i}`}
                  className="flex items-center mx-10 md:mx-16 shrink-0"
                  aria-hidden={i >= FALLBACK_LABELS.length}
                >
                  <p className="font-display text-4xl md:text-5xl font-normal text-ink leading-none whitespace-nowrap">
                    {cert}
                  </p>
                  <span className="ml-10 md:ml-16 h-1 w-1 rounded-full bg-bronze/70" aria-hidden />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container-wide pt-8 pb-20 md:pb-24">
        <p className="text-[13px] font-body font-semibold tracking-[0.14em] uppercase text-ink text-center">
          CE · CB · SAA · ETL · IP44 · IP54 · RoHS · ISO 9001
        </p>
      </div>
    </section>
  );
}
