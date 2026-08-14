import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInquiryEmail } from '../src/lib/inquiry-email-content';
import {
  normalizeRecipientUserIds,
  parseInquiryRoutingState,
  parseRecipientUserIds,
  selectNextRecipientId,
  serializeInquiryRoutingState,
} from '../src/lib/inquiry-routing';

test('recipient employee IDs are validated, deduplicated, and sorted', () => {
  assert.deepEqual(normalizeRecipientUserIds([4, 2, 4, -1, 2.5, '3']), [2, 4]);
  assert.deepEqual(parseRecipientUserIds('[9,3,9]'), [3, 9]);
  assert.deepEqual(parseRecipientUserIds('not-json'), []);
  assert.deepEqual(parseRecipientUserIds(null), []);
});

test('inquiry routing state remains compatible with the legacy ID array', () => {
  assert.deepEqual(parseInquiryRoutingState('[9,3,9]'), {
    recipientUserIds: [3, 9],
    lastRecipientUserId: null,
  });

  const serialized = serializeInquiryRoutingState({
    recipientUserIds: [3, 9],
    lastRecipientUserId: 3,
  });
  assert.deepEqual(parseInquiryRoutingState(serialized), {
    recipientUserIds: [3, 9],
    lastRecipientUserId: 3,
  });
});

test('inquiry recipients rotate one at a time and wrap to the first account', () => {
  const recipientsByRegistrationTime = [1, 2, 3];

  assert.equal(selectNextRecipientId(recipientsByRegistrationTime, null), 1);
  assert.equal(selectNextRecipientId(recipientsByRegistrationTime, 1), 2);
  assert.equal(selectNextRecipientId(recipientsByRegistrationTime, 2), 3);
  assert.equal(selectNextRecipientId(recipientsByRegistrationTime, 3), 1);
  assert.equal(selectNextRecipientId([], 3), null);
  assert.equal(
    selectNextRecipientId(recipientsByRegistrationTime, 1, new Set([1, 3])),
    3,
  );
  assert.equal(
    selectNextRecipientId(recipientsByRegistrationTime, 3, new Set([1, 3])),
    1,
  );
  assert.equal(
    selectNextRecipientId(recipientsByRegistrationTime, 1, new Set()),
    null,
  );
});

test('inquiry email content escapes customer input and strips subject newlines', () => {
  const email = buildInquiryEmail({
    id: 42,
    name: 'Alice\r\nBcc: attacker@example.com',
    email: 'alice@example.com',
    phone: null,
    company: '<b>Example & Co</b>',
    country: 'Canada',
    productInterest: 'Round Mirror\nUrgent',
    message: '<script>alert("x")</script>\nPlease quote 100 units.',
    createdAt: '2026-08-13T08:30:00.000Z',
  });

  assert.equal(
    email.subject,
    '[Website Inquiry #42] Round Mirror Urgent — Alice Bcc: attacker@example.com',
  );
  assert.match(email.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;b&gt;Example &amp; Co&lt;\/b&gt;/);
  assert.match(email.text, /Please quote 100 units\./);
});
