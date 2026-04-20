import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { faqs, faqTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = (await request.json()) as {
    displayOrder?: number;
    isActive?: boolean;
    translations?: { locale: string; question: string; answer: string }[];
  };

  const db = getDb();
  await db
    .update(faqs)
    .set({
      displayOrder: body.displayOrder ?? 0,
      isActive: body.isActive !== false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(faqs.id, id));

  if (body.translations) {
    for (const t of body.translations) {
      if (!t.question?.trim()) continue;
      const [existing] = await db
        .select()
        .from(faqTranslations)
        .where(and(eq(faqTranslations.faqId, id), eq(faqTranslations.locale, t.locale)))
        .limit(1);
      if (existing) {
        await db
          .update(faqTranslations)
          .set({ question: t.question, answer: t.answer || '' })
          .where(eq(faqTranslations.id, existing.id));
      } else {
        await db.insert(faqTranslations).values({
          faqId: id,
          locale: t.locale,
          question: t.question,
          answer: t.answer || '',
        });
      }
    }
  }

  return NextResponse.json({ message: 'FAQ updated' });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const db = getDb();
  await db.delete(faqs).where(eq(faqs.id, id));
  return NextResponse.json({ message: 'FAQ deleted' });
}
