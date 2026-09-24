import assert from 'node:assert/strict';
import test from 'node:test';
import { recoverInquiryRecipients, type HistoricalInquiry, type SentInquiryEvidence } from '../src/lib/inquiry-recipient-history';

const employees = [
  { id: 4, email: 'first@example.test' },
  { id: 5, email: 'second@example.test' },
  { id: 6, email: 'third@example.test' },
];
const start = Date.parse('2026-08-01T00:00:00.000Z');
const day = 24 * 60 * 60 * 1000;

function inquiry(id = 1, email = 'customer@example.test', offset = 0): HistoricalInquiry {
  return { id, email, createdAt: new Date(start + offset).toISOString(), recipientUserId: null };
}

function evidence(row: HistoricalInquiry, recipientUserId = 4): SentInquiryEvidence {
  return {
    id: `resend-${row.id}`, subject: `[Website Inquiry #${row.id}] Test`,
    created_at: new Date(Date.parse(row.createdAt) + 1000).toISOString(),
    to: [employees.find((employee) => employee.id === recipientUserId)!.email],
    reply_to: [row.email], cc: null, bcc: null, last_event: 'delivered',
    tags: [{ name: 'inquiry_id', value: String(row.id) }, { name: 'recipient_user_id', value: String(recipientUserId) }],
  };
}

test('recover a confirmed recipient from matching tags, subject, customer, and employee', () => {
  const row = inquiry();
  const result = recoverInquiryRecipients([row], employees, [evidence(row)]);
  assert.equal(result.assignments[0].recipientUserId, 4);
  assert.equal(result.assignments[0].originalRecipientUserId, 4);
  assert.deepEqual(result.orphanedInquiryIds, []);
  assert.deepEqual(result.unmatchedInquiryIds, []);
});

test('historical repeats keep the first owner and retain the original delivery evidence', () => {
  const first = inquiry(69, ' Customer@Example.test ');
  const repeat = inquiry(70, 'customer@example.test', 60_000);
  const result = recoverInquiryRecipients([repeat, first], employees, [evidence(repeat, 6), evidence(first, 5)]);
  assert.deepEqual(result.assignments.map((row) => row.recipientUserId), [5, 5]);
  assert.deepEqual(result.assignments.map((row) => row.originalRecipientUserId), [5, 6]);
  assert.equal(result.assignments[1].resendEmailId, 'resend-70');
});

test('recovery uses rolling 30-day windows and resets only after a longer gap', () => {
  const rows = [inquiry(1), inquiry(2, 'customer@example.test', 30 * day), inquiry(3, 'customer@example.test', 60 * day + 1)];
  const result = recoverInquiryRecipients(rows, employees, rows.map((row, index) => evidence(row, [4, 5, 6][index])));
  assert.deepEqual(result.assignments.map((row) => row.recipientUserId), [4, 4, 6]);
});

test('recovery never combines different customer emails', () => {
  const rows = [inquiry(1, 'customer+one@example.test'), inquiry(2, 'customer+two@example.test')];
  const result = recoverInquiryRecipients(rows, employees, [evidence(rows[0], 4), evidence(rows[1], 5)]);
  assert.deepEqual(result.assignments.map((row) => row.recipientUserId), [4, 5]);
});

test('recovery rejects tags that disagree with the subject', () => {
  const row = inquiry();
  const email = evidence(row);
  email.tags[0].value = '2';
  assert.throws(() => recoverInquiryRecipients([row], employees, [email]), /inquiry tags/);
});

test('recovery rejects a mismatched customer, recipient, or extra recipient', () => {
  const row = inquiry();
  assert.throws(() => recoverInquiryRecipients([row], employees, [{ ...evidence(row), reply_to: ['other@example.test'] }]), /Customer email/);
  assert.throws(() => recoverInquiryRecipients([row], employees, [{ ...evidence(row), to: ['other@example.test'] }]), /Recipient evidence/);
  assert.throws(() => recoverInquiryRecipients([row], employees, [{ ...evidence(row), cc: ['other@example.test'] }]), /Recipient evidence/);
});

test('recovery rejects unsuccessful delivery and mail that predates the inquiry', () => {
  const row = inquiry();
  assert.throws(() => recoverInquiryRecipients([row], employees, [{ ...evidence(row), last_event: 'bounced' }]), /confirmed delivery/);
  assert.throws(() => recoverInquiryRecipients([row], employees, [{ ...evidence(row), created_at: new Date(start - day).toISOString() }]), /confirmed delivery/);
});

test('recovery refuses ambiguous recipients for a single inquiry', () => {
  const row = inquiry();
  assert.throws(() => recoverInquiryRecipients([row], employees, [evidence(row, 4), evidence(row, 5)]), /Multiple delivered recipients/);
});

test('recovery reports deleted inquiries and missing evidence without guessing owners', () => {
  const result = recoverInquiryRecipients([inquiry(1)], employees, [evidence(inquiry(2))]);
  assert.deepEqual(result.assignments, []);
  assert.deepEqual(result.orphanedInquiryIds, [2]);
  assert.deepEqual(result.unmatchedInquiryIds, [1]);
});

test('recovery is idempotent and refuses to overwrite a different stored owner', () => {
  const row = { ...inquiry(), recipientUserId: 4 };
  assert.equal(recoverInquiryRecipients([row], employees, [evidence(row)]).assignments[0].recipientUserId, 4);
  assert.throws(() => recoverInquiryRecipients([{ ...row, recipientUserId: 5 }], employees, [evidence(row)]), /overwrite existing assignment/);
});
