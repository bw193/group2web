import type { LocalizedVideoPost, VideoListItem } from '@/lib/video-utils';
import { SITE_LOGO_URL, SITE_NAME, SITE_URL, localizedUrl } from '@/lib/seo';

function toIsoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

export function buildVideoObjectSchema(video: LocalizedVideoPost | VideoListItem, locale: string): Record<string, unknown> {
  const url = localizedUrl(locale, `/videos/${video.slug}`);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.excerpt || '',
    thumbnailUrl: video.thumbnailUrl ? [video.thumbnailUrl] : [],
    uploadDate: video.publishedAt || undefined,
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
  if (video.embedUrl) schema.embedUrl = video.embedUrl;
  if (video.videoUrl) schema.contentUrl = video.videoUrl;
  return schema;
}
