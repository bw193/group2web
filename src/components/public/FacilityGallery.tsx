'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getUploadUrl } from '@/lib/utils';

interface Props {
  images: string[];
}

export default function FacilityGallery({ images }: Props) {
  const list = images.length > 0 ? images : ['/images/placeholder.svg'];
  const [activeIdx, setActiveIdx] = useState(0);
  const thumbs = list.slice(0, 4);

  return (
    <div className="relative">
      {/* Primary image */}
      <div className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden bg-warm-gray">
        {thumbs.map((src, i) =>
          src === '/images/placeholder.svg' ? (
            <div
              key={`ph-${i}`}
              className={`absolute inset-0 flex flex-col items-center justify-center bg-warm-gray transition-opacity duration-[1.2s] ease-out ${
                i === activeIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="w-32 h-40 border border-bronze/25 bg-cream/30 mb-4" />
              <span className="text-[10px] font-body text-ink-light tracking-[0.3em] uppercase">
                Facility View
              </span>
            </div>
          ) : (
            <Image
              key={`${src}-${i}`}
              src={src.startsWith('/') ? src : getUploadUrl(src)}
              alt={`Chengtai facility view ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              quality={85}
              priority={i === 0}
              className={`object-cover transition-opacity duration-[1.2s] ease-out ${
                i === activeIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          )
        )}

        {/* Counter — bottom-left */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4 text-cream">
          <span className="font-display text-3xl font-light leading-none">
            {String(activeIdx + 1).padStart(2, '0')}
          </span>
          <span className="w-10 h-px bg-cream/50" />
          <span className="text-[10px] font-body font-medium tracking-[0.28em] uppercase text-cream/70">
            {String(thumbs.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-4 grid grid-cols-4 gap-2 md:gap-3">
        {Array.from({ length: 4 }).map((_, i) => {
          const src = thumbs[i];
          const isActive = i === activeIdx;
          const isEmpty = !src;
          return (
            <button
              key={i}
              type="button"
              disabled={isEmpty}
              onClick={() => !isEmpty && setActiveIdx(i)}
              aria-label={`Show facility image ${i + 1}`}
              aria-pressed={isActive}
              className={`group relative aspect-[5/4] overflow-hidden transition-all duration-500 ${
                isEmpty ? 'bg-warm-gray/60 cursor-not-allowed' : 'bg-warm-gray cursor-pointer'
              }`}
            >
              {src ? (
                <>
                  <Image
                    src={src.startsWith('/') ? src : getUploadUrl(src)}
                    alt=""
                    fill
                    sizes="15vw"
                    quality={70}
                    className={`object-cover transition-all duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-px bg-ink" aria-hidden />
                  )}
                </>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-full h-px bg-warm-border rotate-[-45deg]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
