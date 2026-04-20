'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Pure numeric portion (e.g. 35 for "35K", 200 for "200+") */
  to: number;
  /** Optional prefix/suffix (e.g. "K", "+", "K SQM") */
  suffix?: string;
  prefix?: string;
  /** Animation duration in ms */
  durationMs?: number;
  className?: string;
}

export default function CountUp({
  to,
  suffix = '',
  prefix = '',
  durationMs = 1800,
  className = '',
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / durationMs);
              // ease-out-expo
              const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
              setVal(Math.round(eased * to));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}
