'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hairline bronze rule across the top edge that fills as the article body
 * scrolls past. Sits above the fixed header but below the route-change
 * `.nav-progress` bar, so the two never fight for the same pixel row.
 */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const measure = () => {
      frame.current = 0;
      const start = el.getBoundingClientRect().top + window.scrollY;
      // The article is "read" once its last line clears the fold, not once the
      // page bottom is reached — otherwise the footer eats the final quarter.
      const span = el.offsetHeight - window.innerHeight * 0.5;
      if (span <= 0) return setProgress(window.scrollY > start ? 1 : 0);
      const ratio = (window.scrollY - start) / span;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetId]);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[2px] pointer-events-none">
      <span
        className="block h-full w-full origin-left rtl:origin-right bg-bronze transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
