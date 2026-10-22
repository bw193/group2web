import assert from 'node:assert/strict';
import { buildSitemapVideo, videoSitemapXml, type SitemapVideo } from '../src/lib/video-sitemap';
import type { LocalizedVideoPost } from '../src/lib/video-utils';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

const youtubeShort: LocalizedVideoPost = {
  id: 'video-1',
  slug: 'refined-rounded-corners-smooth-edge-details-highlight',
  status: 'published',
  sourceType: 'embed',
  videoUrl: 'https://youtube.com/shorts/CFAuTfDVIaw?feature=share',
  embedUrl: 'https://www.youtube.com/embed/CFAuTfDVIaw',
  thumbnailUrl: 'https://img.youtube.com/vi/CFAuTfDVIaw/hqdefault.jpg',
  category: null,
  tags: [],
  durationSeconds: null,
  publishedAt: '2026-09-24 00:00:00+00',
  updatedAt: '2026-10-17 00:55:35.932678+00',
  title: 'Refined Rounded Corners & Smooth Edge Details Highlight',
  excerpt: 'Edges under 2 mm are "polished" <by hand>.\n\nOEM & ODM welcome.',
  body: '',
  searchText: '',
};

const pageUrl = `https://chengtaimirror.com/en/videos/${youtubeShort.slug}`;

function entry(video: LocalizedVideoPost): SitemapVideo {
  const built = buildSitemapVideo(video);
  assert.ok(built);
  return built;
}

test('the video sitemap escapes text and writes tags in the order of Google’s schema', () => {
  assert.equal(
    videoSitemapXml([{ url: pageUrl, lastModified: youtubeShort.updatedAt, video: entry(youtubeShort) }]),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
      '<url>',
      `<loc>${pageUrl}</loc>`,
      '<lastmod>2026-10-17T00:55:35Z</lastmod>',
      '<video:video>',
      '<video:thumbnail_loc>https://img.youtube.com/vi/CFAuTfDVIaw/hqdefault.jpg</video:thumbnail_loc>',
      '<video:title>Refined Rounded Corners &amp; Smooth Edge Details Highlight</video:title>',
      '<video:description>Edges under 2 mm are &quot;polished&quot; &lt;by hand&gt;. OEM &amp; ODM welcome.</video:description>',
      '<video:player_loc>https://www.youtube.com/embed/CFAuTfDVIaw</video:player_loc>',
      '<video:publication_date>2026-09-24T00:00:00Z</video:publication_date>',
      '</video:video>',
      '</url>',
      '</urlset>',
      '',
    ].join('\n'),
  );
});

test('characters XML forbids are dropped instead of breaking the file', () => {
  const xml = videoSitemapXml([
    { url: pageUrl, lastModified: null, video: entry({ ...youtubeShort, title: 'Arch\u0008 Mirror\u0001' }) },
  ]);
  assert.ok(xml.includes('<video:title>Arch Mirror</video:title>'));
  assert.ok(!xml.includes('<lastmod>'));
});

test('YouTube videos are listed by the player the page embeds', () => {
  const video = entry(youtubeShort);
  assert.equal(video.playerLoc, 'https://www.youtube.com/embed/CFAuTfDVIaw');
  // A YouTube page is not a media file, so there is no content_loc.
  assert.equal(video.contentLoc, undefined);

  // When the stored link and the embed disagree, the embed is what plays.
  assert.equal(
    entry({ ...youtubeShort, videoUrl: 'https://youtu.be/Cthxd2CPDR4' }).playerLoc,
    'https://www.youtube.com/embed/CFAuTfDVIaw',
  );
});

test('uploaded videos are listed by their file', () => {
  const file = 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/product-videos/videos/tour.mp4';
  const video = entry({
    ...youtubeShort,
    sourceType: 'upload',
    videoUrl: file,
    embedUrl: null,
    thumbnailUrl: 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/product-videos/thumbnails/tour.jpg',
  });
  assert.equal(video.contentLoc, file);
  assert.equal(video.playerLoc, undefined);
});

test('publication dates are W3C datetimes and durations stay within 1 to 28,800 seconds', () => {
  assert.equal(entry(youtubeShort).publicationDate, '2026-09-24T00:00:00Z');
  assert.equal(entry({ ...youtubeShort, publishedAt: null }).publicationDate, undefined);
  assert.equal(entry({ ...youtubeShort, publishedAt: 'not a date' }).publicationDate, undefined);

  assert.equal(entry(youtubeShort).duration, undefined);
  assert.equal(entry({ ...youtubeShort, durationSeconds: 95 }).duration, 95);
  assert.equal(entry({ ...youtubeShort, durationSeconds: 30000 }).duration, undefined);
});

test('titles fit Google’s 100 characters and descriptions its 2,048', () => {
  const spanish = 'Proceso mejorado de acabado de bordes para esquinas redondeadas más suaves en la fabricación de espejos';
  const title = entry({ ...youtubeShort, title: spanish }).title;
  assert.ok(title.length <= 100);
  assert.ok(title.endsWith('…'));
  assert.equal(entry(youtubeShort).title, youtubeShort.title);

  // Unbroken text is the worst case: the cut lands exactly on the limit.
  assert.ok(entry({ ...youtubeShort, excerpt: 'x'.repeat(3000) }).description.length <= 2048);
  assert.ok(entry({ ...youtubeShort, excerpt: 'Polished edges and warm light. '.repeat(100) }).description.length <= 2048);

  assert.equal(entry({ ...youtubeShort, excerpt: '' }).description, youtubeShort.title);
});

test('videos Google would reject get no entry', () => {
  assert.equal(buildSitemapVideo({ ...youtubeShort, title: ' ' }), null);
  assert.equal(buildSitemapVideo({ ...youtubeShort, thumbnailUrl: null }), null);
  assert.equal(buildSitemapVideo({ ...youtubeShort, videoUrl: null, embedUrl: null }), null);
});
