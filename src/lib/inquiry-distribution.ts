import 'server-only';

import { asc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { siteSettings, users } from '@/lib/db/schema';
import { buildInquiryEmail, type InquiryEmailDetails } from '@/lib/inquiry-email-content';
import {
  INQUIRY_RECIPIENT_USER_IDS_KEY,
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

async function claimNextRecipient(): Promise<InquiryRecipient | null> {
  const db = getDb();

  return db.transaction(async (tx) => {
    // Lock the routing row so simultaneous inquiries cannot claim the same
    // employee. Supabase's transaction pooler keeps this lock for the whole
    // transaction, then releases it before the external Resend request.
    const [setting] = await tx
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, INQUIRY_RECIPIENT_USER_IDS_KEY))
      .limit(1)
      .for('update');

    const state = parseInquiryRoutingState(setting?.value);
    if (state.recipientUserIds.length === 0) return null;

    const recipients = await tx
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .where(inArray(users.id, state.recipientUserIds))
      .orderBy(asc(users.createdAt), asc(users.id));

    const recipientId = selectNextRecipientId(
      recipients.map((recipient) => recipient.id),
      state.lastRecipientUserId,
      new Set(
        recipients
          .filter((recipient) => recipient.status === 'approved')
          .map((recipient) => recipient.id),
      ),
    );
    if (recipientId === null) return null;

    const recipient = recipients.find((candidate) => candidate.id === recipientId);
    if (!recipient) return null;

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

  const recipient = await claimNextRecipient();
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
