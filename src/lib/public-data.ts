import 'server-only';

import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { defaultLocale, locales } from '@/i18n/config';
import { getDb } from '@/lib/db';
import {
  aboutGallery,
  aboutPage,
  articleTranslations,
  articles,
  bannerTranslations,
  banners,
  categoryTranslations,
  faqs,
  faqTranslations,
  productCategories,
  productImages,
  productSlugHistory,
  products,
  productSpecifications,
  productTranslations,
} from '@/lib/db/schema';
import { localizedPath } from '@/lib/seo';
import { getPublicDataSnapshot } from '@/lib/public-data-snapshot';
import type {
  AboutGalleryRow,
  AboutPageRow,
  BannerRow,
  BannerTranslationRow,
  CategoryTranslationRow,
  FaqRow,
  FaqTranslationRow,
  ProductCategoryRow,
  ProductImageRow,
  ProductRow,
  ProductSlugHistoryRow,
  ProductSpecificationRow,
  ProductTranslationRow,
  PublicDataSnapshot,
} from '@/lib/public-data-snapshot';

export interface ProductCardData {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  modelNumber: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  categoryId: number | null;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface HomePagePublicData {
  bannerSlides: Array<{
    id: number;
    imageUrl: string;
    title: string | null | undefined;
    subtitle: string | null | undefined;
    ctaText: string | null | undefined;
    ctaLink: string | null;
  }>;
  featuredProducts: ProductCardData[];
  categories: CategoryOption[];
  facilityPhotos: AboutGalleryRow[];
  certificationPhotos: AboutGalleryRow[];
  exhibitionPhotos: Array<{ imageUrl: string; caption: string | null }>;
  faqs: Array<{ q: string; a: string }>;
}

export interface ProductsPagePublicData {
  products: ProductCardData[];
  categories: CategoryOption[];
}

export interface AboutPagePublicData {
  about: AboutPageRow | undefined;
  factoryPhotos: AboutGalleryRow[];
  certificationPhotos: AboutGalleryRow[];
}

export interface ProductMetadataData {
  product: ProductRow;
  translation: ProductTranslationRow;
  trans: ProductTranslationRow;
  allTranslations: Array<Pick<ProductTranslationRow, 'locale' | 'slug'>>;
  primaryImage: Pick<ProductImageRow, 'imageUrl'> | undefined;
}

export type ProductDetailData =
  | {
      type: 'ok';
      product: ProductRow;
      translation: ProductTranslationRow;
      specs: ProductSpecificationRow[];
      images: ProductImageRow[];
      related: ProductCardData[];
    }
  | { type: 'redirect'; destination: string }
  | { type: 'notFound' };

export interface ProductSitemapRow {
  locale: string;
  slug: string;
  productId: number;
  updatedAt: string;
  isActive: boolean;
}

export interface ArticleSitemapRow {
  locale: string;
  slug: string;
  articleId: number;
  updatedAt: string;
  isActive: boolean;
}

function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder;
}

function byCreatedAtDesc<T extends { createdAt: string }>(a: T, b: T) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function validLocale(locale: string): boolean {
  return (locales as readonly string[]).includes(locale);
}

function getSnapshot(): PublicDataSnapshot | null {
  return getPublicDataSnapshot();
}

function primaryImageMap(images: ProductImageRow[]) {
  const map = new Map<number, ProductImageRow>();
  for (const img of images) {
    const existing = map.get(img.productId);
    if (!existing || (img.isPrimary && !existing.isPrimary)) {
      map.set(img.productId, img);
    }
  }
  return map;
}

function categoryOptionsFromRows(
  cats: ProductCategoryRow[],
  translations: CategoryTranslationRow[],
  locale: string,
): CategoryOption[] {
  const transMap = new Map(
    translations
      .filter((t) => t.locale === locale)
      .map((t) => [t.categoryId, t]),
  );
  const transEnMap = new Map(
    translations
      .filter((t) => t.locale === defaultLocale)
      .map((t) => [t.categoryId, t]),
  );

  return cats.map((cat) => ({
    id: cat.id,
    name: transMap.get(cat.id)?.name || transEnMap.get(cat.id)?.name || `Category ${cat.id}`,
  }));
}

function productCardsFromRows(
  productRows: ProductRow[],
  translations: ProductTranslationRow[],
  images: ProductImageRow[],
  locale: string,
): ProductCardData[] {
  const transMap = new Map(
    translations
      .filter((t) => t.locale === locale)
      .map((t) => [t.productId, t]),
  );
  const transEnMap = new Map(
    translations
      .filter((t) => t.locale === defaultLocale)
      .map((t) => [t.productId, t]),
  );
  const imgMap = primaryImageMap(images);

  return productRows.map((p) => {
    const tr = transMap.get(p.id) || transEnMap.get(p.id);
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
}

function faqPairsFromRows(
  rows: FaqRow[],
  translations: FaqTranslationRow[],
  locale: string,
): Array<{ q: string; a: string }> {
  const transMap = new Map(
    translations
      .filter((t) => t.locale === locale)
      .map((t) => [t.faqId, t]),
  );
  const transEnMap = new Map(
    translations
      .filter((t) => t.locale === defaultLocale)
      .map((t) => [t.faqId, t]),
  );
  return rows
    .map((faq) => {
      const t = transMap.get(faq.id) || transEnMap.get(faq.id);
      return t ? { q: t.question, a: t.answer } : null;
    })
    .filter((item): item is { q: string; a: string } => Boolean(item));
}

function findProductRouteInSnapshot(snapshot: PublicDataSnapshot, locale: string, slug: string) {
  const translation = snapshot.data.productTranslations.find((t) => t.locale === locale && t.slug === slug);
  if (!translation) return null;
  const product = snapshot.data.products.find((p) => p.id === translation.productId && p.isActive);
  return product ? { product, translation } : null;
}

function findProductHistoryInSnapshot(snapshot: PublicDataSnapshot, locale: string, slug: string) {
  const historyRows = snapshot.data.productSlugHistory ?? ([] as ProductSlugHistoryRow[]);
  const history = historyRows.find((h) => h.locale === locale && h.oldSlug === slug);
  if (!history) return null;
  const product = snapshot.data.products.find((p) => p.id === history.productId && p.isActive);
  if (!product) return null;
  const translation = snapshot.data.productTranslations.find(
    (t) => t.productId === product.id && t.locale === locale,
  );
  return translation ? { product, translation } : null;
}

function findProductAnySlugInSnapshot(snapshot: PublicDataSnapshot, slug: string) {
  const translation = snapshot.data.productTranslations.find((t) => t.slug === slug);
  if (!translation) return null;
  const product = snapshot.data.products.find((p) => p.id === translation.productId && p.isActive);
  return product ? { product, translation } : null;
}

export async function getHomePagePublicData(locale: string): Promise<HomePagePublicData> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const activeBanners = snapshot.data.banners.filter((b) => b.isActive).sort(byDisplayOrder);
    const bannerSlides = activeBanners.map((b) => {
      const trans = snapshot.data.bannerTranslations.find((t) => t.bannerId === b.id && t.locale === locale);
      return {
        id: b.id,
        imageUrl: b.imageUrl,
        title: trans?.title,
        subtitle: trans?.subtitle,
        ctaText: trans?.ctaText,
        ctaLink: b.ctaLink,
      };
    });

    const featuredRows = snapshot.data.products
      .filter((p) => p.isFeatured && p.isActive)
      .sort(byCreatedAtDesc)
      .slice(0, 200);
    const activeCats = snapshot.data.productCategories.filter((c) => c.isActive).sort(byDisplayOrder);
    const activeFaqs = snapshot.data.faqs.filter((f) => f.isActive).sort(byDisplayOrder);

    return {
      bannerSlides,
      featuredProducts: productCardsFromRows(
        featuredRows,
        snapshot.data.productTranslations,
        snapshot.data.productImages,
        locale,
      ),
      categories: categoryOptionsFromRows(activeCats, snapshot.data.categoryTranslations, locale),
      facilityPhotos: snapshot.data.aboutGallery
        .filter((p) => p.imageType === 'factory')
        .sort(byDisplayOrder)
        .slice(0, 8),
      certificationPhotos: snapshot.data.aboutGallery
        .filter((p) => p.imageType === 'certification')
        .sort(byDisplayOrder),
      exhibitionPhotos: snapshot.data.aboutGallery
        .filter((p) => p.imageType === 'exhibition')
        .sort(byDisplayOrder)
        .map((p) => ({ imageUrl: p.imageUrl, caption: p.caption })),
      faqs: faqPairsFromRows(activeFaqs, snapshot.data.faqTranslations, locale),
    };
  }

  const db = getDb();
  const [bannerData, featuredProducts, allCats, facilityPhotos, certPhotos, exhibitionPhotos] = await Promise.all([
    db.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.displayOrder),
    db
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt))
      .limit(200),
    db.select().from(productCategories).where(eq(productCategories.isActive, true)).orderBy(productCategories.displayOrder),
    db.select().from(aboutGallery).where(eq(aboutGallery.imageType, 'factory')).orderBy(aboutGallery.displayOrder).limit(8),
    db.select().from(aboutGallery).where(eq(aboutGallery.imageType, 'certification')).orderBy(aboutGallery.displayOrder),
    db
      .select({ imageUrl: aboutGallery.imageUrl, caption: aboutGallery.caption })
      .from(aboutGallery)
      .where(eq(aboutGallery.imageType, 'exhibition'))
      .orderBy(aboutGallery.displayOrder),
  ]);

  const bannerIds = bannerData.map((b) => b.id);
  const productIds = featuredProducts.map((p) => p.id);
  const catIds = allCats.map((c) => c.id);
  const [bannerTrans, productTrans, productTransEn, productImgs, catTrans, catTransEn] = await Promise.all([
    bannerIds.length
      ? db.select().from(bannerTranslations).where(and(inArray(bannerTranslations.bannerId, bannerIds), eq(bannerTranslations.locale, locale)))
      : Promise.resolve([] as BannerTranslationRow[]),
    productIds.length
      ? db.select().from(productTranslations).where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, locale)))
      : Promise.resolve([] as ProductTranslationRow[]),
    productIds.length && locale !== defaultLocale
      ? db.select().from(productTranslations).where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, defaultLocale)))
      : Promise.resolve([] as ProductTranslationRow[]),
    productIds.length ? db.select().from(productImages).where(inArray(productImages.productId, productIds)) : Promise.resolve([] as ProductImageRow[]),
    catIds.length
      ? db.select().from(categoryTranslations).where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, locale)))
      : Promise.resolve([] as CategoryTranslationRow[]),
    catIds.length && locale !== defaultLocale
      ? db.select().from(categoryTranslations).where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, defaultLocale)))
      : Promise.resolve([] as CategoryTranslationRow[]),
  ]);

  const faqData = await db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(faqs.displayOrder);
  const faqIds = faqData.map((f) => f.id);
  const [faqTrans, faqTransEn] = await Promise.all([
    faqIds.length
      ? db.select().from(faqTranslations).where(and(inArray(faqTranslations.faqId, faqIds), eq(faqTranslations.locale, locale)))
      : Promise.resolve([] as FaqTranslationRow[]),
    faqIds.length && locale !== defaultLocale
      ? db.select().from(faqTranslations).where(and(inArray(faqTranslations.faqId, faqIds), eq(faqTranslations.locale, defaultLocale)))
      : Promise.resolve([] as FaqTranslationRow[]),
  ]);

  const bannerTransMap = new Map(bannerTrans.map((t) => [t.bannerId, t]));
  return {
    bannerSlides: bannerData.map((b) => {
      const trans = bannerTransMap.get(b.id);
      return {
        id: b.id,
        imageUrl: b.imageUrl,
        title: trans?.title,
        subtitle: trans?.subtitle,
        ctaText: trans?.ctaText,
        ctaLink: b.ctaLink,
      };
    }),
    featuredProducts: productCardsFromRows(featuredProducts, [...productTrans, ...productTransEn], productImgs, locale),
    categories: categoryOptionsFromRows(allCats, [...catTrans, ...catTransEn], locale),
    facilityPhotos,
    certificationPhotos: certPhotos,
    exhibitionPhotos,
    faqs: faqPairsFromRows(faqData, [...faqTrans, ...faqTransEn], locale),
  };
}

export async function getProductsPagePublicData(locale: string): Promise<ProductsPagePublicData> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const activeProducts = snapshot.data.products.filter((p) => p.isActive).sort(byCreatedAtDesc);
    const activeCats = snapshot.data.productCategories.filter((c) => c.isActive).sort(byDisplayOrder);
    return {
      products: productCardsFromRows(activeProducts, snapshot.data.productTranslations, snapshot.data.productImages, locale),
      categories: categoryOptionsFromRows(activeCats, snapshot.data.categoryTranslations, locale),
    };
  }

  const db = getDb();
  const [allProducts, allCats] = await Promise.all([
    db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)),
    db.select().from(productCategories).where(eq(productCategories.isActive, true)).orderBy(productCategories.displayOrder),
  ]);
  const productIds = allProducts.map((p) => p.id);
  const catIds = allCats.map((c) => c.id);
  const [prodTrans, prodTransEn, prodImgs, catTrans, catTransEn] = await Promise.all([
    productIds.length
      ? db.select().from(productTranslations).where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, locale)))
      : Promise.resolve([] as ProductTranslationRow[]),
    productIds.length && locale !== defaultLocale
      ? db.select().from(productTranslations).where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, defaultLocale)))
      : Promise.resolve([] as ProductTranslationRow[]),
    productIds.length ? db.select().from(productImages).where(inArray(productImages.productId, productIds)) : Promise.resolve([] as ProductImageRow[]),
    catIds.length
      ? db.select().from(categoryTranslations).where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, locale)))
      : Promise.resolve([] as CategoryTranslationRow[]),
    catIds.length && locale !== defaultLocale
      ? db.select().from(categoryTranslations).where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, defaultLocale)))
      : Promise.resolve([] as CategoryTranslationRow[]),
  ]);
  return {
    products: productCardsFromRows(allProducts, [...prodTrans, ...prodTransEn], prodImgs, locale),
    categories: categoryOptionsFromRows(allCats, [...catTrans, ...catTransEn], locale),
  };
}

export async function getContactCategories(locale: string): Promise<CategoryOption[]> {
  return (await getProductsPagePublicData(locale)).categories;
}

export async function getAboutPagePublicData(locale: string): Promise<AboutPagePublicData> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const about =
      snapshot.data.aboutPages.find((row) => row.locale === locale) ||
      (locale !== defaultLocale ? snapshot.data.aboutPages.find((row) => row.locale === defaultLocale) : undefined);
    return {
      about,
      factoryPhotos: snapshot.data.aboutGallery.filter((p) => p.imageType === 'factory').sort(byDisplayOrder),
      certificationPhotos: snapshot.data.aboutGallery.filter((p) => p.imageType === 'certification').sort(byDisplayOrder),
    };
  }

  const db = getDb();
  let [about] = await db.select().from(aboutPage).where(eq(aboutPage.locale, locale)).limit(1);
  if (!about && locale !== defaultLocale) {
    [about] = await db.select().from(aboutPage).where(eq(aboutPage.locale, defaultLocale)).limit(1);
  }
  const [factoryPhotos, certificationPhotos] = await Promise.all([
    db.select().from(aboutGallery).where(eq(aboutGallery.imageType, 'factory')).orderBy(aboutGallery.displayOrder),
    db.select().from(aboutGallery).where(eq(aboutGallery.imageType, 'certification')).orderBy(aboutGallery.displayOrder),
  ]);
  return { about, factoryPhotos, certificationPhotos };
}

export async function getProductStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const activeProductIds = new Set(snapshot.data.products.filter((p) => p.isActive).map((p) => p.id));
    return snapshot.data.productTranslations
      .filter((r) => activeProductIds.has(r.productId))
      .map((r) => ({ locale: r.locale, slug: r.slug }));
  }

  const db = getDb();
  const rows = await db
    .select({ locale: productTranslations.locale, slug: productTranslations.slug })
    .from(productTranslations)
    .innerJoin(products, eq(products.id, productTranslations.productId))
    .where(eq(products.isActive, true));
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}

export async function getProductMetadataData(locale: string, slug: string): Promise<ProductMetadataData | null> {
  const snapshot = getSnapshot();
  if (snapshot) {
    let row = findProductRouteInSnapshot(snapshot, locale, slug);
    if (!row) {
      row = findProductHistoryInSnapshot(snapshot, locale, slug);
    }
    if (!row) {
      const target = findProductAnySlugInSnapshot(snapshot, slug);
      if (target) {
        const localized = snapshot.data.productTranslations.find(
          (t) => t.productId === target.product.id && t.locale === locale,
        );
        row = localized ? { product: target.product, translation: localized } : target;
      }
    }
    if (!row) return null;
    return {
      product: row.product,
      translation: row.translation,
      trans: row.translation,
      allTranslations: snapshot.data.productTranslations
        .filter((t) => t.productId === row.product.id)
        .map((t) => ({ locale: t.locale, slug: t.slug })),
      primaryImage: snapshot.data.productImages
        .filter((img) => img.productId === row.product.id)
        .sort(byDisplayOrder)[0],
    };
  }

  const db = getDb();
  const joined = await db
    .select({ product: products, trans: productTranslations })
    .from(productTranslations)
    .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(and(eq(productTranslations.slug, slug), eq(productTranslations.locale, locale), eq(products.isActive, true)))
      .limit(1);
  let row = joined[0];
  if (!row) {
    const historyJoined = await db
      .select({ product: products, trans: productTranslations })
      .from(productSlugHistory)
      .innerJoin(products, eq(products.id, productSlugHistory.productId))
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
      )
      .where(and(eq(productSlugHistory.oldSlug, slug), eq(productSlugHistory.locale, locale), eq(products.isActive, true)))
      .limit(1);
    row = historyJoined[0];
  }
  if (!row) {
    const any = await db
      .select({ product: products, trans: productTranslations })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(and(eq(productTranslations.slug, slug), eq(products.isActive, true)))
      .limit(1);
    const target = any[0];
    if (target) {
      const localized = await db
        .select()
        .from(productTranslations)
        .where(and(eq(productTranslations.productId, target.product.id), eq(productTranslations.locale, locale)))
        .limit(1);
      row = localized[0] ? { product: target.product, trans: localized[0] } : target;
    }
  }
  if (!row) return null;

  const [allTranslations, primaryImages] = await Promise.all([
    db
      .select({ locale: productTranslations.locale, slug: productTranslations.slug })
      .from(productTranslations)
      .where(eq(productTranslations.productId, row.product.id)),
    db
      .select({ imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(eq(productImages.productId, row.product.id))
      .orderBy(productImages.displayOrder)
      .limit(1),
  ]);

  return {
    product: row.product,
    translation: row.trans,
    trans: row.trans,
    allTranslations,
    primaryImage: primaryImages[0],
  };
}

export async function getProductDetailData(locale: string, slug: string): Promise<ProductDetailData> {
  const snapshot = getSnapshot();
  if (snapshot) {
    let row = findProductRouteInSnapshot(snapshot, locale, slug);
    if (!row) {
      const historyTarget = findProductHistoryInSnapshot(snapshot, locale, slug);
      if (historyTarget?.translation.slug && historyTarget.translation.slug !== slug) {
        return { type: 'redirect', destination: localizedPath(locale, `/products/${historyTarget.translation.slug}`) };
      }

      const target = findProductAnySlugInSnapshot(snapshot, slug);
      if (!target) return { type: 'notFound' };
      const localized = snapshot.data.productTranslations.find(
        (t) => t.productId === target.product.id && t.locale === locale,
      );
      if (localized?.slug && localized.slug !== slug) {
        return { type: 'redirect', destination: localizedPath(locale, `/products/${localized.slug}`) };
      }
      row = target;
    }

    const localeTrans =
      row.translation.locale === locale
        ? null
        : snapshot.data.productTranslations.find((t) => t.productId === row.product.id && t.locale === locale);
    const translation = localeTrans || row.translation;
    const specs = snapshot.data.productSpecifications.filter((s) => s.productId === row.product.id && s.locale === locale);
    const images = snapshot.data.productImages.filter((img) => img.productId === row.product.id).sort(byDisplayOrder);
    const relatedRows = row.product.categoryId
      ? snapshot.data.products
          .filter((p) => p.categoryId === row.product.categoryId && p.id !== row.product.id && p.isActive)
          .slice(0, 3)
      : [];

    return {
      type: 'ok',
      product: row.product,
      translation,
      specs,
      images,
      related: productCardsFromRows(relatedRows, snapshot.data.productTranslations, snapshot.data.productImages, locale).map((p) => ({
        ...p,
      })),
    };
  }

  const db = getDb();
  const joined = await db
    .select({ product: products, trans: productTranslations })
    .from(productTranslations)
    .innerJoin(products, eq(products.id, productTranslations.productId))
    .where(and(eq(productTranslations.slug, slug), eq(productTranslations.locale, locale), eq(products.isActive, true)))
    .limit(1);

  let product = joined[0]?.product;
  let translation = joined[0]?.trans;

  if (!product) {
    const historyTarget = await db
      .select({ product: products, trans: productTranslations })
      .from(productSlugHistory)
      .innerJoin(products, eq(products.id, productSlugHistory.productId))
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
      )
      .where(and(eq(productSlugHistory.oldSlug, slug), eq(productSlugHistory.locale, locale), eq(products.isActive, true)))
      .limit(1);

    if (historyTarget[0]?.trans.slug && historyTarget[0].trans.slug !== slug) {
      return { type: 'redirect', destination: localizedPath(locale, `/products/${historyTarget[0].trans.slug}`) };
    }

    const any = await db
      .select({ product: products, trans: productTranslations })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(and(eq(productTranslations.slug, slug), eq(products.isActive, true)))
      .limit(1);
    const target = any[0];
    if (!target) return { type: 'notFound' };

    const localizedSlugRow = await db
      .select({ slug: productTranslations.slug })
      .from(productTranslations)
      .where(and(eq(productTranslations.productId, target.product.id), eq(productTranslations.locale, locale)))
      .limit(1);

    if (localizedSlugRow[0]?.slug && localizedSlugRow[0].slug !== slug) {
      return { type: 'redirect', destination: localizedPath(locale, `/products/${localizedSlugRow[0].slug}`) };
    }

    product = target.product;
    translation = target.trans;
  }
  if (!product || !translation) return { type: 'notFound' };

  const [specs, images, localeTrans] = await Promise.all([
    db.select().from(productSpecifications).where(and(eq(productSpecifications.productId, product.id), eq(productSpecifications.locale, locale))),
    db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(productImages.displayOrder),
    translation.locale === locale
      ? Promise.resolve(null)
      : db
          .select()
          .from(productTranslations)
          .where(and(eq(productTranslations.productId, product.id), eq(productTranslations.locale, locale)))
          .limit(1)
          .then((r) => r[0] ?? null),
  ]);
  if (localeTrans) translation = localeTrans;

  let related: ProductCardData[] = [];
  if (product.categoryId) {
    const relatedProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.categoryId, product.categoryId), ne(products.id, product.id), eq(products.isActive, true)))
      .limit(3);
    const relatedIds = relatedProducts.map((p) => p.id);
    if (relatedIds.length) {
      const [relTrans, relTransEn, relImages] = await Promise.all([
        db.select().from(productTranslations).where(and(inArray(productTranslations.productId, relatedIds), eq(productTranslations.locale, locale))),
        locale !== defaultLocale
          ? db.select().from(productTranslations).where(and(inArray(productTranslations.productId, relatedIds), eq(productTranslations.locale, defaultLocale)))
          : Promise.resolve([] as ProductTranslationRow[]),
        db.select().from(productImages).where(inArray(productImages.productId, relatedIds)),
      ]);
      related = productCardsFromRows(relatedProducts, [...relTrans, ...relTransEn], relImages, locale);
    }
  }

  return { type: 'ok', product, translation, specs, images, related };
}

export async function getProductSitemapRows(): Promise<ProductSitemapRow[]> {
  const snapshot = getSnapshot();
  if (snapshot) {
    return snapshot.data.productTranslations.flatMap((t) => {
      const product = snapshot.data.products.find((p) => p.id === t.productId);
      return product
        ? [{ locale: t.locale, slug: t.slug, productId: t.productId, updatedAt: product.updatedAt, isActive: product.isActive }]
        : [];
    });
  }
  const db = getDb();
  return db
    .select({
      locale: productTranslations.locale,
      slug: productTranslations.slug,
      productId: productTranslations.productId,
      updatedAt: products.updatedAt,
      isActive: products.isActive,
    })
    .from(productTranslations)
    .innerJoin(products, eq(products.id, productTranslations.productId));
}

export async function getArticleSitemapRows(): Promise<ArticleSitemapRow[]> {
  const snapshot = getSnapshot();
  if (snapshot) {
    return snapshot.data.articleTranslations.flatMap((t) => {
      const article = snapshot.data.articles.find((a) => a.id === t.articleId);
      return article
        ? [{ locale: t.locale, slug: t.slug, articleId: t.articleId, updatedAt: article.updatedAt, isActive: article.isActive }]
        : [];
    });
  }
  const db = getDb();
  return db
    .select({
      locale: articleTranslations.locale,
      slug: articleTranslations.slug,
      articleId: articleTranslations.articleId,
      updatedAt: articles.updatedAt,
      isActive: articles.isActive,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId));
}

export function isKnownLocale(locale: string): boolean {
  return validLocale(locale);
}
