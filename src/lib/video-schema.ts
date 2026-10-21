import { getVideoPlayback, type LocalizedVideoPost, type VideoListItem } from '@/lib/video-utils';
import { SITE_LOGO_URL, SITE_NAME, SITE_URL, localizedUrl, w3cDateTime } from '@/lib/seo';

function toIsoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

/**
 * Stable node id for a video, so a page that only embeds it (e.g. About) can
 * point its `video` property at the entity instead of describing it twice.
 */
export function videoNodeId(slug: string, locale: string): string {
  return `${localizedUrl(locale, `/videos/${slug}`)}#video`;
}

export function buildVideoObjectSchema(video: LocalizedVideoPost | VideoListItem, locale: string): Record<string, unknown> {
  const url = localizedUrl(locale, `/videos/${video.slug}`);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.excerpt || '',
    thumbnailUrl: video.thumbnailUrl ? [video.thumbnailUrl] : [],
    uploadDate: w3cDateTime(video.publishedAt),
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO_URL },
    },
    inLanguage: locale,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  if (video.durationSeconds) schema.duration = toIsoDuration(video.durationSeconds);
  // Name what the page plays: the embed for YouTube and Vimeo, the file for
  // uploads. A YouTube link is a page, not a media file, so it is never the
  // contentUrl, and a stored link to a different video cannot leak in.
  const playback = getVideoPlayback(video);
  if (playback.kind === 'embed') schema.embedUrl = playback.src;
  if (playback.kind === 'video') schema.contentUrl = playback.src;
  return schema;
}
