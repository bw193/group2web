'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((video) => {
      const matchSearch =
        !q ||
        video.title.toLowerCase().includes(q) ||
        video.excerpt.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [videos, search]);

  return (
    <section className="bg-cream pb-20 md:pb-28">
      <div className="container-wide">
        <div className="flex flex-col gap-5 border-t border-warm-border py-5 md:flex-row md:items-center md:justify-between md:py-3.5">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-ink">
            {filtered.length === 0 ? t('noResults') : t('showing', { count: filtered.length })}
          </p>

          <div className="relative w-full flex-shrink-0 md:w-[290px]">
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

        {filtered.length === 0 ? (
          <div className="border-t border-warm-border py-24 text-center">
            <p className="font-display text-2xl font-normal text-ink-mid">{t('empty')}</p>
          </div>
        ) : (
          <div className="animate-fade-up grid grid-cols-1 gap-x-7 gap-y-16 pt-5 sm:grid-cols-2 md:pt-0 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {filtered.map((video, i) => (
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
      </div>
    </section>
  );
}
