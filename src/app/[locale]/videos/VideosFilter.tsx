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
    <>
      <section className="bg-cream sticky top-[72px] md:top-20 z-30 border-b border-warm-border">
        <div className="container-wide py-5 md:py-6">
          <div className="flex justify-end">
            <div className="relative w-full md:w-80 flex-shrink-0">
              <Search size={15} strokeWidth={1.75} className="absolute start-0 top-1/2 -translate-y-1/2 text-ink-mid" />
              <input
                type="text"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-7 pe-8 py-2.5 text-[15px] font-body font-normal text-ink placeholder:text-ink-mid bg-transparent border-0 border-b border-warm-border focus:outline-none focus:border-ink transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={t('clearSearch')}
                  className="absolute end-0 top-1/2 -translate-y-1/2 text-ink-mid hover:text-ink transition-colors"
                >
                  <X size={15} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container-wide py-14 md:py-20">
          <p className="text-[14px] font-body font-semibold text-ink tracking-[0.08em] uppercase mb-8 md:mb-12">
            {filtered.length === 0 ? t('noResults') : t('showing', { count: filtered.length })}
          </p>

          {filtered.length === 0 ? (
            <div className="py-20 text-center border-t border-warm-border">
              <p className="font-display text-2xl font-normal text-ink-mid">{t('empty')}</p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 md:gap-x-10 md:gap-y-16 animate-fade-up"
            >
              {filtered.map((video, i) => (
                <VideoCard key={video.id} video={video} locale={locale} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
