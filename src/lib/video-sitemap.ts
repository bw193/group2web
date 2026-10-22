import { snippet, w3cDateTime } from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';
import { getVideoPlayback, type LocalizedVideoPost } from '@/lib/video-utils';

/**
 * A video page's `<video:video>` entry, from the same fields as its
 * VideoObject: the title and description the page shows, its thumbnail, and
 * the player it embeds. Text is raw here; `videoSitemapXml` escapes it.
 */
export interface SitemapVideo {
  thumbnailLoc: string;
  title: string;
  description: string;
  contentLoc?: string;
  playerLoc?: string;
  duration?: number;
  publicationDate?: string;
}

export interface VideoSitemapEntry {
  url: string;
  lastModified: string | null;
  video: SitemapVideo;
}

const ABSOLUTE_URL_RE = /^https?:\/\//;

/** Null when Google would reject the entry: no title, thumbnail or player. */
export function buildSitemapVideo(video: LocalizedVideoPost): SitemapVideo | null {
  const title = video.title.replace(/\s+/g, ' ').trim();
  const thumbnail = video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) : '';
  const playback = getVideoPlayback(video);
  if (!title || !ABSOLUTE_URL_RE.test(thumbnail) || !ABSOLUTE_URL_RE.test(playback.src)) return null;

  const duration = Math.round(video.durationSeconds ?? 0);
  return {
    thumbnailLoc: thumbnail,
    // Google's schema allows 100 characters for a title and 2,048 for a
    // description. snippet() can return one over its limit (the ellipsis).
    title: snippet(title, 99),
    description: snippet(video.excerpt || video.seoDescription || title, 2047),
    // YouTube and Vimeo videos are listed by the player the page embeds,
    // uploads by the file itself.
    ...(playback.kind === 'embed' ? { playerLoc: playback.src } : { contentLoc: playback.src }),
    duration: duration >= 1 && duration <= 28800 ? duration : undefined,
    publicationDate: w3cDateTime(video.publishedAt),
  };
}

// Characters XML 1.0 forbids outright are dropped; markup characters escaped.
function xmlText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The video sitemap. Written here rather than through Next's sitemap.ts,
 * whose writer (15.4 through 16.4) neither escapes video text, so one "&"
 * in a title breaks the file, nor follows the tag order of Google's schema.
 */
export function videoSitemapXml(entries: VideoSitemapEntry[]): string {
  const element = (name: string, value: string | number | undefined) =>
    value === undefined ? '' : `<${name}>${xmlText(String(value))}</${name}>\n`;

  const urls = entries.map(({ url, lastModified, video }) =>
    [
      '<url>\n',
      element('loc', url),
      element('lastmod', w3cDateTime(lastModified)),
      '<video:video>\n',
      // Google's schema fixes this order.
      element('video:thumbnail_loc', video.thumbnailLoc),
      element('video:title', video.title),
      element('video:description', video.description),
      element('video:content_loc', video.contentLoc),
      element('video:player_loc', video.playerLoc),
      element('video:duration', video.duration),
      element('video:publication_date', video.publicationDate),
      '</video:video>\n',
      '</url>\n',
    ].join(''),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>\n',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n',
    ...urls,
    '</urlset>\n',
  ].join('');
}
