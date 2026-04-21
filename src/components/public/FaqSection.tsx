'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowRight, Plus } from 'lucide-react';

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

interface Props {
  backendFaqs?: QA[];
}

export default function FaqSection({ backendFaqs = [] }: Props) {
  const locale = useLocale();
  const FAQ: QA[] = backendFaqs.length > 0 ? backendFaqs : FALLBACK_FAQ;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIdx((curr) => (curr === i ? null : i));

  return (
    <section id="faq" className="bg-cream scroll-mt-24 border-b border-warm-border">
      <div className="container-wide py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-start">
          {/* Left column */}
          <aside className="lg:col-span-5 lg:sticky lg:top-32">
            <p className="kicker-plain mb-6" data-reveal>
              <span className="text-bronze mr-3">04</span>
              Inquiries
            </p>

            <h2 className="section-heading text-ink" data-reveal>
              Frequently<br />
              <span className="italic font-extralight">asked.</span>
            </h2>

            <p className="mt-8 text-[15px] font-body font-light text-ink-mid leading-[1.85] max-w-md" data-reveal>
              If your question isn&apos;t here, we typically reply to direct inquiries within a single business day.
            </p>

            <div className="mt-12" data-reveal>
              <Link
                href={`/${locale}/contact`}
                className="group inline-flex items-center gap-3 border-b border-ink pb-2 text-[11px] font-body font-medium tracking-[0.26em] uppercase text-ink transition-colors hover:text-bronze hover:border-bronze"
              >
                Ask a question
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
          </aside>

          {/* Accordion */}
          <ul className="lg:col-span-7 border-t border-warm-border" data-reveal-stagger>
            {FAQ.map((item, i) => {
              const isOpen = i === openIdx;
              return (
                <li key={i} data-reveal="lift" className="border-b border-warm-border">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    className="w-full flex items-start gap-6 py-8 md:py-9 text-left group"
                  >
                    <span
                      className={`shrink-0 w-10 font-body text-[10px] font-medium tracking-[0.28em] uppercase mt-2 transition-colors duration-300 ${
                        isOpen ? 'text-bronze' : 'text-ink-light'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <h3
                      className={`flex-1 font-display text-xl md:text-2xl font-light leading-snug tracking-[-0.01em] transition-colors duration-300 ${
                        isOpen ? 'text-ink' : 'text-ink/80 group-hover:text-ink'
                      }`}
                    >
                      {item.q}
                    </h3>

                    <span
                      aria-hidden
                      className={`shrink-0 mt-1 w-8 h-8 flex items-center justify-center transition-all duration-500 ease-out ${
                        isOpen ? 'rotate-[225deg] text-ink' : 'rotate-0 text-ink-light group-hover:text-ink'
                      }`}
                    >
                      <Plus size={18} strokeWidth={1.25} />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${i}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-[700ms] ease-out-expo ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 pb-9' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-16 pr-4 md:pr-12">
                        <p
                          className="text-[15px] font-body font-light text-ink-mid leading-[1.85] max-w-[60ch]"
                          style={{
                            transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
                            opacity: isOpen ? 1 : 0,
                            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
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
