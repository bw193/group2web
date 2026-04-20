'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const goNext = () => setSelected((s) => (s + 1) % images.length);
  const goPrev = () => setSelected((s) => (s - 1 + images.length) % images.length);

  return (
    <div>
      {/* Main Image */}
      <div
        className="relative aspect-[4/5] bg-sand overflow-hidden cursor-zoom-in group"
        onClick={() => setZoomed(true)}
      >
        <img
          src={images[selected]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-20 h-20 overflow-hidden transition-all duration-300 ${
                i === selected
                  ? 'ring-1 ring-bronze ring-offset-2 ring-offset-cream'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt={`${productName} ${i + 1}`} className="w-full h-full object-cover" />
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
          <img
            src={images[selected]}
            alt={productName}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Lightbox controls */}
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/50 transition-colors"
          >
            <X size={18} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:text-cream hover:border-cream/50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/40 text-xs font-body tracking-widest">
            {selected + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
