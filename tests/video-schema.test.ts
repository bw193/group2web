import assert from 'node:assert/strict';
import { buildVideoObjectSchema } from '../src/lib/video-schema';
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
  excerpt: 'Edges under 2 mm are polished by hand.',
  body: '',
  searchText: '',
};

test('VideoObject upload dates are ISO 8601, not the Postgres form rows carry', () => {
  assert.equal(buildVideoObjectSchema(youtubeShort, 'en').uploadDate, '2026-09-24T00:00:00Z');
  assert.equal(buildVideoObjectSchema({ ...youtubeShort, publishedAt: null }, 'en').uploadDate, undefined);
  assert.equal(buildVideoObjectSchema({ ...youtubeShort, publishedAt: 'not a date' }, 'en').uploadDate, undefined);
});

test('a YouTube VideoObject names the embed the page plays and has no contentUrl', () => {
  const schema = buildVideoObjectSchema(youtubeShort, 'en');
  assert.equal(schema.embedUrl, 'https://www.youtube.com/embed/CFAuTfDVIaw');
  assert.equal(schema.contentUrl, undefined);

  // A stored link to a different video stays out of the markup.
  const mismatched = buildVideoObjectSchema({ ...youtubeShort, videoUrl: 'https://youtu.be/Cthxd2CPDR4' }, 'en');
  assert.equal(mismatched.embedUrl, 'https://www.youtube.com/embed/CFAuTfDVIaw');
  assert.ok(!JSON.stringify(mismatched).includes('Cthxd2CPDR4'));

  // With no stored embed, the one built from the link is what plays.
  assert.equal(
    buildVideoObjectSchema({ ...youtubeShort, embedUrl: null }, 'en').embedUrl,
    'https://www.youtube.com/embed/CFAuTfDVIaw',
  );
});

test('an uploaded VideoObject names its file as the contentUrl', () => {
  const file = 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/product-videos/videos/tour.mp4';
  const schema = buildVideoObjectSchema({ ...youtubeShort, sourceType: 'upload', videoUrl: file, embedUrl: null }, 'en');
  assert.equal(schema.contentUrl, file);
  assert.equal(schema.embedUrl, undefined);
});
