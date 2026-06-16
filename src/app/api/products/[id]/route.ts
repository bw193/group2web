import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { products, productTranslations, productSpecifications, productImages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { disambiguateProductSlug } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id);
  const locale = new URL(request.url).searchParams.get('locale') || 'en';

  const db = getDb();
  const [product] = await withDbRetryFast(() =>
    db.select().from(products).where(eq(products.id, productId)).limit(1),
  );
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Sequential on purpose: parallel reads force extra pool connections, whose
  // fresh handshakes are what stall on the long-haul dev link.
  const allTranslations = await withDbRetryFast(() =>
    db.select().from(productTranslations).where(eq(productTranslations.productId, productId)),
  );
  const specs = await withDbRetryFast(() =>
    db.select().from(productSpecifications).where(eq(productSpecifications.productId, productId)),
  );
  const images = await withDbRetryFast(() =>
    db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.displayOrder),
  );

  return NextResponse.json({
    ...product,
    tags: product.tags ? JSON.parse(product.tags) : [],
    translations: allTranslations,
    specifications: specs,
    images,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);
  const body = await request.json() as any;

  const db = getDb();
  const [existing] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Capture current slugs before mutating so a slug change also busts the old URL.
  const prevTrans = await db
    .select({ locale: productTranslations.locale, slug: productTranslations.slug })
    .from(productTranslations)
    .where(eq(productTranslations.productId, productId));

  // Effective model number after the update; used by the disambiguator.
  const effectiveModel = body.modelNumber ?? existing.modelNumber;

  let newTrans: { locale: string; slug: string }[] = [];
  try {
    newTrans = await db.transaction(async (tx) => {
      await tx.update(products)
        .set({
          categoryId: body.categoryId ?? existing.categoryId,
          modelNumber: body.modelNumber ?? existing.modelNumber,
          isFeatured: body.isFeatured ?? existing.isFeatured,
          isActive: body.isActive ?? existing.isActive,
          tags: body.tags ? JSON.stringify(body.tags) : existing.tags,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, productId));

      if (body.translations && Array.isArray(body.translations)) {
        for (const t of body.translations) {
          if (!t?.locale || !t?.slug) continue;
          const finalSlug = await disambiguateProductSlug(tx, {
            locale: t.locale,
            slug: t.slug,
            modelNumber: effectiveModel,
            productId,
            excludeProductId: productId,
          });
          const [existingTrans] = await tx.select().from(productTranslations)
            .where(and(eq(productTranslations.productId, productId), eq(productTranslations.locale, t.locale)))
            .limit(1);

          if (existingTrans) {
            await tx.update(productTranslations)
              .set({ name: t.name, slug: finalSlug, shortDescription: t.shortDescription, fullDescription: t.fullDescription })
              .where(eq(productTranslations.id, existingTrans.id));
          } else {
            await tx.insert(productTranslations).values({
              productId, locale: t.locale, name: t.name, slug: finalSlug,
              shortDescription: t.shortDescription, fullDescription: t.fullDescription,
            });
          }
        }
      }

      if (body.specifications && Array.isArray(body.specifications)) {
        await tx.delete(productSpecifications).where(eq(productSpecifications.productId, productId));
        for (const spec of body.specifications) {
          await tx.insert(productSpecifications).values({
            productId, locale: spec.locale || 'en', specKey: spec.key, specValue: spec.value,
          });
        }
      }

      if (body.images && Array.isArray(body.images)) {
        await tx.delete(productImages).where(eq(productImages.productId, productId));
        const hasPrimary = body.images.some((img: any) => img.isPrimary);
        for (let i = 0; i < body.images.length; i++) {
          const img = body.images[i];
          if (!img?.imageUrl) continue;
          await tx.insert(productImages).values({
            productId,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary ?? (!hasPrimary && i === 0),
            displayOrder: typeof img.displayOrder === 'number' ? img.displayOrder : i,
          });
        }
      }

      return await tx
        .select({ locale: productTranslations.locale, slug: productTranslations.slug })
        .from(productTranslations)
        .where(eq(productTranslations.productId, productId));
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }

  // Bust ISR cache so CMS edits show up on the public site immediately.
  // Covers both old and new slugs (in case the slug changed) plus the listing
  // and home (featured grid) once per locale.
  const seenLocales = new Set<string>();
  for (const t of [...prevTrans, ...newTrans]) {
    revalidatePath(`/${t.locale}/products/${t.slug}`);
    if (!seenLocales.has(t.locale)) {
      seenLocales.add(t.locale);
      revalidatePath(`/${t.locale}/products`);
      revalidatePath(`/${t.locale}`);
    }
  }

  return NextResponse.json({ message: 'Product updated', translations: newTrans });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);
  const db = getDb();

  // Capture localized slugs before deleting so we can bust the detail pages,
  // listing, and home grid in each locale the product appeared in.
  const delTrans = await db
    .select({ locale: productTranslations.locale, slug: productTranslations.slug })
    .from(productTranslations)
    .where(eq(productTranslations.productId, productId));

  await db.delete(products).where(eq(products.id, productId));

  const seenLocales = new Set<string>();
  for (const t of delTrans) {
    revalidatePath(`/${t.locale}/products/${t.slug}`);
    if (!seenLocales.has(t.locale)) {
      seenLocales.add(t.locale);
      revalidatePath(`/${t.locale}/products`);
      revalidatePath(`/${t.locale}`);
    }
  }

  return NextResponse.json({ message: 'Product deleted' });
}
