'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import GalleryImage from '@/components/public/GalleryImage';

export interface ProcessStep {
  src: string;
  title: string;
  line: string;
  alt: string;
}

/** How long a stage holds before the walkthrough moves to the next one. */
const DWELL_MS = 4500;

/**
 * The four production stages as a tab list beside one photo panel: it walks
 * itself once it scrolls into view, and hands over the moment the visitor
 * picks a stage. Arrow keys are mapped to reading direction so "forward"
 * matches the visual order in RTL.
 */
export default function ProductionProcessViewer({ steps }: { steps: ProcessStep[] }) {
  const [active, setActive] = useState(0);
  // The walkthrough runs until the visitor takes over, and only while the
  // section is on screen — arriving mid-sequence would hide the first stages.
  const [auto, setAuto] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [paused, setPaused] = useState(false);
  // Starts pessimistic so the server markup and the first client render agree;
  // the effect below settles it from the media query.
  const [reduced, setReduced] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  const walking = auto && onScreen && !reduced;
  const running = walking && !paused;

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % steps.length), DWELL_MS);
    return () => clearTimeout(id);
  }, [running, active, steps.length]);

  const select = useCallback((i: number) => {
    setActive(i);
    setAuto(false);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const rtl = document.documentElement.dir === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next: number | null = null;
    if (e.key === 'ArrowDown' || e.key === forward) next = (active + 1) % steps.length;
    else if (e.key === 'ArrowUp' || e.key === back) next = (active - 1 + steps.length) % steps.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = steps.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      ref={rootRef}
      className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Photo panel — all four stills stay in the DOM and cross-fade, so
          switching stages never waits on a network request. */}
      <div data-reveal="clip" className="lg:order-2 lg:col-span-7">
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          tabIndex={0}
          className="relative aspect-[3/2] overflow-hidden bg-warm-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {steps.map((step, i) => (
            <span
              key={step.src}
              aria-hidden={i !== active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <GalleryImage
                path={step.src}
                alt={step.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/85 to-transparent md:h-32"
              />
              <span className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <span className="block font-body text-[11px] font-semibold tabular-nums tracking-[0.18em] text-cream/70">
                  {String(i + 1).padStart(2, '0')}
                  <span className="mx-2 text-cream/35">/</span>
                  {String(steps.length).padStart(2, '0')}
                </span>
                <span className="mt-2 block max-w-lg font-body text-[14.5px] font-normal leading-[1.5] text-cream md:text-[15.5px]">
                  {step.line}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Stage list — the sequence, and the control for it. */}
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-labelledby="production-process-heading"
        onKeyDown={onKeyDown}
        data-reveal
        className="border-t border-warm-border lg:order-1 lg:col-span-5"
      >
        {steps.map((step, i) => {
          const on = i === active;
          return (
            <button
              key={step.src}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => select(i)}
              className="group relative flex w-full cursor-pointer items-baseline gap-5 border-b border-warm-border py-5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze md:gap-6 md:py-6"
            >
              <span
                className={`font-body text-[12px] font-semibold tabular-nums tracking-[0.14em] transition-colors duration-300 ${
                  on ? 'text-bronze' : 'text-ink-light group-hover:text-bronze'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`font-display text-[20px] font-normal leading-[1.25] tracking-[-0.01em] transition-all duration-300 md:text-[23px] ${
                  on
                    ? 'text-ink'
                    : 'text-ink-mid group-hover:translate-x-1 group-hover:text-ink rtl:group-hover:-translate-x-1'
                }`}
              >
                {step.title}
              </span>
              {/* Dwell line — pauses rather than disappears when the pointer
                  rests on the section, so it never promises movement that is
                  not coming. */}
              {on && walking && (
                <span
                  aria-hidden
                  className="process-dwell absolute -bottom-px start-0 h-px bg-bronze"
                  style={{ animationDuration: `${DWELL_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
