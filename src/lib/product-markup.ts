import { SITE_URL } from '@/lib/seo';

/**
 * The structured data a product detail page publishes.
 *
 * Google only treats `Product` markup as valid for a product snippet when it
 * carries one of `offers`, `review` or `aggregateRating`. This catalog is
 * quote-only B2B — no published prices, no buyer ratings — so a `Product` here
 * is reported as an invalid item in Search Console's Product snippets report,
 * with no reachable rich result at the end of it. The two ways to satisfy the
 * requirement are both off the table: a placeholder price (`0`) describes a
 * giveaway rather than a quotation, and a self-authored rating is markup that
 * contradicts the page — exactly what the structured data spam policy is aimed
 * at.
 *
 * So the page describes itself as what it is: an `ItemPage` whose main entity
 * is a `ProductModel`, schema.org's "datasheet or vendor specification of a
 * product". The model carries everything the `Product` markup did (photos,
 * model number, brand, maker and the spec table) without claiming the item is
 * on sale, and Google's Rich Results Test doesn't read it as a product snippet
 * (checked 26 Nov 2026), so the page reports no invalid item.
 *
 * A plain `ItemPage` ran on 20 products from 17 Aug 2026 while the rest kept
 * `Product`; their web and image search impressions held up against the rest
 * of the catalog, which is why every product page now publishes it.
 */

export interface ProductPageMarkupInput {
  /** The page's canonical URL in this locale. */
  url: string;
  locale: string;
  name: string;
  description: string;
  /** Photo URLs in gallery order, never empty (the page falls back to a placeholder); the first is the page's main image. */
  images: readonly string[];
  /** The company name as this locale writes it. */
  brandName: string;
  modelNumber?: string | null;
  /** The visible spec table, in the page's locale. */
  specs: ReadonlyArray<{ specKey: string; specValue: string }>;
  /** `@id` of the page's BreadcrumbList. */
  breadcrumbId: string;
}

/** At most this many spec lines go into the markup. */
const MAX_SPEC_PROPERTIES = 20;

/** JSON-LD for a product page: an `ItemPage` about the model's datasheet. */
export function productPageJsonLd(input: ProductPageMarkupInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    '@id': `${input.url}#page`,
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: input.locale,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    breadcrumb: { '@id': input.breadcrumbId },
    primaryImageOfPage: { '@type': 'ImageObject', url: input.images[0] },
    mainEntity: { '@type': 'ProductModel', '@id': `${input.url}#model`, ...productFacts(input) },
  };
}

/** What the page shows about the model itself. */
function productFacts(input: ProductPageMarkupInput): Record<string, unknown> {
  const facts: Record<string, unknown> = {
    name: input.name,
    image: input.images,
    description: input.description,
    brand: { '@type': 'Brand', name: input.brandName },
    manufacturer: { '@id': `${SITE_URL}/#organization` },
    url: input.url,
  };
  if (input.modelNumber) {
    facts.sku = input.modelNumber;
    facts.mpn = input.modelNumber;
  }

  // Mirror the visible spec table into structured data so answer engines read
  // dimensions, IP ratings and certifications as facts instead of inferring
  // them from prose. Two deliberate non-transformations: property names stay in
  // the page's own locale (the CMS translates spec keys, and a localized name
  // matches how buyers phrase the question), and repeated names are kept, since
  // a product legitimately carries e.g. both a concrete size and "custom".
  const modelNumber = input.modelNumber?.trim().toLowerCase();
  const specProperties = input.specs
    .map((s) => ({ name: s.specKey.trim(), value: s.specValue.trim() }))
    .filter((p) => p.name && p.value && p.value.toLowerCase() !== modelNumber)
    .slice(0, MAX_SPEC_PROPERTIES);
  if (specProperties.length > 0) {
    facts.additionalProperty = specProperties.map((p) => ({
      '@type': 'PropertyValue',
      name: p.name,
      value: p.value,
    }));
  }
  return facts;
}
