import assert from 'node:assert/strict';
import { DEFAULT_ABOUT_VIDEO_SLUG, pickAboutVideo } from '../src/lib/video-utils';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

type Candidate = { slug: string; category: string | null; tags: string[]; title: Record<string, string> };

const factoryTour: Candidate = {
  slug: DEFAULT_ABOUT_VIDEO_SLUG,
  category: null,
  tags: [],
  title: { en: 'Professional LED Mirror Manufacturer in China | Chengtai Mirror Factory Tour' },
};

const archMirror: Candidate = {
  slug: 'arch-led-backlit-mirror',
  category: 'Product',
  tags: ['arch'],
  title: { en: 'Arch LED Backlit Mirror' },
};

const dressingMirror: Candidate = {
  slug: 'led-full-length-dressing-mirrors',
  category: null,
  tags: [],
  title: { en: 'LED Full Length Dressing Mirrors' },
};

test('pickAboutVideo honors the CMS-selected slug over the factory-tour default', () => {
  assert.equal(pickAboutVideo([factoryTour, archMirror], 'arch-led-backlit-mirror'), archMirror);
});

test('pickAboutVideo defaults to the factory tour when nothing is selected', () => {
  assert.equal(pickAboutVideo([archMirror, factoryTour, dressingMirror], null), factoryTour);
  assert.equal(pickAboutVideo([archMirror, factoryTour], ''), factoryTour);
});

test('pickAboutVideo falls back to the default when the selected slug is stale', () => {
  assert.equal(pickAboutVideo([factoryTour, archMirror], 'deleted-video'), factoryTour);
});

test('pickAboutVideo keyword-matches a re-slugged factory tour', () => {
  const renamedTour: Candidate = {
    slug: 'walk-our-production-floor',
    category: 'Factory',
    tags: ['factory tour'],
    title: { en: 'Walk our production floor' },
  };
  assert.equal(pickAboutVideo([archMirror, renamedTour], null), renamedTour);
});

test('pickAboutVideo returns null when no video is a plausible tour', () => {
  assert.equal(pickAboutVideo([archMirror], null), null);
  assert.equal(pickAboutVideo([], 'anything'), null);
});
