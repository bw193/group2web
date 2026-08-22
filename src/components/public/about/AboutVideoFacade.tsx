'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface Props {
  /** Playback target resolved by `getVideoPlayback`; callers filter out `missing`. */
  kind: 'embed' | 'video';
  src: string;
  title: string;
  poster: string;
  /** Shown when `poster` 404s — YouTube only stores `maxresdefault` for HD uploads. */
  posterFallback?: string;
  /** Localized accessible name for the play button, e.g. "Watch the factory tour". */
  playLabel: string;
  duration?: string;
  className?: string;
}

function withAutoplay(src: string): string {
  try {
    const url = new URL(src);
    url.searchParams.set('autoplay', '1');
    if (/(?:^|\.)youtube(?:-nocookie)?\.com$/.test(url.hostname)) {
      url.searchParams.set('rel', '0');
      url.searchParams.set('playsinline', '1');
    }
    return url.toString();
  } catch {
    return src;
  }
}

function warmConnection(src: string) {
  try {
    const { origin } = new URL(src);
    if (document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.append(link);
  } catch {
    // Relative src — nothing to warm.
  }
}

/**
 * Poster stand-in for the About page video: the real player (a ~1MB YouTube
 * embed plus several blocking connections) is only mounted after the visitor
 * clicks. The handshake is warmed on hover/focus so the click feels instant,
 * and playback starts immediately via the autoplay param.
 */
export default function AboutVideoFacade({
  kind,
  src,
  title,
  poster,
  posterFallback,
  playLabel,
  duration,
  className = '',
}: Props) {
  const [active, setActive] = useState(false);
  const [posterSrc, setPosterSrc] = useState(poster);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const warmed = useRef(false);

  const warm = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    warmConnection(src);
  }, [src]);

  const fallBackPoster = useCallback(() => {
    setPosterSrc((current) => (posterFallback && current !== posterFallback ? posterFallback : current));
  }, [posterFallback]);

  // A poster that 404s before hydration never fires `onError`, so re-check the
  // decoded size once the handler is actually attached.
  useEffect(() => {
    const img = posterRef.current;
    if (img?.complete && img.naturalWidth === 0) fallBackPoster();
  }, [posterSrc, fallBackPoster]);

  return (
    <div className={`relative isolate aspect-video w-full overflow-hidden bg-espresso ${className}`}>
      {active ? (
        kind === 'embed' ? (
          <iframe
            src={withAutoplay(src)}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full bg-black object-contain"
            src={src}
            poster={posterSrc || undefined}
            aria-label={title}
            autoPlay
            controls
            playsInline
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          onPointerEnter={warm}
          onFocus={warm}
          aria-label={`${playLabel}: ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          {posterSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={posterRef}
              src={posterSrc}
              onError={fallBackPoster}
              alt=""
              width={1280}
              height={720}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.03]"
            />
          )}
          <span
            className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10 transition-opacity duration-500 group-hover:opacity-85"
            aria-hidden
          />

          {/* Play control with a slow sonar ring so the frame reads as playable at a glance. */}
          <span className="absolute inset-0 grid place-items-center" aria-hidden>
            <span className="relative grid place-items-center">
              <span className="absolute h-16 w-16 rounded-full bg-cream/25 motion-safe:animate-ping motion-reduce:hidden [animation-duration:2.6s] md:h-20 md:w-20" />
              <span className="relative grid h-16 w-16 place-items-center rounded-full border border-cream/70 bg-ink/55 text-cream shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-[2px] transition-all duration-500 ease-out-expo group-hover:scale-110 group-hover:border-cream group-hover:bg-ink/75 md:h-20 md:w-20">
                <Play className="ms-1 h-6 w-6 fill-current md:h-7 md:w-7" strokeWidth={1.25} />
              </span>
            </span>
          </span>

          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-5 md:p-7" aria-hidden>
            <span className="max-w-[52ch] text-start font-body text-[13px] font-normal leading-snug text-cream/95 md:text-[15px]">
              {title}
            </span>
            {duration && (
              <span className="shrink-0 bg-ink/70 px-2 py-1 font-body text-[11px] font-medium tracking-[0.08em] text-cream backdrop-blur-[2px]">
                {duration}
              </span>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
