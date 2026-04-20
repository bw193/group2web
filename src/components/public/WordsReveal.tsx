'use client';

import { ElementType, ReactNode, useEffect, useRef } from 'react';

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  /** Optional decorator to italicize / bronze-color a specific word index */
  italicAt?: number[];
  delayMs?: number;
}

/**
 * Splits a string into per-word spans, each wrapped in an overflow:hidden mask.
 * On scroll into view, each word lifts from translateY(110%) to 0 with a
 * stagger driven by --w (its index). Add `.revealed` to trigger.
 *
 * Pairs with the AnimationProvider's IntersectionObserver — set data-reveal-words.
 */
export default function WordsReveal({
  text,
  as: Tag = 'span',
  className = '',
  italicAt = [],
  delayMs = 0,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('revealed'), delayMs);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delayMs]);

  const words = text.split(/(\s+)/);

  return (
    <Tag
      ref={ref as any}
      className={`reveal-words ${className}`}
    >
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
        const wordIndex = words.slice(0, i).filter((s) => !/^\s+$/.test(s)).length;
        const isItalic = italicAt.includes(wordIndex);
        return (
          <span key={i} className="word">
            <span
              style={{ ['--w' as any]: wordIndex }}
              className={isItalic ? 'italic text-bronze font-light' : ''}
            >
              {w}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
