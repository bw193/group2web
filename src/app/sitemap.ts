import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';
import {
  localizedUrl,
  buildLanguageAlternates,
} from '@/lib/seo';
import { getArticleSitemapRows, getProductSitemapRows } from '@/lib/public-data';

// Stable date for static routes so Google doesn't see every locale homepage
// "changing" on each rebuild. Bump manually when nav/footer/structure shifts.
const STATIC_LAST_MODIFIED = new Date('2026-05-20T00:00:00Z');

// Static routes shared across every locale, expressed as the path segment
// AFTER the (optional) locale prefix. Use '' for the locale's homepage.
const STATIC_ROUTES = ['', '/about', '/contact', '/products', '/insight'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static routes × every locale.
  for (const pathAfterLocale of STATIC_ROUTES) {
    const languages = buildLanguageAlternates(pathAfterLocale);
    for (const loc of locales) {
      entries.push({
        url: localizedUrl(loc, pathAfterLocale),
        lastModified: STATIC_LAST_MODIFIED,
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
    const rows = await getProductSitemapRows();

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
        languages['x-default'] = localizedUrl(defaultLocale, `/products/${defaultSlug}`);
      }

      // Emit one sitemap entry per locale that actually has a translation.
      for (const loc of locales) {
        const slug = slugs[loc];
        if (!slug) continue;
        const lastModified = updatedAt ? new Date(updatedAt) : STATIC_LAST_MODIFIED;
        entries.push({
          url: localizedUrl(loc, `/products/${slug}`),
          lastModified: Number.isNaN(lastModified.getTime()) ? STATIC_LAST_MODIFIED : lastModified,
          changeFrequency: 'monthly',
          priority: 0.8,
          alternates: { languages },
        });
      }
    }
  } catch {
    // DB unavailable — return what we have. The static routes are still useful.
  }

  // Dynamic Insight article pages. Per-locale (locale, slug) live in
  // article_translations; the body lives in article_translation_bodies and is
  // never selected here (light, product-like). One entry per locale that has a
  // real translation, with hreflang alternates grouped by article.
  try {
    const rows = await getArticleSitemapRows();

    const byArticle = new Map<
      number,
      { updatedAt: string; isActive: boolean; slugs: Record<string, string> }
    >();
    for (const r of rows) {
      const existing = byArticle.get(r.articleId) ?? {
        updatedAt: r.updatedAt,
        isActive: r.isActive,
        slugs: {} as Record<string, string>,
      };
      existing.slugs[r.locale] = r.slug;
      byArticle.set(r.articleId, existing);
    }

    for (const [, { updatedAt, isActive, slugs }] of byArticle) {
      if (!isActive) continue;

      const languages: Record<string, string> = {};
      for (const loc of locales) {
        const slug = slugs[loc];
        if (slug) languages[loc] = localizedUrl(loc, `/insight/${slug}`);
      }
      const defaultSlug = slugs[defaultLocale];
      if (defaultSlug) {
        languages['x-default'] = localizedUrl(defaultLocale, `/insight/${defaultSlug}`);
      }

      for (const loc of locales) {
        const slug = slugs[loc];
        if (!slug) continue;
        const lastModified = updatedAt ? new Date(updatedAt) : STATIC_LAST_MODIFIED;
        entries.push({
          url: localizedUrl(loc, `/insight/${slug}`),
          lastModified: Number.isNaN(lastModified.getTime()) ? STATIC_LAST_MODIFIED : lastModified,
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: { languages },
        });
      }
    }
  } catch {
    // DB unavailable — static + product entries already pushed.
  }

  return entries;
}
