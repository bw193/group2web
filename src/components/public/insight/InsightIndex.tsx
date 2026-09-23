import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FeaturedStory from './FeaturedStory';
import StoryRow from './StoryRow';
import type { CategoryTab, DisplayArticle } from './types';

/**
 * The journal list, shared by /insight and every /insight/<category> landing
 * page. It used to be a client island that filtered the index in place; now
 * that each category has a URL of its own, the tabs are links and the server
 * renders the filtered list — same markup, no client JS, every category
 * crawlable. The newest story of the list on screen is promoted to the lead
 * spread, so a category page never opens without a headline.
 */
export default async function InsightIndex({
  articles,
  tabs,
  activeKey = 'all',
}: {
  articles: DisplayArticle[];
  tabs: CategoryTab[];
  activeKey?: string;
}) {
  const t = await getTranslations('insight');
  const [lead, ...rest] = articles;

  return (
    <section className="bg-cream">
      {/* Rule bar: category links + story count. Full-bleed so the hairlines run
          edge to edge, and sticky under the fixed header so the categories stay
          reachable down a long list. */}
      <div className="sticky top-[72px] md:top-20 z-20 bg-cream/95 backdrop-blur-sm border-y border-warm-border">
        <div className="container-wide flex items-baseline justify-between gap-x-8 py-4">
          <div className="flex items-baseline gap-x-7 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const on = tab.key === activeKey;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  aria-current={on ? 'page' : undefined}
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
                </Link>
              );
            })}
          </div>
          <span className="hidden sm:block text-[12px] font-body tracking-[0.14em] uppercase text-ink-light whitespace-nowrap">
            {t('count', { count: articles.length })}
          </span>
        </div>
      </div>

      <div className="container-wide pb-24 md:pb-32">
        {articles.length === 0 ? (
          <div className="py-24 md:py-32 text-center">
            <span className="block w-8 h-px bg-bronze mx-auto mb-7" aria-hidden />
            <p className="font-display text-2xl md:text-3xl font-light text-ink-mid">{t('empty')}</p>
          </div>
        ) : (
          /* The lead and the rows carry bottom rules so the bar's own rule opens
             the list without doubling, and the final row closes it. */
          <div className="animate-fade-up">
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
