import Image from 'next/image';
import { getUploadUrl } from '@/lib/utils';
import { isOptimizedKey, optimizedSrc, optimizedSrcSet } from '@/lib/optimized-images';

interface Props {
  /** Stored image key (e.g. `facility/floor-3f9k2a-opt@1600.webp`) or a local `/…` path. */
  path: string;
  alt: string;
  /** Responsive `sizes` so the right width is chosen per viewport. */
  sizes: string;
  className?: string;
  /** Fill the nearest positioned ancestor (most gallery tiles). */
  fill?: boolean;
  /** Intrinsic size — used when `fill` is not set. */
  width?: number;
  height?: number;
  /** Only affects the legacy/Vercel path; optimized images are baked at upload. */
  quality?: number;
  priority?: boolean;
}

/**
 * A gallery image with a per-image serving decision:
 *
 *  - **Pre-optimized company-photo keys** (`-opt@<w>.webp`) render as a plain
 *    `<img>` with a Supabase `srcSet` — served straight from the CDN, never
 *    hitting Vercel's `/_next/image`, so there is no optimization charge.
 *  - **Everything else** (legacy uploads, local assets) renders via `next/image`,
 *    so Vercel keeps optimizing it exactly as before. No migration required, and
 *    this works in both Server and Client Components (no function props).
 */
export default function GalleryImage({
  path,
  alt,
  sizes,
  className = '',
  fill = false,
  width,
  height,
  quality,
  priority = false,
}: Props) {
  const isLocal = path.startsWith('/');

  if (!isLocal && isOptimizedKey(path)) {
    const url = getUploadUrl(path);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizedSrc(url)}
        srcSet={optimizedSrcSet(url)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
        {...(fill ? {} : { width, height })}
      />
    );
  }

  const src = isLocal ? path : getUploadUrl(path);
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
      {...(fill ? { fill: true } : { width: width as number, height: height as number })}
    />
  );
}
