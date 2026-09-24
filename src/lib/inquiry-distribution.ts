import 'server-only';

import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import { getDb, type DB } from '@/lib/db';
import { inquiries, siteSettings, users } from '@/lib/db/schema';
import { buildInquiryEmail, type InquiryEmailDetails } from '@/lib/inquiry-email-content';
import {
  INQUIRY_RECIPIENT_USER_IDS_KEY,
  INQUIRY_RECIPIENT_WINDOW_DAYS,
  parseInquiryRoutingState,
  selectNextRecipientId,
  serializeInquiryRoutingState,
} from '@/lib/inquiry-routing';

interface InquiryRecipient {
  id: number;
  email: string;
}

export type InquiryDistributionResult =
  | { status: 'sent'; recipientCount: number }
  | { status: 'skipped'; reason: 'not_configured' | 'no_recipients' };

function buildInquiryUrl(origin: string | undefined, inquiryId: number): string | null {
  if (!origin) return null;

  try {
    const url = new URL('/cms/inquiries', origin);
    url.searchParams.set('inquiryId', String(inquiryId));
    return url.toString();
  } catch {
    return null;
  }
}

export async function claimInquiryRecipient(
  inquiryId: number,
  db: Pick<DB, 'transaction'> = getDb(),
): Promise<InquiryRecipient | null> {
  return db.transaction(async (tx) => {
    // Serialize both customer lookups and new assignments. The next inquiry
    // must see the committed recipient before it decides whether to rotate.
    // Release the lock before making the external Resend request.
    const [setting] = await tx
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, INQUIRY_RECIPIENT_USER_IDS_KEY))
      .limit(1)
      .for('update');

    const state = parseInquiryRoutingState(setting?.value);
    if (state.recipientUserIds.length === 0) return null;

    const [inquiry] = await tx
      .select({ email: inquiries.email, recipientUserId: inquiries.recipientUserId })
      .from(inquiries)
      .where(eq(inquiries.id, inquiryId))
      .limit(1)
      .for('update');
    if (!inquiry) return null;

    const recipients = await tx
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .where(inArray(users.id, state.recipientUserIds))
      .orderBy(asc(users.createdAt), asc(users.id));

    const eligibleRecipientIds = new Set(
      recipients
        .filter((recipient) => recipient.status === 'approved')
        .map((recipient) => recipient.id),
    );

    // A retry must keep its original recipient and Resend idempotency key,
    // even if the customer's 30-day window has since expired.
    if (inquiry.recipientUserId !== null) {
      const recipient = recipients.find((candidate) =>
        candidate.id === inquiry.recipientUserId && eligibleRecipientIds.has(candidate.id),
      );
      return recipient ? { id: recipient.id, email: recipient.email } : null;
    }

    const cutoff = new Date(
      Date.now() - INQUIRY_RECIPIENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const [previousInquiry] = await tx
      .select({ recipientUserId: inquiries.recipientUserId })
      .from(inquiries)
      .where(and(
        eq(sql`lower(btrim(${inquiries.email}))`, inquiry.email.trim().toLowerCase()),
        gte(inquiries.createdAt, cutoff),
        isNotNull(inquiries.recipientUserId),
      ))
      .orderBy(desc(inquiries.createdAt), desc(inquiries.id))
      .limit(1);

    const previousRecipientId = previousInquiry?.recipientUserId;
    const reuseRecipient = previousRecipientId != null &&
      eligibleRecipientIds.has(previousRecipientId);
    const recipientId = reuseRecipient
      ? previousRecipientId
      : selectNextRecipientId(
        recipients.map((recipient) => recipient.id),
        state.lastRecipientUserId,
        eligibleRecipientIds,
      );
    if (recipientId === null) return null;

    const recipient = recipients.find((candidate) => candidate.id === recipientId);
    if (!recipient) return null;

    // Persist before sending so overlapping submissions and provider failures
    // keep the customer with the same employee. Repeats do not consume a turn.
    await tx
      .update(inquiries)
      .set({ recipientUserId: recipient.id })
      .where(eq(inquiries.id, inquiryId));

    if (!reuseRecipient) {
      await tx
        .update(siteSettings)
        .set({
          value: serializeInquiryRoutingState({
            recipientUserIds: state.recipientUserIds,
            lastRecipientUserId: recipient.id,
          }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(siteSettings.key, INQUIRY_RECIPIENT_USER_IDS_KEY));
    }

    return { id: recipient.id, email: recipient.email };
  });
}

export async function distributeInquiry(
  inquiry: InquiryEmailDetails,
  origin?: string,
): Promise<InquiryDistributionResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  const recipient = await claimInquiryRecipient(inquiry.id);
  if (!recipient) {
    return { status: 'skipped', reason: 'no_recipients' };
  }

  const { subject, html, text } = buildInquiryEmail(inquiry, {
    inquiryUrl: buildInquiryUrl(origin, inquiry.id),
  });
  const payload = {
    from,
    to: [recipient.email],
    reply_to: inquiry.email,
    subject,
    html,
    text,
    tags: [
      { name: 'inquiry_id', value: String(inquiry.id) },
      { name: 'recipient_user_id', value: String(recipient.id) },
    ],
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `website-inquiry/${inquiry.id}/recipient/${recipient.id}/v2`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 500);
    throw new Error(`Resend request failed (${response.status}): ${responseBody}`);
  }

  return { status: 'sent', recipientCount: 1 };
}
