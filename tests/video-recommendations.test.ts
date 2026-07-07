import assert from 'node:assert/strict';
import {
  recommendProductsForVideo,
  recommendVideosForProduct,
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

test('recommendVideosForProduct falls back when product copy has no video keyword overlap', () => {
  const product: ProductRecommendationInput = { id: '1', title: 'Slim Bathroom Mirror' };
  const videos: VideoListItem[] = [
    {
      id: 'video-1',
      slug: 'factory-clip',
      sourceType: 'upload',
      videoUrl: null,
      embedUrl: null,
      thumbnailUrl: null,
      category: null,
      tags: [],
      durationSeconds: null,
      publishedAt: null,
      title: 'Factory clip',
      excerpt: 'Short walkthrough',
      searchText: 'Factory clip Short walkthrough',
    },
  ];

  assert.deepEqual(
    recommendVideosForProduct(product, videos, 3).map((video) => video.id),
    ['video-1'],
  );
});
