import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { products, productTranslations, productImages, productSpecifications } from '@/lib/db/schema';
import { eq, and, desc, inArray, type SQL } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { disambiguateProductSlug } from '@/lib/products';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const db = getDb();

  // Filter in SQL, not JS
  const conditions: SQL[] = [eq(products.isActive, true)];
  if (category) {
    const catId = parseInt(category);
    if (!Number.isNaN(catId)) conditions.push(eq(products.categoryId, catId));
  }
  if (featured === 'true') {
    conditions.push(eq(products.isFeatured, true));
  }

  const allProducts = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt));

  if (allProducts.length === 0) {
    return NextResponse.json([]);
  }

  const productIds = allProducts.map((p) => p.id);

  // Batch all translations + images in 3 queries total (instead of 2N)
  const [trans, transEn, imgs] = await Promise.all([
    db
      .select()
      .from(productTranslations)
      .where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, locale))),
    locale !== 'en'
      ? db
          .select()
          .from(productTranslations)
          .where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, 'en')))
      : Promise.resolve([]),
    db.select().from(productImages).where(inArray(productImages.productId, productIds)),
  ]);

  const transMap = new Map(trans.map((t) => [t.productId, t]));
  const transEnMap = new Map(transEn.map((t) => [t.productId, t]));
  const imgMap = new Map<number, typeof imgs[number]>();
  for (const img of imgs) {
    const existing = imgMap.get(img.productId);
    if (!existing || (img.isPrimary && !existing.isPrimary)) {
      imgMap.set(img.productId, img);
    }
  }

  const result = allProducts.map((p) => {
    const t = transMap.get(p.id) || transEnMap.get(p.id);
    const primaryImg = imgMap.get(p.id);
    return {
      id: p.id,
      name: t?.name || 'Product',
      slug: t?.slug || `product-${p.id}`,
      shortDescription: t?.shortDescription || null,
      modelNumber: p.modelNumber,
      imageUrl: primaryImg?.imageUrl || null,
      isFeatured: p.isFeatured,
      categoryId: p.categoryId,
      tags: p.tags ? JSON.parse(p.tags) : [],
      createdAt: p.createdAt,
    };
  });

  const filtered = search
    ? result.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.modelNumber && p.modelNumber.toLowerCase().includes(search.toLowerCase()))
      )
    : result;

  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json(paginated, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json() as any;
    const { categoryId, modelNumber, isFeatured, isActive, tags, translations, specifications, images } = body;

    const db = getDb();

    // Single transaction: a translation slug collision (or any other failure)
    // rolls back the product row too, so the public site never sees a product
    // with missing locale translations.
    const { product, finalTranslations } = await db.transaction(async (tx) => {
      const [created] = await tx.insert(products).values({
        categoryId: categoryId || null,
        modelNumber: modelNumber || null,
        isFeatured: isFeatured || false,
        isActive: isActive !== false,
        tags: tags ? JSON.stringify(tags) : null,
        createdBy: session.userId,
      }).returning();

      const finalT: { locale: string; slug: string }[] = [];
      if (translations && Array.isArray(translations)) {
        for (const t of translations) {
          if (!t?.locale || !t?.slug) continue;
          const finalSlug = await disambiguateProductSlug(tx, {
            locale: t.locale,
            slug: t.slug,
            modelNumber: modelNumber || null,
            productId: created.id,
          });
          await tx.insert(productTranslations).values({
            productId: created.id,
            locale: t.locale,
            name: t.name,
            slug: finalSlug,
            shortDescription: t.shortDescription || null,
            fullDescription: t.fullDescription || null,
          });
          finalT.push({ locale: t.locale, slug: finalSlug });
        }
      }

      if (specifications && Array.isArray(specifications)) {
        for (const spec of specifications) {
          await tx.insert(productSpecifications).values({
            productId: created.id,
            locale: spec.locale || 'en',
            specKey: spec.key,
            specValue: spec.value,
          });
        }
      }

      if (images && Array.isArray(images) && images.length > 0) {
        const hasPrimary = images.some((img: any) => img.isPrimary);
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img?.imageUrl) continue;
          await tx.insert(productImages).values({
            productId: created.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary ?? (!hasPrimary && i === 0),
            displayOrder: typeof img.displayOrder === 'number' ? img.displayOrder : i,
          });
        }
      }

      return { product: created, finalTranslations: finalT };
    });

    // Bust ISR cache for the home page (featured grid), the products index,
    // and the new product's detail page in every locale with a translation.
    for (const t of finalTranslations) {
      revalidatePath(`/${t.locale}`);
      revalidatePath(`/${t.locale}/products`);
      revalidatePath(`/${t.locale}/products/${t.slug}`);
    }

    return NextResponse.json({ ...product, translations: finalTranslations }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
