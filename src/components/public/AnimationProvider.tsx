'use client';

import { useEffect } from 'react';

export default function AnimationProvider() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    function observeElements(root: ParentNode = document) {
      root.querySelectorAll('[data-reveal-stagger]').forEach((parent) => {
        parent.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el, i) => {
          (el as HTMLElement).style.setProperty('--reveal-index', String(i));
          observer.observe(el);
        });
      });

      root.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el) => {
        if (!el.closest('[data-reveal-stagger]')) {
          observer.observe(el);
        }
      });

      root.querySelectorAll('.reveal-words:not(.revealed)').forEach((el) => {
        observer.observe(el);
      });
    }

    observeElements();

    // Expose a scoped rescan for components that inject reveal elements
    // after mount (e.g., client-side filter/tab grids).
    const rescan = (event: Event) => {
      const detail = (event as CustomEvent).detail as ParentNode | undefined;
      observeElements(detail ?? document);
    };
    window.addEventListener('reveal:rescan', rescan);

    // Watch for reveal elements added after mount. This covers the
    // App Router case where loading.tsx is in <main> when this effect
    // first runs, then gets replaced by the real page content (whose
    // [data-reveal] elements would otherwise never be observed),
    // as well as client-side route transitions.
    let pending = 0;
    const schedule = () => {
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        pending = 0;
        observeElements();
      });
    };
    const mutationObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          const el = node as Element;
          if (
            el.matches?.('[data-reveal], .reveal-words, [data-reveal-stagger]') ||
            el.querySelector?.('[data-reveal], .reveal-words, [data-reveal-stagger]')
          ) {
            schedule();
            return;
          }
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      if (pending) cancelAnimationFrame(pending);
      window.removeEventListener('reveal:rescan', rescan);
    };
  }, []);

  return null;
}
