import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getDb, withDbRetryFast } from '@/lib/db';
import { siteSettings, users } from '@/lib/db/schema';
import {
  INQUIRY_RECIPIENT_USER_IDS_KEY,
  normalizeRecipientUserIds,
  parseInquiryRoutingState,
  parseRecipientUserIds,
  serializeInquiryRoutingState,
} from '@/lib/inquiry-routing';

const routingSchema = z.object({
  recipientUserIds: z.array(z.number().int().positive()).max(100),
}).strict();

async function requireAdmin() {
  const session = await getSession();
  return session?.role === 'admin' ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const [employees, settings] = await Promise.all([
    withDbRetryFast(() =>
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.status, 'approved'))
        .orderBy(asc(users.createdAt), asc(users.id)),
    ),
    withDbRetryFast(() =>
      db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, INQUIRY_RECIPIENT_USER_IDS_KEY))
        .limit(1),
    ),
  ]);

  const availableIds = new Set(employees.map((employee) => employee.id));
  const recipientUserIds = parseRecipientUserIds(settings[0]?.value).filter((id) =>
    availableIds.has(id),
  );

  return NextResponse.json({
    employees,
    recipientUserIds,
    emailConfigured: Boolean(
      process.env.RESEND_API_KEY?.trim() && process.env.INQUIRY_FROM_EMAIL?.trim(),
    ),
  });
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = routingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const recipientUserIds = normalizeRecipientUserIds(parsed.data.recipientUserIds);
  const db = getDb();

  if (recipientUserIds.length > 0) {
    const approvedEmployees = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, recipientUserIds), eq(users.status, 'approved')));

    if (approvedEmployees.length !== recipientUserIds.length) {
      return NextResponse.json(
        { error: 'One or more employees are unavailable' },
        { status: 400 },
      );
    }
  }

  await db.transaction(async (tx) => {
    const [currentSetting] = await tx
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, INQUIRY_RECIPIENT_USER_IDS_KEY))
      .limit(1)
      .for('update');

    const currentState = parseInquiryRoutingState(currentSetting?.value);
    const recipientsChanged =
      currentState.recipientUserIds.length !== recipientUserIds.length ||
      currentState.recipientUserIds.some((id, index) => id !== recipientUserIds[index]);
    const value = serializeInquiryRoutingState({
      recipientUserIds,
      // A changed team starts a fresh rotation from the earliest registered account.
      lastRecipientUserId: recipientsChanged ? null : currentState.lastRecipientUserId,
    });

    await tx
      .insert(siteSettings)
      .values({ key: INQUIRY_RECIPIENT_USER_IDS_KEY, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date().toISOString() },
      });
  });

  return NextResponse.json({ message: 'Inquiry routing updated', recipientUserIds });
}
