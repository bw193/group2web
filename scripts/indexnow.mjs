import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://chengtaimirror.com';
export const KEY = 'e022cad706181d99f3442022430dd047';
export const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const STATE_PATH = '.indexnow/state.json';

function decodeXml(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (!entity.startsWith('#')) return named[entity.toLowerCase()];
    return String.fromCodePoint(entity[1].toLowerCase() === 'x'
      ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10));
  });
}

export function publicUrl(value) {
  const url = new URL(value, SITE);
  if (url.origin !== SITE || url.username || url.password || url.search || url.hash
    || !/^\/(en|es|pt|fr|it|de)(\/|$)/.test(url.pathname)
      && url.pathname !== '/he/israel-home') {
    throw new Error(`Not an indexable canonical Chengtai URL: ${value}`);
  }
  return url.href;
}

export function parseSitemap(xml) {
  // A failed/partial sitemap must never be treated as mass deletion.
  if (!/<urlset\b[^>]*>[\s\S]*<\/urlset>\s*$/.test(xml.trim())) {
    throw new Error('Expected a complete XML urlset sitemap.');
  }
  const entries = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)];
  if (entries.length === 0) throw new Error('Refusing an empty sitemap.');
  const urls = {};
  for (const [, entry] of entries) {
    const loc = entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    if (!loc) throw new Error('A sitemap entry is missing its loc.');
    const url = publicUrl(decodeXml(loc.trim()));
    const lastmod = entry.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]?.trim() ?? '';
    if (lastmod && Number.isNaN(Date.parse(lastmod))) throw new Error(`Invalid lastmod: ${url}`);
    if (Object.hasOwn(urls, url)) throw new Error(`Duplicate sitemap URL: ${url}`);
    urls[url] = lastmod;
  }
  return urls;
}

export function changedUrls(previous, current) {
  return [...new Set([...Object.keys(previous), ...Object.keys(current)])]
    .filter((url) => previous[url] !== current[url]);
}

async function request(url, init, fetchImpl) {
  return fetchImpl(url, { ...init, signal: AbortSignal.timeout(30_000), redirect: 'error' });
}

export async function verifyKey(fetchImpl = fetch) {
  const response = await request(KEY_LOCATION, {}, fetchImpl);
  if (response.status !== 200 || (await response.text()).trim() !== KEY) {
    throw new Error(`IndexNow key is not live at ${KEY_LOCATION} (HTTP ${response.status}).`);
  }
}

export async function submitUrls(values, fetchImpl = fetch) {
  const urls = [...new Set(values.map(publicUrl))];
  const results = [];
  for (let offset = 0; offset < urls.length; offset += 10_000) {
    const batch = urls.slice(offset, offset + 10_000);
    const response = await request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
    }, fetchImpl);
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`IndexNow returned HTTP ${response.status}; state has not been advanced. Retry on the next run.`);
    }
    results.push({ status: response.status, count: batch.length });
    console.log(`IndexNow HTTP ${response.status}: ${batch.length} URLs received${response.status === 202 ? ' (key verification pending)' : ''}.`);
  }
  return results;
}

async function readState(path) {
  let state;
  try { state = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (state.version !== 1 || state.host !== new URL(SITE).host || !state.urls
    || typeof state.urls !== 'object' || Array.isArray(state.urls)) throw new Error('Invalid IndexNow state.');
  for (const [url, lastmod] of Object.entries(state.urls)) {
    publicUrl(url);
    if (typeof lastmod !== 'string') throw new Error('Invalid IndexNow state timestamp.');
  }
  return state.urls;
}

export async function run({ statePath = STATE_PATH, dryRun = false, urls = [], allowRemovals = false, fetchImpl = fetch } = {}) {
  if (urls.length) {
    const canonical = [...new Set(urls.map(publicUrl))];
    if (dryRun) { console.log(JSON.stringify(canonical, null, 2)); return { submitted: 0, changed: canonical.length }; }
    await verifyKey(fetchImpl);
    await submitUrls(canonical, fetchImpl);
    return { submitted: canonical.length, changed: canonical.length };
  }

  const response = await request(`${SITE}/sitemap.xml`, {}, fetchImpl);
  if (response.status !== 200) throw new Error(`Sitemap returned HTTP ${response.status}.`);
  const current = parseSitemap(await response.text());
  const previous = await readState(statePath);
  const changed = previous ? changedUrls(previous, current) : [];
  const removed = previous ? Object.keys(previous).filter((url) => !Object.hasOwn(current, url)).length : 0;
  if (previous && removed > 20 && removed > Object.keys(previous).length / 4) {
    // A deliberate URL move (Oct 2026: every product URL gained its category)
    // looks the same as a broken sitemap, so only a person can let it through.
    if (!allowRemovals) {
      throw new Error('More than 25% of URLs disappeared. Check production sitemap health before replacing the state. If the move is deliberate, run once with --allow-removals.');
    }
    console.log(`${removed} URLs left the sitemap; --allow-removals submits them so search engines recrawl them.`);
  }
  console.log(previous
    ? `${Object.keys(current).length} live URLs; ${changed.length} added, updated or removed URLs.`
    : `Initial baseline: ${Object.keys(current).length} live URLs. Historical URLs are not bulk-submitted.`);
  if (dryRun) { console.log(JSON.stringify(changed, null, 2)); return { submitted: 0, changed: changed.length }; }

  await verifyKey(fetchImpl);
  await submitUrls(changed, fetchImpl);
  await mkdir(dirname(statePath), { recursive: true });
  const temporary = `${statePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ version: 1, host: new URL(SITE).host, checkedAt: new Date().toISOString(), urls: current }, null, 2)}\n`);
  await rename(temporary, statePath);
  const summary = `${previous ? 'IndexNow check' : 'IndexNow baseline'}: ${Object.keys(current).length} live URLs, ${changed.length} notifications accepted.`;
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  return { submitted: changed.length, changed: changed.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = { urls: [] };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') options.dryRun = true;
    else if (args[i] === '--allow-removals') options.allowRemovals = true;
    else if (args[i] === '--url' && args[i + 1]) options.urls.push(args[++i]);
    else if (args[i] === '--state' && args[i + 1]) options.statePath = args[++i];
    else throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  run(options).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
