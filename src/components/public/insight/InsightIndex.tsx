'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import StoryRow from './StoryRow';
import type { CategoryTab, DisplayArticle } from './types';

/**
 * Client island for the journal index. The server page renders the complete
 * article list into the initial HTML (every story is crawlable); this island
 * only filters by category and swaps the row list with the shared fade-up.
 */
export default function InsightIndex({
  articles,
  tabs,
}: {
  articles: DisplayArticle[];
  tabs: CategoryTab[];
}) {
  const t = useTranslations('insight');
  const [active, setActive] = useState('all');

  const filtered = useMemo(
    () => (active === 'all' ? articles : articles.filter((a) => a.categoryKey === active)),
    [articles, active],
  );

  return (
    <section className="bg-cream">
      <div className="container-wide pb-24 md:pb-32">
        {/* Rule bar: category tabs + story count */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-y border-warm-border py-4">
          <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
            {tabs.map((tab) => {
              const on = tab.key === active;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActive(tab.key)}
                  aria-pressed={on}
                  className={`inline-flex items-baseline gap-2 py-1 text-[12px] font-body font-semibold tracking-[0.16em] uppercase transition-colors duration-300 ${
                    on ? 'text-ink' : 'text-ink-mid hover:text-ink'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`block h-px self-center bg-bronze transition-all duration-500 ease-out-expo ${
                      on ? 'w-4' : 'w-0'
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <span className="text-[12px] font-body tracking-[0.14em] uppercase text-ink-light whitespace-nowrap">
            {t('count', { count: filtered.length })}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 md:py-32 text-center">
            <span className="block w-8 h-px bg-bronze mx-auto mb-7" aria-hidden />
            <p className="font-display text-2xl md:text-3xl font-light text-ink-mid">{t('empty')}</p>
          </div>
        ) : (
          /* Rows carry bottom rules so the bar's own rule opens the list
             without doubling, and the final row closes it. */
          <div key={active} className="animate-fade-up">
            {filtered.map((a, i) => (
              <StoryRow key={a.id} article={a} eager={i === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
