import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { changedUrls, KEY, KEY_LOCATION, parseSitemap, publicUrl, run, SITE, submitUrls } from '../scripts/indexnow.mjs';

const xml = (...rows) => `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map(([path, date]) => `<url><loc>${SITE}${path}</loc><lastmod>${date}</lastmod></url>`).join('')}</urlset>`;

test('detects added, updated and deleted URLs without resubmitting unchanged pages', () => {
  const previous = parseSitemap(xml(['/en', '2026-10-01'], ['/en/products/old', '2026-10-01']));
  const current = parseSitemap(xml(['/en', '2026-10-01'], ['/en/products/new', '2026-10-12']));
  assert.deepEqual(changedUrls(previous, current), [`${SITE}/en/products/old`, `${SITE}/en/products/new`]);
  assert.deepEqual(changedUrls(previous, { ...previous, [`${SITE}/en`]: '2026-10-12' }), [`${SITE}/en`]);
});

test('rejects foreign hosts, preview hosts and noindex Hebrew detail pages', () => {
  for (const value of ['https://example.com/en', 'https://group2web-one.vercel.app/en', '/he/israel-products', '/cms', '/api/products', '/en?search=mirror']) {
    assert.throws(() => publicUrl(value));
  }
  assert.equal(publicUrl('/he/israel-home'), `${SITE}/he/israel-home`);
});

test('rejects empty, malformed and truncated sitemaps instead of deleting inventory', () => {
  for (const value of ['<html>error</html>', '<urlset></urlset>', '<urlset><url><loc>x</loc></url>', '<urlset><url></url></urlset>']) {
    assert.throws(() => parseSitemap(value));
  }
});

test('uses 10000-URL batches and treats HTTP 202 as pending verification', async () => {
  const requests = [];
  const urls = Array.from({ length: 10001 }, (_, i) => `${SITE}/en/products/item-${i}`);
  await submitUrls(urls, async (url, options) => {
    assert.equal(url, 'https://api.indexnow.org/indexnow');
    const body = JSON.parse(options.body);
    assert.equal(body.host, 'chengtaimirror.com');
    assert.equal(body.keyLocation, KEY_LOCATION);
    requests.push(body.urlList.length);
    return new Response(null, { status: 202 });
  });
  assert.deepEqual(requests, [10000, 1]);
});

test('first run creates a baseline and failure preserves the prior state for retry', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'indexnow-test-'));
  const statePath = join(directory, 'state.json');
  let sitemap = xml(['/en', '2026-10-01']);
  let submissions = 0;
  const fetchImpl = async (url) => {
    if (url.endsWith('/sitemap.xml')) return new Response(sitemap);
    if (url === KEY_LOCATION) return new Response(KEY);
    submissions++;
    return new Response(null, { status: 429 });
  };
  try {
    assert.deepEqual(await run({ statePath, fetchImpl }), { changed: 0, submitted: 0 });
    assert.equal(submissions, 0);
    const prior = await readFile(statePath, 'utf8');
    sitemap = xml(['/en', '2026-10-12']);
    await assert.rejects(run({ statePath, fetchImpl }), /HTTP 429/);
    assert.equal(await readFile(statePath, 'utf8'), prior);
    await run({ statePath, dryRun: true, fetchImpl });
    assert.equal(await readFile(statePath, 'utf8'), prior);
    await writeFile(statePath, '{}');
    await assert.rejects(run({ statePath, fetchImpl }), /Invalid IndexNow state/);
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('indexnow-test-'));
    await rm(directory, { recursive: true });
  }
});

test('a wrong key and a drastic inventory drop cannot advance the state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'indexnow-test-'));
  const statePath = join(directory, 'state.json');
  const previous = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`${SITE}/en/products/item-${i}`, '2026-10-01']));
  try {
    const prior = JSON.stringify({ version: 1, host: 'chengtaimirror.com', urls: previous });
    await writeFile(statePath, prior);
    await assert.rejects(run({ statePath, fetchImpl: async () => new Response(xml(['/en', '2026-10-01'])) }), /25%/);
    assert.equal(await readFile(statePath, 'utf8'), prior);
    await assert.rejects(run({ urls: ['/en'], fetchImpl: async () => new Response('wrong-key') }), /key is not live/);
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('indexnow-test-'));
    await rm(directory, { recursive: true });
  }
});
