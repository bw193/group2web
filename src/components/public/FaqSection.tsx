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
            <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5" data-reveal>
              FAQ
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em]" data-reveal>
              Frequently asked
            </h2>

            <p className="mt-6 text-[17px] font-body font-normal text-ink leading-[1.6] max-w-md" data-reveal>
              If your question isn&apos;t here, we typically reply to direct inquiries within a single business day.
            </p>

            <div className="mt-10" data-reveal>
              <Link
                href={`/${locale}/contact`}
                className="btn-primary group"
              >
                Ask a question
                <ArrowRight size={14} strokeWidth={1.75} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
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
                    className="w-full flex items-start gap-6 py-7 md:py-8 text-left group"
                  >
                    <h3
                      className={`flex-1 font-display text-[19px] md:text-[22px] font-normal leading-snug tracking-[-0.005em] transition-colors duration-300 ${
                        isOpen ? 'text-ink' : 'text-ink group-hover:text-bronze'
                      }`}
                    >
                      {item.q}
                    </h3>

                    <span
                      aria-hidden
                      className={`shrink-0 mt-1 w-8 h-8 flex items-center justify-center transition-all duration-500 ease-out ${
                        isOpen ? 'rotate-[225deg] text-bronze' : 'rotate-0 text-ink-mid group-hover:text-ink'
                      }`}
                    >
                      <Plus size={20} strokeWidth={1.75} />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${i}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-[700ms] ease-out-expo ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pr-4 md:pr-12">
                        <p
                          className="text-[16px] font-body font-normal text-ink leading-[1.65] max-w-[62ch]"
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
