import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { productTranslations, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { locales, defaultLocale } from '@/i18n/config';

const SITE_URL = 'https://chengtaimirror.com';

// Static routes shared across every locale, expressed as the path segment
// AFTER the (optional) locale prefix. Use '' for the locale's homepage.
const STATIC_ROUTES = ['', '/about', '/contact', '/products'] as const;

/**
 * Build the absolute URL for a given locale + path-after-locale.
 * `localePrefix: 'as-needed'` means the default locale has no prefix.
 */
function localizedUrl(locale: string, pathAfterLocale: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  return `${SITE_URL}${prefix}${pathAfterLocale}`;
}

/**
 * Build the hreflang `alternates.languages` map for a given path-after-locale,
 * so search engines know the equivalent URL in every supported language.
 */
function buildLanguageAlternates(
  pathAfterLocale: string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = localizedUrl(loc, pathAfterLocale);
  }
  // x-default points at the canonical (default-locale) version.
  languages['x-default'] = localizedUrl(defaultLocale, pathAfterLocale);
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static routes × every locale.
  for (const pathAfterLocale of STATIC_ROUTES) {
    const languages = buildLanguageAlternates(pathAfterLocale);
    for (const loc of locales) {
      entries.push({
        url: localizedUrl(loc, pathAfterLocale),
        lastModified: now,
        changeFrequency: pathAfterLocale === '' ? 'weekly' : 'monthly',
        priority: pathAfterLocale === '' ? 1.0 : 0.7,
        alternates: { languages },
      });
    }
  }

  // Dynamic product detail pages. Slugs are stored per-locale in
  // `product_translations`. If the DB isn't reachable at build time (the
  // same scenario `generateStaticParams` guards against), fall back to
  // the static entries only.
  try {
    const db = getDb();
    const rows = await db
      .select({
        locale: productTranslations.locale,
        slug: productTranslations.slug,
        productId: productTranslations.productId,
        updatedAt: products.updatedAt,
        isActive: products.isActive,
      })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId));

    // Group translations by productId so each product yields one sitemap entry
    // (with hreflang alternates pointing at the per-locale slugs).
    const byProduct = new Map<
      number,
      { updatedAt: string; isActive: boolean; slugs: Record<string, string> }
    >();
    for (const r of rows) {
      const existing = byProduct.get(r.productId) ?? {
        updatedAt: r.updatedAt,
        isActive: r.isActive,
        slugs: {} as Record<string, string>,
      };
      existing.slugs[r.locale] = r.slug;
      byProduct.set(r.productId, existing);
    }

    for (const [, { updatedAt, isActive, slugs }] of byProduct) {
      if (!isActive) continue;

      // Build hreflang languages map from this product's per-locale slugs.
      const languages: Record<string, string> = {};
      for (const loc of locales) {
        const slug = slugs[loc];
        if (slug) {
          languages[loc] = localizedUrl(loc, `/products/${slug}`);
        }
      }
      const defaultSlug = slugs[defaultLocale];
      if (defaultSlug) {
        languages['x-default'] = localizedUrl(
          defaultLocale,
          `/products/${defaultSlug}`,
        );
      }

      // Emit one sitemap entry per locale that actually has a translation.
      for (const loc of locales) {
        const slug = slugs[loc];
        if (!slug) continue;
        entries.push({
          url: localizedUrl(loc, `/products/${slug}`),
          lastModified: new Date(updatedAt),
          changeFrequency: 'monthly',
          priority: 0.8,
          alternates: { languages },
        });
      }
    }
  } catch {
    // DB unavailable — return what we have. The static routes are still useful.
  }

  return entries;
}
