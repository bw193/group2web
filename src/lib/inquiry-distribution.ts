import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { siteSettings, users } from '@/lib/db/schema';
import { buildInquiryEmail, type InquiryEmailDetails } from '@/lib/inquiry-email-content';
import {
  INQUIRY_RECIPIENT_USER_IDS_KEY,
  parseRecipientUserIds,
} from '@/lib/inquiry-routing';

interface InquiryRecipient {
  id: number;
  email: string;
}

export type InquiryDistributionResult =
  | { status: 'sent'; recipientCount: number }
  | { status: 'skipped'; reason: 'not_configured' | 'no_recipients' };

async function getRecipients(): Promise<InquiryRecipient[]> {
  const db = getDb();
  const [setting] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, INQUIRY_RECIPIENT_USER_IDS_KEY))
    .limit(1);

  const recipientIds = parseRecipientUserIds(setting?.value);
  if (recipientIds.length === 0) return [];

  return db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(inArray(users.id, recipientIds), eq(users.status, 'approved')));
}

export async function distributeInquiry(
  inquiry: InquiryEmailDetails,
): Promise<InquiryDistributionResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  const recipients = await getRecipients();
  if (recipients.length === 0) {
    return { status: 'skipped', reason: 'no_recipients' };
  }

  const { subject, html, text } = buildInquiryEmail(inquiry);
  const payload = recipients.map((recipient) => ({
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
  }));

  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `website-inquiry/${inquiry.id}/distribution-v1`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 500);
    throw new Error(`Resend batch request failed (${response.status}): ${responseBody}`);
  }

  return { status: 'sent', recipientCount: recipients.length };
}
