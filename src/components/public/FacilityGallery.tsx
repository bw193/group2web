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
  const active = list[activeIdx] ?? list[0];
  const thumbs = list.slice(0, 4); // at most 4 slots

  return (
    <div className="relative">
      {/* Primary image */}
      <div className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden bg-sand">
        {thumbs.map((src, i) => (
          <Image
            key={`${src}-${i}`}
            src={src.startsWith('/') ? src : getUploadUrl(src)}
            alt={`Chengtai facility view ${i + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            quality={85}
            priority={i === 0}
            className={`object-cover transition-all duration-[900ms] ease-out-expo ${
              i === activeIdx
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-[1.04] pointer-events-none'
            }`}
          />
        ))}

        {/* Gradient at base for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" />

        {/* Live dot badge — top-left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 bg-cream/90 backdrop-blur-sm px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
          <span className="text-[10px] font-body font-medium text-ink tracking-[0.2em] uppercase">
            In Production
          </span>
        </div>

        {/* Index counter — bottom-left */}
        <div className="absolute bottom-5 left-5 md:bottom-6 md:left-6 flex items-center gap-3 text-cream">
          <span className="font-display text-2xl md:text-3xl font-light leading-none">
            {String(activeIdx + 1).padStart(2, '0')}
          </span>
          <span className="w-8 h-px bg-cream/50" />
          <span className="text-[10px] font-body font-light tracking-[0.25em] uppercase text-cream/80">
            {String(thumbs.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Floating established badge */}
      <div className="absolute -bottom-6 -right-4 md:-bottom-10 md:-right-10 bg-cream border border-warm-border px-6 py-5 md:px-8 md:py-6 shadow-[0_30px_60px_-30px_rgba(60,40,20,0.25)] z-10">
        <p className="text-[10px] font-body font-light text-ink-light tracking-[0.3em] uppercase mb-2">
          Established
        </p>
        <p className="font-display text-4xl md:text-5xl font-light text-bronze leading-none">
          2005
        </p>
        <div className="w-6 h-px bg-bronze/60 mt-3" />
      </div>

      {/* Thumbnail strip — below image, offset */}
      <div className="mt-6 md:mt-8 grid grid-cols-4 gap-3 md:gap-4 max-w-[85%]">
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
              className={`group relative aspect-square overflow-hidden transition-all duration-500 ${
                isEmpty
                  ? 'bg-sand/60 cursor-not-allowed'
                  : 'bg-sand cursor-pointer'
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
                    className={`object-cover transition-all duration-700 ${
                      isActive
                        ? 'scale-100 opacity-100'
                        : 'scale-[1.02] opacity-70 group-hover:opacity-100 group-hover:scale-100'
                    }`}
                  />
                  {/* Active outline (inset border) */}
                  <span
                    className={`absolute inset-0 border pointer-events-none transition-all duration-500 ${
                      isActive
                        ? 'border-bronze border-[2px]'
                        : 'border-transparent group-hover:border-cream/80'
                    }`}
                  />
                  {/* Inactive dimming veil */}
                  <span
                    className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                      isActive ? 'opacity-0' : 'opacity-30 group-hover:opacity-0 bg-ink'
                    }`}
                  />
                  {/* Tiny index */}
                  <span
                    className={`absolute bottom-1.5 left-1.5 text-[9px] font-body tracking-[0.2em] transition-colors duration-300 ${
                      isActive ? 'text-cream' : 'text-cream/70'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </>
              ) : (
                // Empty slot placeholder — subtle diagonal rule
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
