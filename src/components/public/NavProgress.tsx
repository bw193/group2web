'use client';

/**
 * Navigation experience — handles three things:
 *
 *  1. Hairline progress bar at the top edge during route transitions.
 *  2. Intent prefetching: prefetches a route the moment the cursor enters
 *     (or finger touches) any internal link, so by the time the user clicks
 *     the route is already compiled/streamed and navigation feels instant.
 *  3. Idle prefetching: after first paint, prefetches the top-level routes
 *     declared in `IDLE_PREFETCH` so cross-section navigation is hot.
 *
 * Replaces the previous full-screen "Loading" fallback. ~1KB shipped, no deps.
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Phase = 'idle' | 'loading' | 'finishing';

// Routes prefetched on idle once the page is interactive. Locale prefix
// is added at runtime from the current pathname.
const IDLE_PREFETCH = ['', '/products', '/about', '/contact'] as const;

export default function NavProgress() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const startedAtPath = useRef<string | null>(null);
  const finishTimer = useRef<number | null>(null);
  const prefetched = useRef<Set<string>>(new Set());

  // Helper: prefetch once per URL.
  const prefetchOnce = (href: string) => {
    if (prefetched.current.has(href)) return;
    prefetched.current.add(href);
    try {
      router.prefetch(href);
    } catch {
      /* no-op */
    }
  };

  const isInternalAnchor = (target: HTMLAnchorElement): string | null => {
    const href = target.getAttribute('href');
    if (!href) return null;
    if (target.target && target.target !== '_self') return null;
    if (target.hasAttribute('download')) return null;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      return url.pathname + url.search;
    } catch {
      return null;
    }
  };

  // Intent prefetching: hover, focus, touchstart on any internal link.
  useEffect(() => {
    const onIntent = (e: Event) => {
      const node = e.target as Element | null;
      const anchor = node?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = isInternalAnchor(anchor);
      if (!href) return;
      prefetchOnce(href);
    };

    document.addEventListener('pointerenter', onIntent, { capture: true, passive: true });
    document.addEventListener('focusin', onIntent, { capture: true });
    document.addEventListener('touchstart', onIntent, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerenter', onIntent, { capture: true });
      document.removeEventListener('focusin', onIntent, { capture: true });
      document.removeEventListener('touchstart', onIntent, { capture: true });
    };
  }, [router]);

  // Idle prefetching: warm the top-level routes after first paint.
  useEffect(() => {
    const localeMatch = pathname?.match(/^\/([a-z]{2})(?=\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'en';

    const run = () => {
      for (const path of IDLE_PREFETCH) {
        prefetchOnce(`/${locale}${path}`);
      }
    };

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(run, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(run, 800);
    return () => window.clearTimeout(t);
  }, [pathname, router]);

  // Click: start the progress bar immediately on internal navigation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = isInternalAnchor(anchor);
      if (!href) return;
      // Same URL — no navigation will happen.
      if (href === window.location.pathname + window.location.search) return;

      startedAtPath.current = window.location.pathname;
      if (finishTimer.current) {
        window.clearTimeout(finishTimer.current);
        finishTimer.current = null;
      }
      setPhase('loading');
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  // Finish when pathname actually changes from where we started.
  useEffect(() => {
    if (phase !== 'loading') return;
    if (startedAtPath.current === null) return;
    if (pathname === startedAtPath.current) return;

    setPhase('finishing');
    finishTimer.current = window.setTimeout(() => {
      setPhase('idle');
      startedAtPath.current = null;
      finishTimer.current = null;
    }, 360);
  }, [pathname, phase]);

  // Safety: if a navigation never resolves, auto-clear.
  useEffect(() => {
    if (phase !== 'loading') return;
    const t = window.setTimeout(() => setPhase('finishing'), 8000);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'idle') return null;

  return (
    <div aria-hidden data-phase={phase} className="nav-progress">
      <span className="nav-progress__bar" />
    </div>
  );
}
