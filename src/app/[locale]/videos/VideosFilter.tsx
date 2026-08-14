'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import FeaturedVideoCard from '@/components/public/videos/FeaturedVideoCard';
import VideoCard from '@/components/public/videos/VideoCard';
import type { VideoListItem } from '@/lib/video-utils';

export default function VideosFilter({
  videos,
  locale,
}: {
  videos: VideoListItem[];
  locale: string;
}) {
  const t = useTranslations('videos');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const video of videos) {
      const category = video.category?.trim();
      if (category) counts.set(category, (counts.get(category) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [videos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((video) => {
      const matchCategory = activeCategory === 'all' || video.category === activeCategory;
      const matchSearch =
        !q ||
        video.title.toLowerCase().includes(q) ||
        video.excerpt.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [videos, search, activeCategory]);

  const isDefaultView = activeCategory === 'all' && !search.trim();
  const featured = isDefaultView ? filtered[0] : undefined;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <section className="bg-cream pb-20 md:pb-28">
      <div className="container-wide">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-y border-warm-border py-4">
          <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
            {['all', ...categories].map((category) => {
              const on = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
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
                  {category === 'all' ? t('allCategories') : category}
                </button>
              );
            })}
          </div>

          <div className="flex w-full items-center gap-7 sm:w-auto">
            <span className="hidden whitespace-nowrap font-body text-[12px] uppercase tracking-[0.14em] text-ink-light md:block">
              {filtered.length === 0 ? t('noResults') : t('showing', { count: filtered.length })}
            </span>
            <div className="relative w-full flex-shrink-0 sm:w-[250px]">
              <Search size={15} strokeWidth={1.75} className="absolute start-0 top-1/2 -translate-y-1/2 text-ink-mid" />
              <input
                type="text"
                placeholder={t('search')}
                aria-label={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-0 border-b border-warm-border bg-transparent py-2.5 pe-8 ps-7 font-body text-[14px] font-normal text-ink outline-none transition-colors placeholder:text-ink-mid focus:border-ink"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={t('clearSearch')}
                  className="absolute end-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink-mid transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
                >
                  <X size={15} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center md:py-32">
            <span className="mx-auto mb-7 block h-px w-8 bg-bronze" aria-hidden />
            <p className="font-display text-2xl font-light text-ink-mid md:text-3xl">{t('empty')}</p>
          </div>
        ) : (
          <>
            {featured && (
              <div className="border-b border-warm-border py-12 md:py-16">
                <FeaturedVideoCard
                  video={featured}
                  locale={locale}
                  featuredLabel={t('featured')}
                  categoryFallback={t('videoFallback')}
                  watchLabel={t('watchNow')}
                />
              </div>
            )}
            {rest.length > 0 && (
              <div
                key={`${activeCategory}-${search.trim()}`}
                className="animate-fade-up grid grid-cols-1 gap-x-8 gap-y-14 pt-12 sm:grid-cols-2 md:pt-16 lg:grid-cols-3"
              >
                {rest.map((video, i) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    locale={locale}
                    index={i}
                    categoryFallback={t('videoFallback')}
                    watchLabel={t('watchVideo')}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
