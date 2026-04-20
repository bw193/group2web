'use client';

import Link from 'next/link';
import { ReactNode, useRef } from 'react';

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  strength?: number; // 0..1, how far the content drifts toward the cursor
}

/**
 * Wraps a Link in a magnetic surface.
 * - Inner content translates toward the cursor by `strength * 12px`
 * - The CSS variable `--mx / --my` powers the bronze radial glow in `.magnetic`
 */
export default function MagneticLink({ href, className = '', children, strength = 0.35 }: Props) {
  const wrapRef = useRef<HTMLAnchorElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);

  function handleMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = wrapRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty('--mx', `${mx}%`);
    el.style.setProperty('--my', `${my}%`);

    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;
    inner.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function handleLeave() {
    const inner = innerRef.current;
    if (inner) inner.style.transform = 'translate(0,0)';
  }

  return (
    <Link
      ref={wrapRef as any}
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`magnetic ${className}`}
    >
      <span
        ref={innerRef}
        className="inline-flex items-center gap-3 transition-transform duration-300 ease-out"
      >
        {children}
      </span>
    </Link>
  );
}
