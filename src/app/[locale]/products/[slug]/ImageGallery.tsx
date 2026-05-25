'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const t = useTranslations('products');

  const count = images.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  // Live drag state kept in a ref so the pointer-up handler reads the latest
  // offset rather than a stale render snapshot.
  const drag = useRef<{ x: number; dx: number; moved: boolean } | null>(null);
  const lightboxStartX = useRef<number | null>(null);

  // Lightbox navigation wraps; the inline track clamps (no slide exists past
  // the ends, so wrapping would jump the whole track).
  const goNext = useCallback(() => setSelected((s) => (s + 1) % count), [count]);
  const goPrev = useCallback(() => setSelected((s) => (s - 1 + count) % count), [count]);
  const clampNext = useCallback(() => setSelected((s) => Math.min(count - 1, s + 1)), [count]);
  const clampPrev = useCallback(() => setSelected((s) => Math.max(0, s - 1)), [count]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, goNext, goPrev]);

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    if (!zoomed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  // ---------- Inline swipe (finger-tracking carousel) ----------
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Let overlay controls (arrows, zoom) handle their own clicks.
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { x: e.clientX, dx: 0, moved: false };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = drag.current;
    if (!s) return;
    let dx = e.clientX - s.x;
    if (Math.abs(dx) > 6) s.moved = true;
    const w = viewportRef.current?.offsetWidth ?? 1;
    // Rubber-band resistance at the first/last image.
    if ((selected === 0 && dx > 0) || (selected === count - 1 && dx < 0)) dx *= 0.3;
    dx = Math.max(-w, Math.min(w, dx));
    s.dx = dx;
    setDragX(dx);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = drag.current;
    drag.current = null;
    setIsDragging(false);
    setDragX(0);
    if (!s) return;
    const w = viewportRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(80, w * 0.18);
    if (s.dx <= -threshold) clampNext();
    else if (s.dx >= threshold) clampPrev();
    else if (!s.moved && !(e.target as HTMLElement).closest('button')) setZoomed(true);
  };

  // ---------- Lightbox swipe (simple threshold) ----------
  const onLightboxDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    lightboxStartX.current = e.clientX;
  };
  const onLightboxUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = lightboxStartX.current;
    lightboxStartX.current = null;
    if (start == null) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) > 50) (dx < 0 ? goNext() : goPrev());
  };

  const atStart = selected === 0;
  const atEnd = selected === count - 1;
  const arrowBase =
    'absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-cream/85 backdrop-blur-sm text-ink transition-opacity duration-300 hover:bg-cream focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze';
  const arrowShow = 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100';
  const arrowHide = 'opacity-0 pointer-events-none';

  return (
    <div>
      {/* Main image — drag/swipe to browse, tap to zoom */}
      <div
        ref={viewportRef}
        className="relative aspect-[4/5] bg-sand overflow-hidden cursor-zoom-in group touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Sliding track */}
        <div
          className={`flex h-full ${isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{ transform: `translateX(calc(${-selected * 100}% + ${dragX}px))` }}
        >
          {images.map((img, i) => (
            <div key={i} className="relative min-w-full shrink-0 h-full">
              <Image
                src={img}
                alt={productName}
                fill
                priority={i === 0}
                // First image is the LCP element (priority). Eager-load only the
                // current image's neighbours so the next swipe is ready instantly;
                // defer the rest to keep the initial payload small.
                loading={i === 0 ? undefined : Math.abs(i - selected) <= 1 ? 'eager' : 'lazy'}
                sizes="(max-width: 1024px) 100vw, 58vw"
                quality={85}
                draggable={false}
                className="object-cover pointer-events-none"
              />
            </div>
          ))}
        </div>

        {/* Zoom affordance */}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={t('zoomHint')}
          className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 bg-cream/85 backdrop-blur-sm text-ink px-3 py-2 text-[10px] font-body font-semibold uppercase tracking-[0.16em] opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze"
        >
          <Maximize2 size={12} strokeWidth={2} aria-hidden />
          <span aria-hidden>{t('zoomHint')}</span>
        </button>

        {count > 1 && (
          <>
            {/* Prev / Next */}
            <button
              type="button"
              onClick={clampPrev}
              aria-label={t('prevImage')}
              className={`${arrowBase} left-4 ${atStart ? arrowHide : arrowShow}`}
            >
              <ChevronLeft size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={clampNext}
              aria-label={t('nextImage')}
              className={`${arrowBase} right-4 ${atEnd ? arrowHide : arrowShow}`}
            >
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>

            {/* Counter */}
            <span
              aria-hidden
              className="absolute bottom-4 left-4 z-10 bg-ink/70 text-cream px-2.5 py-1 text-[11px] font-body tracking-[0.12em] tabular-nums"
            >
              {String(selected + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              aria-label={`${productName} — ${i + 1}`}
              aria-pressed={i === selected}
              className={`relative flex-shrink-0 w-20 h-20 overflow-hidden bg-sand transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                i === selected
                  ? 'ring-1 ring-bronze ring-offset-2 ring-offset-cream'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="80px"
                quality={60}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — portaled to <body> so it sits above the fixed header */}
      {typeof document !== 'undefined' &&
        zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] bg-ink/95 flex items-center justify-center p-4"
            onClick={() => setZoomed(false)}
          >
            <div
              className="relative w-full h-full flex items-center justify-center touch-pan-y select-none"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={onLightboxDown}
              onPointerUp={onLightboxUp}
            >
              <Image
                src={images[selected]}
                alt={productName}
                fill
                sizes="100vw"
                quality={90}
                draggable={false}
                className="object-contain pointer-events-none"
              />
            </div>

            {/* Close */}
            <button
              onClick={() => setZoomed(false)}
              aria-label={t('close')}
              className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center bg-ink/50 backdrop-blur-sm border border-cream/30 text-cream hover:bg-ink/80 hover:border-cream/60 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
            >
              <X size={20} strokeWidth={1.75} />
            </button>

            {count > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  aria-label={t('prevImage')}
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-ink/50 backdrop-blur-sm border border-cream/30 text-cream hover:bg-ink/80 hover:border-cream/60 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  aria-label={t('nextImage')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-ink/50 backdrop-blur-sm border border-cream/30 text-cream hover:bg-ink/80 hover:border-cream/60 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/50 text-xs font-body tracking-widest z-10 tabular-nums">
              {selected + 1} / {count}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
