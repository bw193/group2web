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

    function observeElements() {
      document.querySelectorAll('[data-reveal-stagger]').forEach((parent) => {
        parent.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el, i) => {
          (el as HTMLElement).style.setProperty('--reveal-index', String(i));
          observer.observe(el);
        });
      });

      document.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el) => {
        if (!el.closest('[data-reveal-stagger]')) {
          observer.observe(el);
        }
      });
    }

    observeElements();

    const mutationObserver = new MutationObserver(observeElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
