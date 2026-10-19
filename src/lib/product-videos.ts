import { wordTokens } from '@/lib/similarity';
import type { ProductRecommendationInput, VideoListItem } from '@/lib/video-utils';

/**
 * Which videos the "Related videos" block on product pages shows.
 *
 * The block used to rank videos by how many words they shared with the
 * product's whole description, reading each video's text in all seven
 * languages. The longest videos shared the most words with everything, so two
 * of them filled a card on 168 and 142 of 172 product pages, while the capsule
 * and round-mirror videos were on none — not even the capsule and round mirror
 * pages (measured on the live catalog, October 2026).
 *
 * A video is now scored on what makes it specific:
 *
 * - **its title against the product name** (×3) — the shape, frame, lighting,
 *   cabinet or full length the buyer is looking at;
 * - **its title and excerpt against the name, tags, category and short
 *   description** (×1), which separates close titles but cannot win alone.
 *
 * Both are overlaps weighted by how rare a word is among the videos and
 * divided by everything either side says, so a long excerpt earns nothing for
 * its length and a word every video uses ("LED", "bathroom") counts for little.
 *
 * Picks are made for the whole catalog at once. The first card is always the
 * product's best match. The other cards go out strongest pairs first, with no
 * video given more than `SPREAD` times its even share of cards, so the
 * runners-up spread across the catalog instead of the same two following the
 * best match everywhere.
 *
 * Callers pass default-locale text, so every language shows the same videos.
 */

/** How far above its even share of cards a video may go, best matches aside. */
const SPREAD = 1.3;

// Words that say nothing about which video fits: every product is a mirror.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or',
  'our', 'that', 'the', 'this', 'to', 'with', 'your',
  'mirror', 'mirrors', 'video', 'videos', 'chengtai', 'bolen',
]);

function words(text: string): Set<string> {
  const result = new Set<string>();
  for (const token of wordTokens(text, 'en')) {
    if (STOPWORDS.has(token)) continue;
    // "Cabinets" should meet "cabinet"; a plain plural strip is enough here.
    const word = token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
    if (word.length > 1 && !STOPWORDS.has(word)) result.add(word);
  }
  return result;
}

/** Product id -> the ids of its related videos, best first. */
export function pickVideosForProducts(
  products: readonly ProductRecommendationInput[],
  videos: readonly VideoListItem[],
  limit = 3,
): Map<string, string[]> {
  const picks = new Map<string, string[]>(products.map((p) => [p.id, []]));
  if (limit <= 0 || videos.length === 0) return picks;

  const titles = videos.map((v) => words(v.title));
  const texts = videos.map((v) => words(`${v.title} ${v.excerpt}`));
  const videosUsing = new Map<string, number>();
  for (const text of texts) for (const word of text) videosUsing.set(word, (videosUsing.get(word) ?? 0) + 1);
  // A word on the product side that no video uses still counts against the match.
  const weight = (word: string) => Math.log(1 + videos.length / (videosUsing.get(word) ?? 0.5));
  const overlap = (a: Set<string>, b: Set<string>) => {
    let shared = 0;
    let total = 0;
    for (const word of a) {
      total += weight(word);
      if (b.has(word)) shared += weight(word);
    }
    for (const word of b) if (!a.has(word)) total += weight(word);
    return total ? shared / total : 0;
  };

  // Every video for every product, best first; ties keep the input order (newest first).
  const ranked = products.map((product) => {
    const name = words(product.title);
    const text = words([product.title, ...(product.tags ?? []), product.category ?? '', product.description ?? ''].join(' '));
    return videos
      .map((_, index) => ({ index, score: 3 * overlap(name, titles[index]) + overlap(text, texts[index]) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
  });

  const cap = Math.ceil((SPREAD * limit * products.length) / videos.length);
  const used = videos.map(() => 0);
  ranked.forEach(([best], p) => {
    picks.get(products[p].id)!.push(videos[best.index].id);
    used[best.index] += 1;
  });
  const rest = ranked
    .flatMap((list, p) => list.slice(1).map(({ index, score }) => ({ p, index, score })))
    .sort((a, b) => b.score - a.score || a.p - b.p || a.index - b.index);
  for (const capped of [true, false]) {
    for (const { p, index } of rest) {
      const list = picks.get(products[p].id)!;
      if (list.length >= limit || list.includes(videos[index].id) || (capped && used[index] >= cap)) continue;
      list.push(videos[index].id);
      used[index] += 1;
    }
  }
  return picks;
}
