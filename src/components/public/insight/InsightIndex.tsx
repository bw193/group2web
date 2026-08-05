'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import FeaturedStory from './FeaturedStory';
import StoryRow from './StoryRow';
import type { CategoryTab, DisplayArticle } from './types';

/**
 * Client island for the journal index. The server page renders the complete
 * article list into the initial HTML (every story is crawlable); this island
 * only filters by category and swaps the lead + row list with the shared
 * fade-up. The newest story of whatever list is on screen is promoted to the
 * lead spread, so filtering never leaves the page without a headline.
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

  const [lead, ...rest] = filtered;

  return (
    <section className="bg-cream">
      {/* Rule bar: category tabs + story count. Full-bleed so the hairlines run
          edge to edge, and sticky under the fixed header so the filter stays
          reachable down a long list. */}
      <div className="sticky top-[72px] md:top-20 z-20 bg-cream/95 backdrop-blur-sm border-y border-warm-border">
        <div className="container-wide flex items-baseline justify-between gap-x-8 py-4">
          <div className="flex items-baseline gap-x-7 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const on = tab.key === active;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActive(tab.key)}
                  aria-pressed={on}
                  className={`inline-flex shrink-0 items-baseline gap-2 py-1 text-[12px] font-body font-semibold tracking-[0.16em] uppercase transition-colors duration-300 ${
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
          <span className="hidden sm:block text-[12px] font-body tracking-[0.14em] uppercase text-ink-light whitespace-nowrap">
            {t('count', { count: filtered.length })}
          </span>
        </div>
      </div>

      <div className="container-wide pb-24 md:pb-32">
        {filtered.length === 0 ? (
          <div className="py-24 md:py-32 text-center">
            <span className="block w-8 h-px bg-bronze mx-auto mb-7" aria-hidden />
            <p className="font-display text-2xl md:text-3xl font-light text-ink-mid">{t('empty')}</p>
          </div>
        ) : (
          /* The lead and the rows carry bottom rules so the bar's own rule opens
             the list without doubling, and the final row closes it. */
          <div key={active} className="animate-fade-up">
            <FeaturedStory article={lead} label={t('latest')} readLabel={t('readStory')} />
            {rest.map((a, i) => (
              <StoryRow
                key={a.id}
                article={a}
                indexLabel={String(i + 2).padStart(2, '0')}
                eager={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
