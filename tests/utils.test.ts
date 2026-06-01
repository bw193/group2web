import assert from 'node:assert/strict';
import { cn, formatDate, getUploadUrl, slugify } from '../src/lib/utils';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

test('cn combines strings, numbers, arrays, and truthy object keys', () => {
  assert.equal(
    cn('base', 2, ['nested', { active: true, hidden: false }], null, undefined),
    'base 2 nested active',
  );
});

test('slugify normalizes text for URL slugs', () => {
  assert.equal(slugify('  Round LED Bathroom Mirror! 2025  '), 'round-led-bathroom-mirror-2025');
});

test('getUploadUrl returns placeholders, absolute URLs, and public asset URLs', () => {
  assert.equal(getUploadUrl(null), '/images/placeholder.svg');
  assert.equal(getUploadUrl('https://cdn.example.com/image.webp'), 'https://cdn.example.com/image.webp');
  assert.equal(
    getUploadUrl('/products/mirror.webp'),
    'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets/products/mirror.webp',
  );
});

test('formatDate renders stable US-style dates', () => {
  assert.equal(formatDate('2025-01-15T12:00:00.000Z'), 'Jan 15, 2025');
});
