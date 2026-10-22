import { isIndexableLocalePath } from '@/lib/indexing';
import { localizedUrl } from '@/lib/seo';
import { buildSitemapVideo, videoSitemapXml, type VideoSitemapEntry } from '@/lib/video-sitemap';
import { getVideoSitemapRows } from '@/lib/videos';

// Cached like /sitemap.xml: built with the snapshot, refreshed every five
// minutes, and invalidated at once by CMS writes (revalidatePublicSitemap).
export const dynamic = 'force-static';
export const revalidate = 300;

// Every published video page in each indexable language, with the video it
// plays, so Search Console can list the videos. robots.txt points here.
export async function GET() {
  const entries: VideoSitemapEntry[] = [];
  try {
    for (const row of await getVideoSitemapRows()) {
      const pathAfterLocale = `/videos/${row.slug}`;
      if (row.status !== 'published' || !isIndexableLocalePath(row.locale, pathAfterLocale)) continue;
      const video = buildSitemapVideo(row.video);
      if (video) entries.push({ url: localizedUrl(row.locale, pathAfterLocale), lastModified: row.updatedAt, video });
    }
  } catch {
    // DB unavailable; serve what we have, as /sitemap.xml does.
  }

  return new Response(videoSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
