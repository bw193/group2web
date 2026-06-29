import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { products, productTranslations, productSpecifications, productImages, productSlugHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { HEBREW_SLUG_LOCALE } from '@/lib/localized-slugs';
import {
  PRODUCT_SLUG_SOURCE_LOCALE,
  disambiguateSharedProductSlug,
  productSlugFromInput,
  resolveProductTranslationSlug,
} from '@/lib/products';

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
  const prevSlugByLocale = new Map(prevTrans.map((t) => [t.locale, t.slug]));
  const currentEnglishSlug = prevSlugByLocale.get(PRODUCT_SLUG_SOURCE_LOCALE) ?? null;
  const translationInputs = Array.isArray(body.translations)
    ? body.translations.filter((t: any) => t?.locale && t?.name?.trim())
    : [];
  const englishInput = translationInputs.find((t: any) => t.locale === PRODUCT_SLUG_SOURCE_LOCALE);

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
        const localesNeedingEnglishSlug = new Set<string>([PRODUCT_SLUG_SOURCE_LOCALE]);
        for (const t of translationInputs) {
          if (t.locale === HEBREW_SLUG_LOCALE || (t.locale !== PRODUCT_SLUG_SOURCE_LOCALE && !prevSlugByLocale.has(t.locale))) {
            localesNeedingEnglishSlug.add(t.locale);
          }
        }
        if (prevSlugByLocale.has(HEBREW_SLUG_LOCALE)) {
          localesNeedingEnglishSlug.add(HEBREW_SLUG_LOCALE);
        }

        const desiredEnglishSlug = englishInput
          ? productSlugFromInput(englishInput)
          : currentEnglishSlug;
        if (!desiredEnglishSlug) {
          throw new Error('English product translation with a valid slug or name is required');
        }
        const sharedEnglishSlug = await disambiguateSharedProductSlug(tx, {
          locales: Array.from(localesNeedingEnglishSlug),
          slug: desiredEnglishSlug,
          modelNumber: effectiveModel,
          productId,
          excludeProductId: productId,
        });
        if (!englishInput && sharedEnglishSlug !== desiredEnglishSlug) {
          throw new Error('Current English product slug conflicts with a new localized URL');
        }
        const finalEnglishSlug = sharedEnglishSlug;

        for (const t of translationInputs) {
          const [existingTrans] = await tx.select().from(productTranslations)
            .where(and(eq(productTranslations.productId, productId), eq(productTranslations.locale, t.locale)))
            .limit(1);
          const finalSlug = resolveProductTranslationSlug({
            locale: t.locale,
            englishSlug: finalEnglishSlug,
            existingSlug: existingTrans?.slug,
          });
          const isHebrew = t.locale === HEBREW_SLUG_LOCALE;

          if (t.locale !== PRODUCT_SLUG_SOURCE_LOCALE && !isHebrew && !existingTrans && finalSlug !== finalEnglishSlug) {
            throw new Error(`New ${t.locale} product translation must use the English slug`);
          }
          if (t.locale !== PRODUCT_SLUG_SOURCE_LOCALE && !isHebrew && existingTrans && finalSlug !== existingTrans.slug) {
            throw new Error(`Existing ${t.locale} product slug cannot be changed by localized input`);
          }
          if (existingTrans && existingTrans.slug !== finalSlug) {
            await tx
              .insert(productSlugHistory)
              .values({ productId, locale: t.locale, oldSlug: existingTrans.slug })
              .onConflictDoNothing();
          }

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

        const [heTrans] = await tx
          .select()
          .from(productTranslations)
          .where(and(eq(productTranslations.productId, productId), eq(productTranslations.locale, HEBREW_SLUG_LOCALE)))
          .limit(1);
        if (heTrans) {
          const finalHebrewSlug = resolveProductTranslationSlug({
            locale: HEBREW_SLUG_LOCALE,
            englishSlug: finalEnglishSlug,
            existingSlug: heTrans.slug,
          });
          if (heTrans.slug !== finalHebrewSlug) {
            await tx
              .insert(productSlugHistory)
              .values({ productId, locale: HEBREW_SLUG_LOCALE, oldSlug: heTrans.slug })
              .onConflictDoNothing();
            await tx
              .update(productTranslations)
              .set({ slug: finalHebrewSlug })
              .where(eq(productTranslations.id, heTrans.id));
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
