'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Plus } from 'lucide-react';
import WordsReveal from './WordsReveal';
import MagneticLink from './MagneticLink';

interface QA {
  q: string;
  a: string;
}

const FALLBACK_FAQ: QA[] = [
  { q: 'Do you accept sample orders?', a: 'Yes — we support our customers in ordering samples to test quality and function before placing a full production order.' },
  { q: 'What is your typical lead time?', a: 'Generally 10–15 days for standard orders. Larger volumes are scheduled with you in advance.' },
  { q: 'Do you have an MOQ restriction?', a: 'Low MOQ — even a single piece is acceptable for sample checking.' },
  { q: 'Do you operate your own factory?', a: 'Yes. Fifteen years specializing in mirror manufacturing — LED, bathroom, dressing, and full mirror cabinets, all in-house.' },
  { q: 'Can we print our own logo on the products?', a: 'Yes. Confirm the design against our pre-production sample and let us know before production begins.' },
  { q: 'Do you offer a warranty on the products?', a: 'Every product ships with a two-year warranty.' },
];

export default function FaqSection() {
  const locale = useLocale();
  const [FAQ, setFAQ] = useState<QA[]>(FALLBACK_FAQ);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    fetch(`/api/faqs?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { question: string; answer: string }[]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setFAQ(rows.map((r) => ({ q: r.question, a: r.answer })));
        }
      })
      .catch(() => {});
  }, [locale]);

  const toggle = (i: number) => setOpenIdx((curr) => (curr === i ? null : i));

  return (
    <section
      id="faq"
      className="relative py-28 md:py-40 bg-sand scroll-mt-24 overflow-hidden"
    >
      {/* Atmospheric blobs */}
      <span className="blob blob-a" style={{ width: 520, height: 520, top: '-120px', right: '-160px' }} aria-hidden />
      <span className="blob blob-c" style={{ width: 380, height: 380, bottom: '-100px', left: '-120px' }} aria-hidden />

      <div className="container-wide relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          {/* Left header */}
          <aside className="lg:col-span-5 lg:sticky lg:top-32">
            {/* Tiny meta row */}
            <div className="flex items-center gap-3 mb-8" data-reveal>
              <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
              <span className="text-[11px] font-body text-ink-mid tracking-[0.3em] uppercase">
                Inquiries
              </span>
            </div>

            <h2 className="text-6xl md:text-7xl font-display font-light leading-[0.95] text-ink">
              <WordsReveal text="Frequently asked." italicAt={[1]} />
            </h2>

            {/* Decorative animated diagonal lines */}
            <div className="mt-12 mb-12 flex items-center gap-4">
              <span className="block w-16 h-px bg-bronze" />
              <span className="block w-1.5 h-1.5 rounded-full bg-bronze animate-float" />
              <span className="block w-3 h-px bg-bronze/50" />
            </div>

            <MagneticLink
              href={`/${locale}/contact`}
              className="inline-block px-7 py-4 bg-ink text-cream text-[12px] font-body font-medium tracking-[0.18em] uppercase rounded-full hover:bg-bronze transition-colors duration-500"
            >
              Have another question
              <span className="text-bronze group-hover:text-cream">→</span>
            </MagneticLink>
          </aside>

          {/* Accordion */}
          <ul className="lg:col-span-7 divide-y divide-warm-border" data-reveal-stagger>
            {FAQ.map((item, i) => {
              const isOpen = i === openIdx;
              return (
                <li key={i} data-reveal="lift">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    className="w-full flex items-start gap-6 py-7 md:py-9 text-left group"
                  >
                    {/* Numeric whisper */}
                    <span
                      className={`shrink-0 w-10 mt-3 font-body text-[10px] tracking-[0.3em] uppercase transition-colors duration-500 ${
                        isOpen ? 'text-bronze' : 'text-ink-light/60 group-hover:text-bronze'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <h3
                      className={`flex-1 font-display text-2xl md:text-[28px] font-light leading-snug transition-all duration-500 ${
                        isOpen ? 'text-ink translate-x-1' : 'text-ink/85 group-hover:text-ink group-hover:translate-x-1'
                      }`}
                    >
                      {item.q}
                    </h3>

                    {/* Animated icon — circle morphs */}
                    <span
                      aria-hidden
                      className={`shrink-0 mt-2 relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 ease-out-expo ${
                        isOpen
                          ? 'bg-ink text-cream rotate-[225deg] scale-100'
                          : 'bg-transparent text-ink-light group-hover:bg-bronze-subtle group-hover:text-bronze scale-95'
                      }`}
                    >
                      <Plus size={16} strokeWidth={1.5} />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${i}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-[900ms] ease-out-expo ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 pb-9' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-16 pr-12">
                        <p
                          className="text-[15px] md:text-base font-body font-light text-ink-mid leading-[1.85] max-w-[58ch]"
                          style={{
                            transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
                            opacity: isOpen ? 1 : 0,
                            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                          }}
                        >
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
