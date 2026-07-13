import Link from 'next/link';
import { Play } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import { formatVideoDuration, type VideoListItem } from '@/lib/video-utils';

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

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/${locale}/videos/${video.slug}`}
        aria-label={`${watchLabel}: ${video.title}`}
        className="relative mb-5 block aspect-[4/5] overflow-hidden bg-[#35322e] p-2.5 sm:p-3"
      >
        <GalleryImage
          path={thumb}
          alt={video.title}
          fill
          priority={index < 2}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain transition-[filter,opacity] duration-500 group-hover:brightness-[0.92]"
        />
        <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/5" aria-hidden />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex min-h-[18px] items-baseline justify-between gap-3 font-body text-[11px] uppercase tracking-[0.14em]">
          <span className="font-semibold text-bronze">{categoryLabel}</span>
          {duration && <span className="font-normal tracking-[0.06em] text-ink-mid">{duration}</span>}
        </div>

        <h3 className="mb-5 min-h-[calc(2*1.16em)] line-clamp-2 font-display text-[23px] font-normal leading-[1.16] tracking-[-0.01em] text-ink">
          <Link
            href={`/${locale}/videos/${video.slug}`}
            className="bg-left-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px] rtl:bg-right-bottom"
          >
            {video.title}
          </Link>
        </h3>

        <Link
          href={`/${locale}/videos/${video.slug}`}
          aria-label={`${watchLabel}: ${video.title}`}
          className="mt-auto flex h-9 w-9 items-center justify-center rounded-full border border-bronze text-ink transition-colors duration-300 hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
        >
          <Play className="ms-0.5 h-3.5 w-3.5 fill-current" strokeWidth={1.5} />
        </Link>
      </div>
    </article>
  );
}
