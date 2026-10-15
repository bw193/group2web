import type { Metadata } from 'next';
import { permanentRedirect, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProductsFilter from '../ProductsFilter';
import ProofPoints from '@/components/public/ProofPoints';
import { JsonLd } from '@/components/seo/JsonLd';
import { rotateDaily } from '@/lib/daily-rotation';
import { getProductsPagePublicData, type CategoryOption } from '@/lib/public-data';
import {
  productCategoryIdFromSlug,
  productCategorySlug,
  productCategoryTabs,
} from '@/lib/product-categories';
import { productCategoryCopy, type ProductCategoryCopy } from '@/lib/product-category-copy';
import {
  categoryKeyFromSegment,
  localizedPath,
  productCategoryPathAfterLocale,
  productCategorySegment,
  productPathAfterLocale,
} from '@/lib/public-paths';
import {
  SITE_OG_IMAGE,
  SITE_URL,
  buildAlternates,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  pageCopy,
  snippet,
  titleWithSiteName,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';
import { productMetadata, renderProductDetailPage } from './[slug]/ProductDetailRoute';

/**
 * /products/<segment> — one landing page per product category, and the home
 * of the flat product URLs from before categories had pages.
 *
 * A segment that names a category renders its landing page. Anything else is
 * a product slug, handed to the product page: an old /products/<slug> link is
 * resolved (current slug, slug history, or another locale's slug) and sent to
 * /products/<category>/<slug> in one permanent redirect, never a chain; a
 * product with no category is rendered right here, its only URL; an unknown
 * slug 404s.
 *
 * Lives outside page.tsx because a page module may only export Next's own
 * names, and the Hebrew mirror route renders it too — the same split as the
 * Insight CategoryRoute.
 */
export type ProductCategoryPageProps = { params: Promise<{ locale: string; category: string }> };

/** The category a segment names, or null when it is a product slug. */
async function loadCategory(locale: string, segment: string) {
  const id = productCategoryIdFromSlug(categoryKeyFromSegment(locale, segment));
  if (id === null) return null;
  const { products, categories } = await getProductsPagePublicData(locale);
  const category = categories.find((c) => c.id === id) ?? null;
  if (!category) return null;
  return {
    category,
    slug: productCategorySlug(category.id)!,
    products,
    categories,
    inCategory: products.filter((p) => p.categoryId === category.id),
  };
}

/** A category added in the CMS after the copy file still gets a usable page. */
function landingCopy(locale: string, slug: string, category: CategoryOption): ProductCategoryCopy {
  return (
    productCategoryCopy(locale, slug) ?? {
      title: category.name,
      heading: category.name,
      intro: pageCopy(locale, 'products').description,
    }
  );
}

function productParams(locale: string, slug: string) {
  return { params: Promise.resolve({ locale, slug }) };
}

/**
 * The `[category]` params a locale prerenders: the categories the tab bar
 * links to, in that locale's segment form (israel-<slug> for Hebrew).
 */
export async function stockedCategoryParams(locale: string): Promise<Array<{ category: string }>> {
  const { products, categories } = await getProductsPagePublicData(locale);
  return productCategoryTabs(locale, products, categories, '')
    .filter((tab) => tab.key !== 'all')
    .map((tab) => ({ category: productCategorySegment(locale, tab.key) }));
}

export async function productCategoryMetadata({ params }: ProductCategoryPageProps): Promise<Metadata> {
  const { locale, category: segment } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const loaded = await loadCategory(locale, segment);
    if (!loaded) return productMetadata(productParams(locale, segment));
    // The page itself redirects here; nothing to index in between.
    if (loaded.inCategory.length === 0) return { robots: { index: false, follow: true } };

    const copy = landingCopy(locale, loaded.slug, loaded.category);
    const pathAfterLocale = productCategoryPathAfterLocale(loaded.slug);
    const url = localizedUrl(locale, pathAfterLocale);
    const title = titleWithSiteName(copy.title, siteName);
    const description = snippet(copy.intro);

    return {
      title,
      description,
      alternates: buildAlternates(locale, pathAfterLocale),
      openGraph: {
        type: 'website',
        url,
        siteName,
        title,
        description,
        locale: localeToOg(locale),
        images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: siteName }],
      },
      twitter: { card: 'summary_large_image', title, description, images: [SITE_OG_IMAGE] },
    };
  } catch {
    return { title: pageCopy(locale, 'products').title };
  }
}

export async function renderProductCategoryPage(
  { params }: ProductCategoryPageProps,
  options: { redirectHebrewSegment?: boolean } = {},
) {
  const { locale, category: segment } = await params;
  setRequestLocale(locale);

  const loaded = await loadCategory(locale, segment);
  if (!loaded) return renderProductDetailPage(productParams(locale, segment), options);
  const { category, slug, products, categories, inCategory } = loaded;

  const pathAfterLocale = productCategoryPathAfterLocale(slug);
  // One category, one URL: a Hebrew request on the generic route, or a
  // segment in the wrong form for this locale, goes to the canonical URL.
  if (
    (options.redirectHebrewSegment && locale === 'he') ||
    segment !== productCategorySegment(locale, slug)
  ) {
    permanentRedirect(localizedPath(locale, pathAfterLocale));
  }
  // Nothing in it yet: no page worth serving or indexing, and the catalog
  // already lists every product. Temporary, because the category will fill.
  if (inCategory.length === 0) redirect(localizedPath(locale, '/products'));

  const [t, breadcrumbT] = await Promise.all([
    getTranslations('products'),
    getTranslations('breadcrumb'),
  ]);
  const copy = landingCopy(locale, slug, category);
  // The catalog's daily order, so the category reads like a slice of it.
  const shown = rotateDaily(inCategory);
  const tabs = productCategoryTabs(locale, products, categories, t('allCategories'));

  const catalogUrl = localizedUrl(locale, '/products');
  const categoryUrl = localizedUrl(locale, pathAfterLocale);

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${categoryUrl}#collection`,
    name: copy.heading,
    description: copy.intro,
    url: categoryUrl,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: shown.length,
      itemListElement: shown.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: localizedUrl(locale, productPathAfterLocale(slug, p.slug)),
        name: p.name,
        image: p.imageUrl ? getUploadUrl(p.imageUrl) : undefined,
      })),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('products'), item: catalogUrl },
      { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-product-category" data={collectionLd} />
      <JsonLd id="ld-product-category-breadcrumb" data={breadcrumbLd} />

      {/* Masthead — the catalog's, with the category's own H1 and the
          sentence that is also its search snippet. */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-8 pb-10 md:pt-20 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-3 md:mb-5" data-reveal>
                {t('title')}
              </p>
              <h1
                className="font-display text-4xl md:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]"
                data-reveal
              >
                {copy.heading}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-end" data-reveal>
              <p className="text-[17px] font-body font-normal text-ink leading-[1.6] max-w-sm lg:ms-auto">
                {copy.intro}
              </p>
            </div>
          </div>

          <ProofPoints
            align="start"
            copy="products"
            noSnippet
            className="mt-8 pt-7 md:mt-12 md:pt-10 border-t border-warm-border"
          />
        </div>
      </section>

      <ProductsFilter products={shown} tabs={tabs} activeKey={slug} />
    </>
  );
}
