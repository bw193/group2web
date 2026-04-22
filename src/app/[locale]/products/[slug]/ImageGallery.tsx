'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const goNext = useCallback(() => setSelected((s) => (s + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setSelected((s) => (s - 1 + images.length) % images.length), [images.length]);

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

  return (
    <div>
      {/* Main Image */}
      <div
        className="relative aspect-[4/5] bg-sand overflow-hidden cursor-zoom-in group"
        onClick={() => setZoomed(true)}
      >
        <Image
          src={images[selected]}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          quality={85}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === selected}
              className={`relative flex-shrink-0 w-20 h-20 overflow-hidden transition-all duration-300 ${
                i === selected
                  ? 'ring-1 ring-bronze ring-offset-2 ring-offset-cream'
                  : 'opacity-50 hover:opacity-80'
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

      {/* Lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={productName}
              fill
              sizes="100vw"
              quality={90}
              className="object-contain"
            />
          </div>

          {/* Lightbox controls */}
          <button
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/50 transition-colors z-10"
          >
            <X size={18} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Previous image"
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/50 transition-colors z-10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Next image"
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/50 transition-colors z-10"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/40 text-xs font-body tracking-widest z-10">
            {selected + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
