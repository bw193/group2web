import Link from 'next/link';
import { Play } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';
import type { VideoListItem } from '@/lib/video-utils';

export default function VideoCard({
  video,
  locale,
  index = 0,
}: {
  video: VideoListItem;
  locale: string;
  index?: number;
}) {
  const thumb = video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) : '/images/placeholder.svg';

  return (
    <Link href={`/${locale}/videos/${video.slug}`} className="group block h-full">
      <article className="flex h-full flex-col">
        <div className="relative aspect-video overflow-hidden bg-ink mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt={video.title}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
          />
          <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-700" />
          <span className="absolute bottom-4 start-4 flex h-11 w-11 items-center justify-center rounded-full bg-bronze-light text-ink shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Play className="h-5 w-5 fill-current" strokeWidth={1.75} />
          </span>
        </div>

        <div className="flex flex-1 flex-col">
          <h3 className="font-display text-[22px] font-normal text-ink leading-[1.2] mb-3 tracking-[-0.005em] line-clamp-2 min-h-[calc(2*1.2em)]">
            {video.title}
          </h3>
          {video.excerpt && (
            <p className="text-[15px] font-body font-normal text-ink-mid line-clamp-3 leading-[1.6]">
              {video.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
