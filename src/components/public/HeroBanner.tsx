'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

interface BannerSlide {
  id: number;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
}

interface HeroBannerProps {
  slides: BannerSlide[];
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackCta?: string;
}

export default function HeroBanner({ slides }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const hasSlides = slides.length > 0;

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  const next = useCallback(() => {
    if (hasSlides) goTo((current + 1) % slides.length);
  }, [hasSlides, current, slides.length, goTo]);

  const prev = useCallback(() => {
    if (hasSlides) goTo((current - 1 + slides.length) % slides.length);
  }, [hasSlides, current, slides.length, goTo]);

  useEffect(() => {
    if (!hasSlides) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, hasSlides]);

  // Fallback when no slides — render an elegant animated canvas with text
  if (!hasSlides) {
    return (
      <section className="relative h-[60vh] min-h-[420px] max-h-[700px] md:h-[80vh] md:min-h-[600px] bg-ink overflow-hidden text-cream flex items-center justify-center">
        {/* Abstract animated gradient mesh fallback */}
        <span
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(168,142,111,0.8), transparent 70%)',
          }}
        />
        <span className="blob blob-a" style={{ width: 700, height: 700, top: '-25%', left: '20%', opacity: 0.35 }} />
        <span className="blob blob-c" style={{ width: 500, height: 500, bottom: '-15%', right: '5%', opacity: 0.25 }} />
        <span className="atmosphere-grain" />

        <div className="container-wide relative z-10 text-center flex flex-col items-center">
          <p className="text-[12px] font-body text-bronze-light tracking-[0.4em] uppercase mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {fallbackSubtitle || 'Premium B2B Manufacturer'}
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-[90px] font-display font-light leading-[0.95] text-cream max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '300ms' }}>
            {fallbackTitle || 'Excellence in Precision Mirrors'}
          </h1>
          <div className="mt-14 animate-fade-up" style={{ animationDelay: '500ms' }}>
            <MagneticLink
              href="/en/contact"
              className="group inline-flex items-center gap-4 px-10 py-5 bg-cream text-ink hover:bg-bronze-light rounded-full text-[12px] font-body font-medium tracking-[0.2em] uppercase transition-colors duration-700"
              strength={0.45}
            >
              {fallbackCta || 'Send Inquiry'}
              <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </MagneticLink>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section className="relative h-[60vh] min-h-[420px] max-h-[640px] md:h-[70vh] md:min-h-[480px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={getUploadUrl(slide.imageUrl)}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover transition-transform duration-[1.2s] ease-out-expo scale-[1.03]"
          key={current}
        />
      </div>

      {/* Navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-0 right-0">
          <div className="container-wide flex items-center justify-between">
            {/* Progress lines */}
            <div className="flex items-center gap-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="group relative h-8 flex items-center"
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <div className={`h-px transition-all duration-700 ease-out-expo ${
                    i === current ? 'w-12 bg-cream' : 'w-6 bg-cream/30 group-hover:bg-cream/60'
                  }`} />
                </button>
              ))}
              <span className="text-cream/40 text-xs font-body ml-3 tracking-widest">
                {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>

            {/* Arrow controls */}
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:border-cream/50 hover:text-cream transition-all duration-300"
                aria-label="Previous slide"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 flex items-center justify-center border border-cream/20 text-cream/60 hover:border-cream/50 hover:text-cream transition-all duration-300"
                aria-label="Next slide"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
