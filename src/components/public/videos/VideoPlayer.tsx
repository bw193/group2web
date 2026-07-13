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
  const mediaClassName = 'shadow-[0_24px_64px_rgba(32,28,24,0.16)]';

  if (playback.kind === 'embed') {
    return (
      <div className={`relative isolate aspect-video w-full overflow-hidden bg-ink ${mediaClassName} ${className}`}>
        <iframe
          src={playback.src}
          title={video.title}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (playback.kind === 'video') {
    return (
      <div className={`flex w-full justify-center ${className}`}>
        <video
          className={`block h-auto max-h-[min(78svh,820px)] w-auto max-w-full bg-black object-contain ${mediaClassName}`}
          src={playback.src}
          poster={poster}
          aria-label={video.title}
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div className={`relative isolate inline-grid max-w-full place-items-center overflow-hidden bg-ink text-cream ${mediaClassName}`}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="block h-auto max-h-[min(78svh,820px)] w-auto max-w-full opacity-70" />
        ) : (
          <span className="aspect-video w-[min(100vw-3rem,720px)]" aria-hidden />
        )}
        <PlayCircle className="absolute h-14 w-14 text-cream/85" strokeWidth={1.5} />
      </div>
    </div>
  );
}
