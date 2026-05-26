import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDb } from '@/lib/db';
import {
  products,
  productTranslations,
  productImages,
  productCategories,
  categoryTranslations,
} from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import ProductsFilter from './ProductsFilter';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  buildAlternates,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'products');
  const url = localizedUrl(locale, '/products');

  // NOTE: intentionally does not read `searchParams`. Doing so would opt this
  // route back into dynamic rendering. `?q=` search variants are de-duplicated
  // by the canonical tag below (→ /products) and aren't crawlable links, so
  // they don't need a separate noindex.
  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/products'),
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title: copy.title,
      description: copy.description,
      locale: localeToOg(locale),
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('products');
  const breadcrumbT = await getTranslations('breadcrumb');
  const db = getDb();

  const [allProducts, allCats] = await Promise.all([
    db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)),
    db
      .select()
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(productCategories.displayOrder),
  ]);

  const productIds = allProducts.map((p) => p.id);
  const catIds = allCats.map((c) => c.id);

  const [prodTrans, prodTransEn, prodImgs, catTrans, catTransEn] = await Promise.all([
    productIds.length
      ? db
          .select()
          .from(productTranslations)
          .where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, locale)))
      : Promise.resolve([]),
    productIds.length && locale !== 'en'
      ? db
          .select()
          .from(productTranslations)
          .where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, 'en')))
      : Promise.resolve([]),
    productIds.length
      ? db.select().from(productImages).where(inArray(productImages.productId, productIds))
      : Promise.resolve([]),
    catIds.length
      ? db
          .select()
          .from(categoryTranslations)
          .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, locale)))
      : Promise.resolve([]),
    catIds.length && locale !== 'en'
      ? db
          .select()
          .from(categoryTranslations)
          .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, 'en')))
      : Promise.resolve([]),
  ]);

  const prodTransMap = new Map(prodTrans.map((t) => [t.productId, t]));
  const prodTransEnMap = new Map(prodTransEn.map((t) => [t.productId, t]));
  const catTransMap = new Map(catTrans.map((t) => [t.categoryId, t]));
  const catTransEnMap = new Map(catTransEn.map((t) => [t.categoryId, t]));

  const imgMap = new Map<number, typeof prodImgs[number]>();
  for (const img of prodImgs) {
    const existing = imgMap.get(img.productId);
    if (!existing || (img.isPrimary && !existing.isPrimary)) {
      imgMap.set(img.productId, img);
    }
  }

  const productsData = allProducts.map((p) => {
    const tr = prodTransMap.get(p.id) || prodTransEnMap.get(p.id);
    const img = imgMap.get(p.id);
    return {
      id: p.id,
      name: tr?.name || 'Product',
      slug: tr?.slug || `product-${p.id}`,
      shortDescription: tr?.shortDescription || null,
      modelNumber: p.modelNumber,
      imageUrl: img?.imageUrl || null,
      isFeatured: p.isFeatured,
      categoryId: p.categoryId,
    };
  });

  const categoriesData = allCats.map((c) => ({
    id: c.id,
    name: catTransMap.get(c.id)?.name || catTransEnMap.get(c.id)?.name || `Category ${c.id}`,
  }));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: productsData.length,
    itemListElement: productsData.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: localizedUrl(locale, `/products/${p.slug}`),
      name: p.name,
      image: p.imageUrl ? getUploadUrl(p.imageUrl) : undefined,
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('products'), item: localizedUrl(locale, '/products') },
    ],
  };

  return (
    <>
      <JsonLd id="ld-products-list" data={itemList} />
      <JsonLd id="ld-products-breadcrumb" data={breadcrumb} />

      {/* Page intro */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-16 pb-14 md:pt-20 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5" data-reveal>
                {t('allCategories')}
              </p>
              <h1
                className="font-display text-4xl md:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]"
                data-reveal
              >
                {t('title')}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-right" data-reveal>
              <p className="text-[17px] font-body font-normal text-ink leading-[1.6] max-w-sm lg:ml-auto">
                {t('introText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductsFilter products={productsData} categories={categoriesData} />
    </>
  );
}
