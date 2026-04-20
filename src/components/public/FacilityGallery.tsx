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
      <div className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden bg-sand rounded-sm">
        {thumbs.map((src, i) => (
          <Image
            key={`${src}-${i}`}
            src={src.startsWith('/') ? src : getUploadUrl(src)}
            alt={`Chengtai facility view ${i + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            quality={85}
            priority={i === 0}
            className={`object-cover transition-all duration-[1.2s] ease-out-expo ${
              i === activeIdx
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-[1.06] pointer-events-none'
            }`}
          />
        ))}

        {/* Soft overlay & corner index */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/35 via-ink/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-5 left-5 md:bottom-6 md:left-6 flex items-center gap-3 text-cream">
          <span className="font-display text-3xl md:text-4xl font-light leading-none">
            {String(activeIdx + 1).padStart(2, '0')}
          </span>
          <span className="w-10 h-px bg-cream/60" />
          <span className="text-[10px] font-body tracking-[0.25em] uppercase text-cream/80">
            {String(thumbs.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Floating "Since 2005" — gently floating */}
      <div className="absolute -bottom-6 -right-3 md:-bottom-10 md:-right-10 bg-cream px-7 py-5 md:px-9 md:py-7 z-10 animate-float shadow-[0_30px_70px_-30px_rgba(42,38,32,0.25)] rounded-sm">
        <p className="text-[10px] font-body font-light text-ink-light tracking-[0.3em] uppercase">
          Est.
        </p>
        <p className="font-display text-4xl md:text-5xl font-light text-bronze leading-none mt-2">
          2005
        </p>
        <span className="block w-8 h-px bg-bronze mt-3" />
      </div>

      {/* Thumbnail strip — below image */}
      <div className="mt-5 md:mt-6 grid grid-cols-4 gap-2 md:gap-3 max-w-[85%]">
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
                  {/* Active outline */}
                  <span
                    className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
                      isActive
                        ? 'ring-2 ring-bronze ring-offset-0'
                        : ''
                    }`}
                  />
                  {/* Inactive dimming */}
                  <span
                    className={`absolute inset-0 bg-cream pointer-events-none transition-opacity duration-500 ${
                      isActive ? 'opacity-0' : 'opacity-30 group-hover:opacity-0'
                    }`}
                  />
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
