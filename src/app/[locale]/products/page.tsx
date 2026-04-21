import { getTranslations } from 'next-intl/server';
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

export const revalidate = 300;

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('products');
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

  return (
    <>
      {/* Page intro */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-20 pb-16 md:pt-24 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="kicker-plain mb-6" data-reveal>
                <span className="text-bronze mr-3">— Catalog</span>
                {t('allCategories')}
              </p>
              <h1
                className="font-display text-5xl md:text-6xl lg:text-[80px] font-light text-ink leading-[0.98] tracking-[-0.02em]"
                data-reveal
              >
                {t('title')}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-right" data-reveal>
              <p className="text-[14px] font-body font-light text-ink-mid leading-relaxed max-w-sm lg:ml-auto">
                Mirrors engineered for bathrooms, hospitality, retail, and residential projects —
                browse the full collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductsFilter products={productsData} categories={categoriesData} />
    </>
  );
}
