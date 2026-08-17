/**
 * Which product detail pages describe themselves as an `ItemPage` instead of a
 * `Product`.
 *
 * Google only treats `Product` markup as valid for a product snippet when it
 * carries one of `offers`, `review` or `aggregateRating`. This catalog is
 * quote-only B2B — no published prices, no buyer ratings — so every product
 * page is reported as an invalid item in Search Console's Product snippets
 * report, forever, with no reachable rich result at the end of it. The two ways
 * to satisfy the requirement are both off the table: a placeholder price (`0`)
 * describes a giveaway rather than a quotation, and a self-authored rating is
 * markup that contradicts the page — exactly what the structured data spam
 * policy is aimed at. What remains is to stop claiming the page is a
 * purchasable product and describe it as what it is: an item page.
 *
 * The list below is the staged rollout of that change: these products publish
 * `ItemPage` in every locale, the rest keep `Product` until Search Console and
 * Analytics confirm nothing was lost. Ids are the `products.id` primary key, so
 * a slug edit can't quietly drop a product out of the sample; the slug recorded
 * beside each one is the English URL, for pasting into the URL Inspection tool.
 *
 * The sample spans frame families, lit and unlit ranges, cabinets and
 * full-length pieces across the whole id range, so the reading isn't taken from
 * one corner of the catalog.
 *
 * Note the trade-off while the test runs: an `ItemPage` carries no
 * `additionalProperty`, so the spec table reaches crawlers as visible HTML only
 * (the `<dl>` in the page body) and not as structured facts.
 */
export const ITEM_PAGE_MARKUP_PRODUCTS = [
  { id: 12, slug: 'led-mirror-cabinet-with-storage' },
  { id: 18, slug: 'round-framed-bathroom-mirror' },
  { id: 22, slug: 'organic-shaped-wall-mirror' },
  { id: 26, slug: 'wood-frame-rectangular-mirror' },
  { id: 34, slug: 'metal-framed-led-mirror' },
  { id: 40, slug: 'round-backlit-led-mirror' },
  { id: 47, slug: 'arch-full-length-mirror' },
  { id: 51, slug: 'solid-wood-dressing-mirror' },
  { id: 55, slug: 'round-led-wall-mirror' },
  { id: 59, slug: 'cloud-shape-led-mirror' },
  { id: 68, slug: 'rectangle-full-length-mirror' },
  { id: 75, slug: 'bluetooth-led-bathroom-mirror' },
  { id: 85, slug: 'led-full-length-mirror' },
  { id: 94, slug: 'capsule-shaped-smart-mirror' },
  { id: 104, slug: 'teardrop-led-bathroom-mirror' },
  { id: 120, slug: 'oval-led-aluminum-frame-bathroom-mirror' },
  { id: 135, slug: 'modern-smart-bathroom-mirror' },
  { id: 147, slug: 'premium-circular-led-vanity-mirror-seamless-aluminum-framed' },
  { id: 157, slug: 'oval-wall-mount-bathroom-mirror-cabinet' },
  { id: 173, slug: 'organic-asymmetric-full-length-wall-mirror' },
] as const;

const ITEM_PAGE_MARKUP_IDS: ReadonlySet<number> = new Set(
  ITEM_PAGE_MARKUP_PRODUCTS.map((p) => p.id),
);

/** True when the detail page should publish `ItemPage` rather than `Product`. */
export function usesItemPageMarkup(productId: number): boolean {
  return ITEM_PAGE_MARKUP_IDS.has(productId);
}
