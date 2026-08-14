import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import { localizedPath } from '@/lib/public-paths';
import { formatVideoDate, formatVideoDuration, type VideoListItem } from '@/lib/video-utils';

export default function VideoCard({
  video,
  locale,
  index = 0,
  categoryFallback = 'Video',
  watchLabel = 'Watch video',
}: {
  video: VideoListItem;
  locale: string;
  index?: number;
  categoryFallback?: string;
  watchLabel?: string;
}) {
  const thumb = video.thumbnailUrl || '/images/placeholder.svg';
  const categoryLabel = video.category || categoryFallback;
  const duration = formatVideoDuration(video.durationSeconds);
  const dateLabel = formatVideoDate(video.publishedAt, locale);
  const videoHref = localizedPath(locale, `/videos/${video.slug}`);

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={videoHref}
        aria-label={`${watchLabel}: ${video.title}`}
        className="relative mb-5 block aspect-video overflow-hidden bg-ink"
      >
        <GalleryImage
          path={thumb}
          alt={video.title}
          fill
          priority={index < 2}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.045]"
        />
        <span
          className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-ink/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="grid h-14 w-14 place-items-center rounded-full border border-cream/60 bg-ink/30 text-cream backdrop-blur-[2px] transition-all duration-500 ease-out-expo group-hover:h-16 group-hover:w-16 group-hover:border-cream group-hover:bg-ink/50">
            <Play className="ms-0.5 h-5 w-5 fill-current" strokeWidth={1.5} />
          </span>
        </span>
        {duration && (
          <span className="absolute bottom-3 end-3 bg-ink/75 px-2 py-1 font-body text-[11px] font-medium tracking-[0.08em] text-cream backdrop-blur-[2px]">
            {duration}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex min-h-[18px] items-baseline justify-between gap-3 font-body text-[11px] uppercase tracking-[0.14em]">
          <span className="font-semibold text-bronze">{categoryLabel}</span>
          {dateLabel && <span className="font-normal tracking-[0.06em] text-ink-mid">{dateLabel}</span>}
        </div>

        <h3 className="mb-3 line-clamp-2 font-display text-[23px] font-normal leading-[1.16] tracking-[-0.01em] text-ink">
          <Link
            href={videoHref}
            className="bg-left-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px] rtl:bg-right-bottom"
          >
            {video.title}
          </Link>
        </h3>

        {video.excerpt && (
          <p className="mb-6 line-clamp-2 font-body text-[14px] font-normal leading-[1.6] text-ink-mid">
            {video.excerpt}
          </p>
        )}

        <Link
          href={videoHref}
          aria-label={`${watchLabel}: ${video.title}`}
          className="mt-auto inline-flex w-fit items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors duration-300 hover:text-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
        >
          {watchLabel}
          <ArrowRight
            size={13}
            strokeWidth={1.75}
            className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}
