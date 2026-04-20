import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { faqs, faqTranslations } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// Public-ish list endpoint.
// - ?locale=xx          → returns only active faqs with that locale's translation (falls back to en)
// - ?all=1              → returns every faq with every translation (CMS use)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';
  const all = url.searchParams.get('all') === '1';

  const db = getDb();

  if (all) {
    const rows = await db.select().from(faqs).orderBy(faqs.displayOrder);
    if (rows.length === 0) return NextResponse.json([]);
    const ids = rows.map((r) => r.id);
    const trans = await db
      .select()
      .from(faqTranslations)
      .where(inArray(faqTranslations.faqId, ids));
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        translations: trans.filter((t) => t.faqId === r.id),
      }))
    );
  }

  const active = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(faqs.displayOrder);

  if (active.length === 0) return NextResponse.json([]);
  const ids = active.map((r) => r.id);

  const primary = await db
    .select()
    .from(faqTranslations)
    .where(and(inArray(faqTranslations.faqId, ids), eq(faqTranslations.locale, locale)));

  const fallback =
    locale === 'en'
      ? []
      : await db
          .select()
          .from(faqTranslations)
          .where(and(inArray(faqTranslations.faqId, ids), eq(faqTranslations.locale, 'en')));

  const pMap = new Map(primary.map((t) => [t.faqId, t]));
  const fMap = new Map(fallback.map((t) => [t.faqId, t]));

  const out = active
    .map((r) => {
      const t = pMap.get(r.id) || fMap.get(r.id);
      if (!t) return null;
      return { id: r.id, displayOrder: r.displayOrder, question: t.question, answer: t.answer };
    })
    .filter((x): x is { id: number; displayOrder: number; question: string; answer: string } => !!x);

  return NextResponse.json(out);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await request.json()) as {
    displayOrder?: number;
    isActive?: boolean;
    translations?: { locale: string; question: string; answer: string }[];
  };

  if (!body.translations?.length || !body.translations[0].question) {
    return NextResponse.json({ error: 'At least one translation with a question is required' }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(faqs)
    .values({
      displayOrder: body.displayOrder ?? 0,
      isActive: body.isActive !== false,
      createdBy: session.userId,
    })
    .returning();

  for (const t of body.translations) {
    if (!t.question?.trim()) continue;
    await db.insert(faqTranslations).values({
      faqId: row.id,
      locale: t.locale,
      question: t.question,
      answer: t.answer || '',
    });
  }

  return NextResponse.json(row, { status: 201 });
}
