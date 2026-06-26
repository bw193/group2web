import { PlayCircle } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';
import { getVideoPlayback, type LocalizedVideoPost, type VideoListItem } from '@/lib/video-utils';

type PlayerVideo = Pick<
  LocalizedVideoPost | VideoListItem,
  'title' | 'sourceType' | 'videoUrl' | 'embedUrl' | 'thumbnailUrl'
>;

export default function VideoPlayer({ video, className = '' }: { video: PlayerVideo; className?: string }) {
  const playback = getVideoPlayback(video);
  const poster = video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) : undefined;

  return (
    <div className={`relative aspect-video overflow-hidden bg-ink ${className}`}>
      {playback.kind === 'embed' ? (
        <iframe
          src={playback.src}
          title={video.title}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : playback.kind === 'video' ? (
        <video
          className="h-full w-full bg-black object-contain"
          src={playback.src}
          poster={poster}
          controls
          preload="metadata"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-cream">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          )}
          <PlayCircle className="relative h-14 w-14 text-cream/85" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
