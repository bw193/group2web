import { INQUIRY_RECIPIENT_WINDOW_DAYS } from './inquiry-routing';

export interface HistoricalInquiry {
  id: number;
  email: string;
  createdAt: string;
  recipientUserId: number | null;
}

export interface SentInquiryEvidence {
  id: string;
  subject: string;
  created_at: string;
  to: string[];
  reply_to: string[] | null;
  cc: string[] | null;
  bcc: string[] | null;
  last_event: string;
  tags: { name: string; value: string }[];
}

export interface RecoveredInquiryRecipient {
  inquiryId: number;
  customerEmail: string;
  inquiryCreatedAt: string;
  recipientUserId: number;
  originalRecipientUserId: number;
  resendEmailId: string;
  sentAt: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Recover ownership only from mutually consistent delivery evidence. */
export function recoverInquiryRecipients(
  inquiries: HistoricalInquiry[],
  employees: { id: number; email: string }[],
  emails: SentInquiryEvidence[],
) {
  const inquiryById = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const deliveries = new Map<number, RecoveredInquiryRecipient>();
  const orphanedInquiryIds = new Set<number>();

  for (const email of emails) {
    const subjectId = email.subject.match(/^\[Website Inquiry #(\d+)\]/)?.[1];
    const inquiryTags = email.tags.filter((tag) => tag.name === 'inquiry_id');
    const recipientTags = email.tags.filter((tag) => tag.name === 'recipient_user_id');
    if (!subjectId || inquiryTags.length !== 1 || inquiryTags[0].value !== subjectId ||
        recipientTags.length !== 1 || !/^[1-9]\d*$/.test(recipientTags[0].value)) {
      throw new Error(`Conflicting or missing inquiry tags in Resend email ${email.id}`);
    }

    const inquiryId = Number(subjectId);
    const inquiry = inquiryById.get(inquiryId);
    if (!inquiry) {
      orphanedInquiryIds.add(inquiryId);
      continue;
    }
    const recipientUserId = Number(recipientTags[0].value);
    const employee = employeeById.get(recipientUserId);
    if (!employee || email.to.length !== 1 || email.cc?.length || email.bcc?.length ||
        normalizeEmail(email.to[0]) !== normalizeEmail(employee.email)) {
      throw new Error(`Recipient evidence does not match employee for inquiry ${inquiryId}`);
    }
    if (email.reply_to?.length !== 1 ||
        normalizeEmail(email.reply_to[0]) !== normalizeEmail(inquiry.email)) {
      throw new Error(`Customer email does not match inquiry ${inquiryId}`);
    }
    const sentAt = Date.parse(email.created_at);
    const createdAt = Date.parse(inquiry.createdAt);
    if (!Number.isFinite(sentAt) || !Number.isFinite(createdAt) || sentAt < createdAt - 1000 ||
        !['delivered', 'opened', 'clicked'].includes(email.last_event)) {
      throw new Error(`No confirmed delivery for inquiry ${inquiryId}`);
    }
    const existing = deliveries.get(inquiryId);
    if (existing && existing.originalRecipientUserId !== recipientUserId) {
      throw new Error(`Multiple delivered recipients for inquiry ${inquiryId}`);
    }
    if (!existing || sentAt < Date.parse(existing.sentAt)) {
      deliveries.set(inquiryId, {
        inquiryId,
        customerEmail: normalizeEmail(inquiry.email),
        inquiryCreatedAt: inquiry.createdAt,
        recipientUserId,
        originalRecipientUserId: recipientUserId,
        resendEmailId: email.id,
        sentAt: new Date(sentAt).toISOString(),
      });
    }
  }

  const assignments = [...deliveries.values()].sort((a, b) =>
    Date.parse(a.inquiryCreatedAt) - Date.parse(b.inquiryCreatedAt) || a.inquiryId - b.inquiryId,
  );
  const owners = new Map<string, { recipientUserId: number; lastInquiryAt: number }>();
  const windowMs = INQUIRY_RECIPIENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  for (const assignment of assignments) {
    const previous = owners.get(assignment.customerEmail);
    const createdAt = Date.parse(assignment.inquiryCreatedAt);
    // Historical round-robin deliveries may disagree for the same customer.
    // Restore the first owner in each rolling 30-day sequence, while retaining
    // the actual delivered recipient separately in the audit record.
    if (previous && createdAt - previous.lastInquiryAt <= windowMs) {
      assignment.recipientUserId = previous.recipientUserId;
    }
    owners.set(assignment.customerEmail, {
      recipientUserId: assignment.recipientUserId,
      lastInquiryAt: createdAt,
    });
    const storedRecipient = inquiryById.get(assignment.inquiryId)!.recipientUserId;
    if (storedRecipient !== null && storedRecipient !== assignment.recipientUserId) {
      throw new Error(`Refusing to overwrite existing assignment for inquiry ${assignment.inquiryId}`);
    }
  }

  return {
    assignments,
    orphanedInquiryIds: [...orphanedInquiryIds].sort((a, b) => a - b),
    unmatchedInquiryIds: inquiries.filter((inquiry) => !deliveries.has(inquiry.id)).map((inquiry) => inquiry.id),
  };
}
