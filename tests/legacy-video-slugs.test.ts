import assert from 'node:assert/strict';
import test from 'node:test';
import { LEGACY_VIDEO_SLUGS, movedVideoSlug } from '../src/lib/legacy-video-slugs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const factoryId = LEGACY_VIDEO_SLUGS['professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-tour'];
const live = [
  { id: factoryId, slug: 'professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-overview', status: 'published' },
];

test('every old video address names a video id and is shaped like a slug', () => {
  const entries = Object.entries(LEGACY_VIDEO_SLUGS);
  assert.ok(entries.length > 0);
  for (const [slug, id] of entries) {
    assert.match(slug, SLUG, slug);
    assert.match(id, UUID, slug);
  }
});

test('an old address goes to the current slug of its published video', () => {
  assert.equal(
    movedVideoSlug('professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-tour', live),
    'professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-overview',
  );
});

test('no redirect for a draft, a deleted video, an unknown slug or the live slug itself', () => {
  const oldSlug = 'professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-tour';
  assert.equal(movedVideoSlug(oldSlug, [{ ...live[0], status: 'draft' }]), null);
  assert.equal(movedVideoSlug(oldSlug, []), null);
  assert.equal(movedVideoSlug(oldSlug, [{ ...live[0], slug: oldSlug }]), null);
  assert.equal(movedVideoSlug('never-a-video', live), null);
  for (const inherited of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    assert.equal(movedVideoSlug(inherited, live), null, inherited);
  }
});
