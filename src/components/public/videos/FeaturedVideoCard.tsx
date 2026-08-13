import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import { formatVideoDate, formatVideoDuration, type VideoListItem } from '@/lib/video-utils';

export default function FeaturedVideoCard({
  video,
  locale,
  featuredLabel = 'Featured',
  categoryFallback = 'Video',
  watchLabel = 'Watch now',
}: {
  video: VideoListItem;
  locale: string;
  featuredLabel?: string;
  categoryFallback?: string;
  watchLabel?: string;
}) {
  const thumb = video.thumbnailUrl || '/images/placeholder.svg';
  const categoryLabel = video.category || categoryFallback;
  const duration = formatVideoDuration(video.durationSeconds);
  const dateLabel = formatVideoDate(video.publishedAt, locale);
  const href = `/${locale}/videos/${video.slug}`;

  return (
    <article className="group grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
      <Link
        href={href}
        aria-label={`${watchLabel}: ${video.title}`}
        className="relative block aspect-[16/10] overflow-hidden bg-ink shadow-[0_32px_72px_rgba(32,28,24,0.18)] lg:col-span-7"
      >
        <GalleryImage
          path={thumb}
          alt={video.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
        />
        <span
          className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-ink/0 opacity-60 transition-opacity duration-500 group-hover:opacity-90"
          aria-hidden
        />
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="grid h-16 w-16 place-items-center rounded-full border border-cream/60 bg-ink/30 text-cream backdrop-blur-[2px] transition-all duration-500 ease-out-expo group-hover:h-[4.5rem] group-hover:w-[4.5rem] group-hover:border-cream group-hover:bg-ink/50 md:h-20 md:w-20">
            <Play className="ms-1 h-6 w-6 fill-current md:h-7 md:w-7" strokeWidth={1.5} />
          </span>
        </span>
        {duration && (
          <span className="absolute bottom-4 end-4 bg-ink/75 px-2.5 py-1 font-body text-[12px] font-medium tracking-[0.08em] text-cream backdrop-blur-[2px]">
            {duration}
          </span>
        )}
      </Link>

      <div className="lg:col-span-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-[11px] font-semibold uppercase tracking-[0.15em]">
          <span className="bg-ink px-2.5 py-1.5 text-cream">{featuredLabel}</span>
          <span className="text-bronze">{categoryLabel}</span>
        </div>

        <h2 className="mt-6 font-display text-[clamp(1.9rem,3.1vw,2.75rem)] font-light leading-[1.06] tracking-[-0.02em] text-ink">
          <Link
            href={href}
            className="bg-left-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 hover:bg-[length:100%_1px] rtl:bg-right-bottom"
          >
            {video.title}
          </Link>
        </h2>

        {video.excerpt && (
          <p className="mt-5 line-clamp-3 max-w-[52ch] font-body text-[15.5px] font-normal leading-[1.65] text-ink-mid">
            {video.excerpt}
          </p>
        )}

        {(dateLabel || duration) && (
          <div className="mt-6 flex flex-wrap items-center gap-3 font-body text-[11px] font-normal uppercase tracking-[0.12em] text-ink-mid">
            {dateLabel && <span>{dateLabel}</span>}
            {dateLabel && duration && <span className="h-1 w-1 rounded-full bg-warm-border" aria-hidden />}
            {duration && <span>{duration}</span>}
          </div>
        )}

        <Link
          href={href}
          aria-label={`${watchLabel}: ${video.title}`}
          className="group/cta mt-8 inline-flex items-center gap-3 border border-ink px-7 py-3.5 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
        >
          <Play className="h-3.5 w-3.5 fill-current" strokeWidth={1.5} />
          {watchLabel}
          <ArrowRight
            size={13}
            strokeWidth={1.75}
            className="transition-transform duration-500 ease-out-expo group-hover/cta:translate-x-1 rtl:-scale-x-100 rtl:group-hover/cta:-translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}
