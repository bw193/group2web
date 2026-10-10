// Photos inside a product's full description.
//
// Staff add them with Insert image in the CMS editor, which stores each one as
//   <figure data-description-image=""><img src alt width height><figcaption>…</figcaption></figure>
// with the staff-written description as both the alt text and the visible
// caption. The caption is page text, and it is what the Similarity Check
// reads, so it is what lets a photo shared by many products (the copper-free
// mirror layer diagram, say) add something unique to each page instead of more
// duplicate content. Hence the rules: every photo needs a description long
// enough to say something, and no two photos, on this product or any other,
// may share one. The editor enforces them as staff type; the product save API
// enforces them again.
//
// Dependency-free so the CMS editor, the API routes and the tests share it.

import { isOptimizedKey, optimizedSrcSet } from './optimized-images';
import { normalizeText } from './similarity';

export const MIN_DESCRIPTION_WORDS = 6;
export const MAX_DESCRIPTION_CHARS = 300;

/** A description already used on a photo in another product's description. */
export type UsedDescription = { productId: number; productName: string; description: string };

export type DescriptionIssue =
  | { kind: 'missing' | 'tooShort' | 'tooLong' | 'repeatedHere' }
  | { kind: 'usedElsewhere'; productName: string };

/** A problem with one photo; `photo` counts from 1 in page order. */
export type DescriptionImageProblem = DescriptionIssue & { photo: number };

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Case, punctuation and spacing don't make a description a new one. */
function descriptionKey(text: string): string {
  return normalizeText(text);
}

/**
 * Checks one photo's description against the rules. `others` are the other
 * photos' descriptions in the same product description, `usedElsewhere` the
 * ones on other products' photos.
 */
export function checkDescription(
  text: string,
  context: { others?: readonly string[]; usedElsewhere?: readonly UsedDescription[] } = {},
): DescriptionIssue | null {
  const trimmed = text.trim();
  if (!trimmed) return { kind: 'missing' };
  if (trimmed.length > MAX_DESCRIPTION_CHARS) return { kind: 'tooLong' };
  if (countWords(trimmed) < MIN_DESCRIPTION_WORDS) return { kind: 'tooShort' };
  const key = descriptionKey(trimmed);
  if (context.others?.some((other) => descriptionKey(other) === key)) return { kind: 'repeatedHere' };
  const used = context.usedElsewhere?.find((u) => descriptionKey(u.description) === key);
  if (used) return { kind: 'usedElsewhere', productName: used.productName };
  return null;
}

// Quoted attribute values may contain ">" (older browsers don't escape it).
const IMG_TAG = /<img\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const ATTRIBUTE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const NAMED_ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('#')) {
      const code = lower[1] === 'x' ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[lower] ?? entity;
  });
}

function readAttributes(attributeText: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of attributeText.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase();
    if (!attributes.has(name)) attributes.set(name, decodeEntities(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return attributes;
}

/** Every photo in a description, in page order, described by its alt text. */
export function extractDescriptionImages(
  html: string | null | undefined,
): Array<{ src: string; description: string }> {
  if (!html) return [];
  return [...html.matchAll(IMG_TAG)].map((match) => {
    const attributes = readAttributes(match[1]);
    return { src: attributes.get('src') ?? '', description: (attributes.get('alt') ?? '').trim() };
  });
}

/** Everything that stops a description with photos from being saved; empty when it can be. */
export function findDescriptionImageProblems(
  html: string | null | undefined,
  usedElsewhere: readonly UsedDescription[] = [],
): DescriptionImageProblem[] {
  const images = extractDescriptionImages(html);
  const problems: DescriptionImageProblem[] = [];
  images.forEach((image, index) => {
    const issue = checkDescription(image.description, {
      others: images.slice(0, index).map((earlier) => earlier.description),
      usedElsewhere,
    });
    if (issue) problems.push({ ...issue, photo: index + 1 });
  });
  return problems;
}

// The description column on the product page is at most 760px wide, inside
// the 24px (phone) to 56px (desktop) page gutters.
const DESCRIPTION_IMAGE_SIZES = '(max-width: 824px) calc(100vw - 48px), 760px';

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Prepares description photos for the product page: they load lazily (the
 * description sits below the fold), and uploads stored in several widths
 * (`-opt@<w>.webp`) get a srcset so phones fetch a smaller file.
 */
export function withResponsiveDescriptionImages(html: string): string {
  return html.replace(IMG_TAG, (tag, attributeText: string) => {
    const attributes = readAttributes(attributeText);
    const src = attributes.get('src');
    let extra = '';
    if (!attributes.has('loading')) extra += ' loading="lazy"';
    if (!attributes.has('decoding')) extra += ' decoding="async"';
    if (src && isOptimizedKey(src) && !attributes.has('srcset')) {
      extra += ` srcset="${escapeAttribute(optimizedSrcSet(src))}" sizes="${DESCRIPTION_IMAGE_SIZES}"`;
    }
    return extra ? tag.replace(/\s*\/?>$/, `${extra}>`) : tag;
  });
}
