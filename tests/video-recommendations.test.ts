import assert from 'node:assert/strict';
import { pickVideosForProducts } from '../src/lib/product-videos';
import {
  recommendProductsForVideo,
  type LocalizedVideoPost,
  type ProductRecommendationInput,
  type VideoListItem,
} from '../src/lib/video-utils';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

const sparseVideo: LocalizedVideoPost = {
  id: 'video-1',
  slug: 'factory-clip',
  status: 'published',
  sourceType: 'upload',
  videoUrl: null,
  embedUrl: null,
  thumbnailUrl: null,
  category: null,
  tags: [],
  durationSeconds: null,
  publishedAt: null,
  updatedAt: null,
  title: 'Factory clip',
  excerpt: 'Short walkthrough',
  body: '',
  searchText: 'Factory clip Short walkthrough',
};

test('recommendProductsForVideo falls back when sparse video copy has no product keyword overlap', () => {
  const products: ProductRecommendationInput[] = [
    { id: '1', title: 'Rectangular LED Mirror' },
    { id: '2', title: 'Round Vanity Mirror' },
  ];

  assert.deepEqual(
    recommendProductsForVideo(sparseVideo, products, 2).map((product) => product.id),
    ['1', '2'],
  );
});

const video = (id: string, title: string, excerpt = ''): VideoListItem => ({
  id,
  slug: id,
  sourceType: 'upload',
  videoUrl: null,
  embedUrl: null,
  thumbnailUrl: null,
  category: null,
  tags: [],
  durationSeconds: null,
  publishedAt: null,
  title,
  excerpt,
  searchText: `${title} ${excerpt}`,
});

test('pickVideosForProducts still fills the block when product copy shares nothing with any video', () => {
  const product: ProductRecommendationInput = { id: '1', title: 'Slim Bathroom Mirror' };
  assert.deepEqual(pickVideosForProducts([product], [video('video-1', 'Factory clip', 'Short walkthrough')]).get('1'), ['video-1']);
});

test('the video named after the product comes first, however long the other excerpts run', () => {
  const product: ProductRecommendationInput = { id: '1', title: 'Capsule Shaped Frosted LED Mirror', description: 'A frosted capsule mirror.' };
  const longWinded = 'Frameless backlit LED bathroom mirror with anti-fog, touch dimming, three colours and a frosted capsule-like glow. '.repeat(12);
  const picks = pickVideosForProducts(
    [product],
    [
      video('oval', 'Frameless Irregular Oval LED Bathroom Mirror', longWinded),
      video('capsule', 'Frameless Capsule LED Bathroom Mirror Showcase', 'A capsule mirror.'),
      video('factory', 'Factory tour', 'How the mirrors are made.'),
    ],
  );
  assert.equal(picks.get('1')![0], 'capsule');
});

test('runner-up videos spread out instead of following the best match onto every page', () => {
  const products: ProductRecommendationInput[] = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), title: `Oval Backlit LED Mirror ${i + 1}` }));
  const videos = [
    video('oval', 'Oval Backlit LED Mirror Demo'),
    video('backlit', 'Backlit LED Mirror Overview'),
    video('round', 'Round LED Mirror'),
    video('arch', 'Arch LED Mirror'),
    video('cabinet', 'Wood Mirror Cabinet'),
  ];
  const picks = pickVideosForProducts(products, videos, 3);
  const shown = new Map(videos.map((v) => [v.id, 0]));
  for (const list of picks.values()) {
    assert.equal(list.length, 3);
    assert.equal(new Set(list).size, 3);
    // The best match is never given up for the spread...
    assert.equal(list[0], 'oval');
    for (const id of list) shown.set(id, shown.get(id)! + 1);
  }
  // ...but the runner-up stops at 1.3 times an even share (3 cards x 10 pages / 5 videos = 6), not 10.
  assert.equal(shown.get('backlit'), Math.ceil((1.3 * 3 * 10) / 5));
});

test('with one card each, every product simply gets its best match', () => {
  const videos = [video('round', 'Round LED Mirror'), video('arch', 'Arch LED Mirror')];
  const round: ProductRecommendationInput = { id: '1', title: 'Round Backlit LED Mirror' };
  const arch: ProductRecommendationInput = { id: '2', title: 'Arch Frameless LED Mirror' };
  assert.deepEqual(pickVideosForProducts([round, arch], videos, 1).get('1'), ['round']);
  assert.deepEqual(pickVideosForProducts([round, arch], videos, 1).get('2'), ['arch']);
  assert.deepEqual(pickVideosForProducts([], videos, 3), new Map());
});
