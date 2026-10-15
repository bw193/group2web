import {
  localizedPath,
  productCategoryPathAfterLocale,
} from '@/lib/public-paths';

/**
 * Product categories in URLs: every category has a landing page at
 * /products/<category>, and every product sits under its own at
 * /products/<category>/<slug> (F-05 in the 2026-09-15 SEO audit).
 *
 * product_categories has no slug column, so the URL segment of each category
 * is fixed here, by id. Keying on the id keeps a URL stable when staff rename
 * a category in the CMS. A category added later still gets a working page at
 * /products/category-<id>; give it a slug below and that URL, and every
 * product under it, redirects to the new one.
 *
 * Pure, so the client ProductCard can build its link from `categoryId` alone.
 */
export const PRODUCT_CATEGORY_SLUGS: Readonly<Record<number, string>> = {
  1: 'led-mirrors',
  2: 'bathroom-mirrors',
  3: 'full-length-mirrors',
  4: 'mirror-cabinets',
};

const FALLBACK_SEGMENT = /^category-(\d+)$/;

/** The URL segment of a category, or null for a product without one. */
export function productCategorySlug(categoryId: number | null | undefined): string | null {
  if (categoryId == null) return null;
  return PRODUCT_CATEGORY_SLUGS[categoryId] ?? `category-${categoryId}`;
}

/** The category id a URL segment names, or null when it names none. */
export function productCategoryIdFromSlug(slug: string): number | null {
  for (const [id, known] of Object.entries(PRODUCT_CATEGORY_SLUGS)) {
    if (known === slug) return Number(id);
  }
  const fallback = slug.match(FALLBACK_SEGMENT);
  return fallback ? Number(fallback[1]) : null;
}

export interface ProductCategoryTab {
  key: string;
  label: string;
  href: string;
}

/**
 * The catalog's tab bar: "all" plus every category that holds an active
 * product, each linking to its landing page. An empty category gets no tab —
 * its URL redirects to the catalog. Shared by /products and every
 * /products/<category> page, so the bar reads the same on all of them.
 */
export function productCategoryTabs(
  locale: string,
  products: Array<{ categoryId: number | null }>,
  categories: Array<{ id: number; name: string }>,
  allLabel: string,
): ProductCategoryTab[] {
  const stocked = new Set(products.map((p) => p.categoryId));
  return [
    { key: 'all', label: allLabel, href: localizedPath(locale, '/products') },
    ...categories
      .filter((c) => stocked.has(c.id))
      .map((c) => {
        const slug = productCategorySlug(c.id)!;
        return {
          key: slug,
          label: c.name,
          href: localizedPath(locale, productCategoryPathAfterLocale(slug)),
        };
      }),
  ];
}
