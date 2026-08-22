'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';

export interface GalleryPhoto {
  id: number;
  imageUrl: string;
  caption: string | null;
}

interface Labels {
  /** Accessible-name prefix for a tile; the 1-based index is appended. */
  open: string;
  close: string;
  prev: string;
  next: string;
}

/**
 * Factory photo mosaic with a full-screen lightbox. Tiles are buttons (keyboard
 * reachable); the lightbox supports arrow keys — mapped to reading direction so
 * "forward" matches the visual arrow in RTL — plus Escape, and locks body
 * scroll while open.
 */
export default function FactoryGalleryShowcase({
  photos,
  altBase,
  labels,
}: {
  photos: GalleryPhoto[];
  altBase: string;
  labels: Labels;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const count = photos.length;

  const step = useCallback(
    (delta: number) => {
      setOpenIdx((current) => (current === null ? current : (current + delta + count) % count));
    },
    [count],
  );

  useEffect(() => {
    if (openIdx === null) return;

    const rtl = document.documentElement.dir === 'rtl';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIdx(null);
      else if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
      else if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIdx, step]);

  const active = openIdx === null ? null : photos[openIdx];

  return (
    <>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-3" data-reveal-stagger>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIdx(i)}
            aria-label={`${labels.open} ${i + 1} / ${count}`}
            data-reveal
            className={`group relative cursor-zoom-in overflow-hidden bg-warm-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
              i === 0 ? 'aspect-[4/5] md:col-span-2 md:row-span-2 md:aspect-auto' : 'aspect-[4/3]'
            }`}
          >
            <GalleryImage
              path={photo.imageUrl}
              alt={photo.caption || `${altBase} ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
            />
            <span
              className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/15"
              aria-hidden
            />
            <span
              className="absolute end-3 top-3 bg-ink/50 px-2 py-1 font-body text-[11px] font-semibold tracking-[0.18em] text-cream opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden
            >
              {String(i + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            {photo.caption && (
              <>
                <span
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 p-4 text-start font-body text-[13px] font-medium leading-snug text-cream md:p-5">
                  {photo.caption}
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption || `${altBase} ${openIdx! + 1}`}
          className="fixed inset-0 z-[90] flex flex-col bg-ink/95 backdrop-blur-sm"
          onClick={() => setOpenIdx(null)}
        >
          <div className="flex items-center justify-between p-4 md:p-6">
            <p className="font-body text-[13px] font-semibold tracking-[0.18em] text-cream/70">
              {String(openIdx! + 1).padStart(2, '0')}
              <span className="mx-2 text-cream/35">/</span>
              {String(count).padStart(2, '0')}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setOpenIdx(null)}
              aria-label={labels.close}
              className="grid h-11 w-11 cursor-pointer place-items-center border border-cream/25 text-cream transition-colors duration-300 hover:border-cream hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-light"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative mx-4 flex-1 md:mx-20" onClick={(e) => e.stopPropagation()}>
            <GalleryImage
              path={active.imageUrl}
              alt={active.caption || `${altBase} ${openIdx! + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-4 md:p-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label={labels.prev}
              className="grid h-11 w-11 cursor-pointer place-items-center border border-cream/25 text-cream transition-colors duration-300 hover:border-cream hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-light"
            >
              <ChevronLeft size={18} strokeWidth={1.5} className="rtl:-scale-x-100" />
            </button>
            <p
              className="min-w-0 truncate text-center font-body text-[13px] font-normal text-cream/85 md:text-[14px]"
              onClick={(e) => e.stopPropagation()}
            >
              {active.caption || ''}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label={labels.next}
              className="grid h-11 w-11 cursor-pointer place-items-center border border-cream/25 text-cream transition-colors duration-300 hover:border-cream hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-light"
            >
              <ChevronRight size={18} strokeWidth={1.5} className="rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
