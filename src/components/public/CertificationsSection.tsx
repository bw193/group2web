import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getUploadUrl } from '@/lib/utils';

interface Props {
  images?: (string | null)[];
}

const FALLBACK_LABELS = ['CE', 'CB', 'SAA', 'ETL', 'IP44', 'IP54', 'RoHS', 'ISO9001'];

export default async function CertificationsSection({ images = [] }: Props) {
  const t = await getTranslations('home');
  const photos = images.filter((v): v is string => !!v);
  const hasPhotos = photos.length > 0;

  return (
    <section className="relative py-20 md:py-24 bg-sand border-y border-warm-border overflow-hidden">
      {/* Subtle texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #9A8266 0.5px, transparent 0.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="container-wide relative">
        {/* Eyebrow bar */}
        <div className="flex items-center gap-4 mb-10" data-reveal>
          <span className="text-[11px] font-body font-medium text-bronze tracking-[0.3em] uppercase">
            03 / Compliance
          </span>
          <span className="flex-1 h-px bg-warm-border" />
          <span className="text-[10px] font-body font-light text-ink-light tracking-[0.25em] uppercase">
            International Standards
          </span>
        </div>

        {/* Heading row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 mb-14 items-end">
          <div className="md:col-span-5" data-reveal>
            <h2 className="text-3xl md:text-4xl font-display font-medium leading-tight">
              {t('certTitle')}
            </h2>
            <div className="w-12 h-px bg-bronze mt-6" />
          </div>
          <p
            className="md:col-span-7 text-base md:text-lg font-body font-light text-ink-mid leading-relaxed"
            data-reveal
          >
            {t('certDesc')}. Every product is engineered to meet regional safety
            and environmental requirements in 60+ countries — from North American
            ETL listings to European CE, Australian SAA, and ISO 9001 quality
            management.
          </p>
        </div>

        {/* Certification visuals */}
        {hasPhotos ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6"
            data-reveal-stagger
          >
            {photos.slice(0, 8).map((src, i) => (
              <figure
                key={`${src}-${i}`}
                className="group relative bg-cream border border-warm-border transition-colors duration-500 hover:border-bronze"
                data-reveal
              >
                {/* Corner marks — decorative */}
                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-bronze/0 group-hover:border-bronze transition-colors duration-500" />
                <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-bronze/0 group-hover:border-bronze transition-colors duration-500" />
                <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-bronze/0 group-hover:border-bronze transition-colors duration-500" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-bronze/0 group-hover:border-bronze transition-colors duration-500" />

                {/* Tiny index */}
                <span className="absolute top-3 left-3 text-[9px] font-body font-light text-ink-light tracking-[0.25em] z-10">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="relative aspect-[4/5] p-6 md:p-8 flex items-center justify-center">
                  <Image
                    src={getUploadUrl(src)}
                    alt={`Certification ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={80}
                    className="object-contain transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] p-6"
                  />
                </div>

                {/* Base tag */}
                <div className="px-4 py-3 border-t border-warm-border flex items-center justify-between">
                  <span className="text-[10px] font-body font-medium text-ink tracking-[0.2em] uppercase">
                    Certified
                  </span>
                  <span className="w-6 h-px bg-bronze/50 transition-all duration-500 group-hover:w-10 group-hover:bg-bronze" />
                </div>
              </figure>
            ))}
          </div>
        ) : (
          // Fallback — refined label grid when no photos are uploaded yet
          <div
            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4"
            data-reveal-stagger
          >
            {FALLBACK_LABELS.map((cert, i) => (
              <div
                key={cert}
                className="group relative aspect-square bg-cream border border-warm-border flex flex-col items-center justify-center transition-all duration-500 hover:border-bronze"
                data-reveal
              >
                <span className="absolute top-2 left-2 text-[9px] font-body font-light text-ink-light tracking-[0.2em]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-display text-xl md:text-2xl font-medium text-ink group-hover:text-bronze transition-colors duration-500">
                  {cert}
                </p>
                <span className="mt-2 w-5 h-px bg-bronze/40 transition-all duration-500 group-hover:w-10 group-hover:bg-bronze" />
                <span className="mt-2 text-[9px] font-body text-ink-light tracking-[0.2em] uppercase">
                  Certified
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
