import { getTranslations } from 'next-intl/server';
import GalleryImage from './GalleryImage';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

interface ExhibitionPhoto {
  imageUrl: string;
  caption: string | null;
}

interface Props {
  locale: string;
  photos: ExhibitionPhoto[];
}

export default async function WorldwideExhibitionSection({ locale, photos }: Props) {
  if (photos.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'home.exhibition' });
  const total = photos.length;

  // Real, admin-entered captions only — never a "International exhibition 1"
  // placeholder, which read as unfinished. Missing captions simply leave the
  // photo to speak for itself with a quiet index beneath.
  const items = photos.map((p, i) => ({
    imageUrl: p.imageUrl,
    caption: p.caption?.trim() || null,
    index: i + 1,
  }));

  const imageGraph = items
    .filter((it) => it.caption)
    .map((it) => ({
      '@type': 'ImageObject',
      contentUrl: absoluteImageUrl(it.imageUrl),
      caption: it.caption,
      name: `${it.caption} — ${SITE_NAME}`,
    }));

  // Keep photos generously sized: never thinner than a 2-up; only step to 3-up
  // when there are enough to fill the row cleanly.
  const gridCols =
    total <= 2
      ? 'sm:grid-cols-2'
      : total === 4
      ? 'grid-cols-2'
      : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="bg-sand border-b border-warm-border" aria-labelledby="exhibitions-heading">
      {imageGraph.length > 0 && (
        <JsonLd id="ld-exhibitions" data={{ '@context': 'https://schema.org', '@graph': imageGraph }} />
      )}

      <div className="container-wide py-16 md:py-20">
        {/* ── Centered masthead — matches the Featured Products rhythm ── */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.22em] mb-4" data-reveal>
            {t('eyebrow')}
          </p>
          <h2
            id="exhibitions-heading"
            className="font-display text-3xl md:text-4xl font-normal text-ink leading-[1.08] tracking-[-0.02em]"
            data-reveal
          >
            {t('heading')}
          </h2>
          <p className="mt-5 text-[15px] md:text-[16px] font-body font-normal text-ink-mid leading-[1.65]" data-reveal>
            {t('body')}
          </p>
        </div>

        {/* ── Gallery — contained, captions set quietly beneath each photo
            (never over the busy booth photography) ── */}
        <ul className={`mt-10 md:mt-12 grid grid-cols-1 ${gridCols} gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12`} data-reveal-stagger>
          {items.map((it) => (
            <li key={it.index} data-reveal="lift">
              <figure className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-warm-gray">
                  <GalleryImage
                    path={it.imageUrl}
                    alt={
                      it.caption
                        ? `${it.caption} — ${SITE_NAME} international exhibition`
                        : `${SITE_NAME} at an international mirror & bathroom exhibition`
                    }
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={82}
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
                  />
                </div>

                {it.caption && (
                  <figcaption className="mt-5">
                    <p className="font-display text-[18px] md:text-[19px] font-normal text-ink leading-[1.3] tracking-[-0.005em] transition-colors duration-300 group-hover:text-bronze">
                      {it.caption}
                    </p>
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function absoluteImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = SITE_URL.replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
