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
    // after mount (e.g., client-side filter/tab grids). Cheaper than a
    // blanket MutationObserver on document.body.
    const rescan = (event: Event) => {
      const detail = (event as CustomEvent).detail as ParentNode | undefined;
      observeElements(detail ?? document);
    };
    window.addEventListener('reveal:rescan', rescan);

    return () => {
      observer.disconnect();
      window.removeEventListener('reveal:rescan', rescan);
    };
  }, []);

  return null;
}
