import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import postgres from 'postgres';
import { recoverInquiryRecipients, type HistoricalInquiry, type SentInquiryEvidence } from '../src/lib/inquiry-recipient-history';
import { INQUIRY_RECIPIENT_USER_IDS_KEY, INQUIRY_RECIPIENT_WINDOW_DAYS } from '../src/lib/inquiry-routing';

// Dry-run by default. The input is an ignored, local export of Resend email
// metadata (including tags), never a customer-facing document or mail body.
// npx tsx scripts/backfill-inquiry-recipients.ts <metadata.json> [--apply]
config({ path: '.env.local', quiet: true });

async function main() {
  const [metadataPath, mode] = process.argv.slice(2);
  if (!metadataPath || (mode && mode !== '--apply')) {
    throw new Error('Usage: backfill-inquiry-recipients.ts <metadata.json> [--apply]');
  }
  const evidence = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
    fetchedAt: string;
    records: SentInquiryEvidence[];
  };
  if (!Array.isArray(evidence.records) || !Number.isFinite(Date.parse(evidence.fetchedAt))) {
    throw new Error('Expected a dated Resend metadata export');
  }
  const connection = process.env.DATABASE_URL;
  if (!connection) throw new Error('DATABASE_URL is required');
  const local = /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(connection);
  const client = postgres(connection, {
    ssl: local ? false : { rejectUnauthorized: false }, prepare: false, max: 1, connect_timeout: 10,
  });

  try {
    const report = await client.begin(async (tx) => {
      await tx`set local statement_timeout = '15s'`;
      if (mode === '--apply') {
        await tx`select value from public.site_settings where key = ${INQUIRY_RECIPIENT_USER_IDS_KEY} for update`;
      }
      const [column] = await tx`
        select exists(select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'inquiries' and column_name = 'recipient_user_id') as present
      `;
      if (mode === '--apply' && !column.present) throw new Error('Apply the recipient history migration first');
      const cutoff = new Date(Date.parse(evidence.fetchedAt) - INQUIRY_RECIPIENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const rows = await tx<{
        id: number; email: string; created_at: Date; recipient_user_id: number | null;
      }[]>`
        select id, email, created_at at time zone 'UTC' as created_at,
          ${column.present ? tx('recipient_user_id') : tx`null::integer`} as recipient_user_id
        from public.inquiries
        where created_at >= ${cutoff.toISOString()}::timestamp
          and created_at <= ${evidence.fetchedAt}::timestamp
        order by created_at, id
        ${mode === '--apply' ? tx`for update` : tx``}
      `;
      const inquiries: HistoricalInquiry[] = rows.map((row) => ({
        id: row.id, email: row.email, createdAt: row.created_at.toISOString(), recipientUserId: row.recipient_user_id,
      }));
      const employees = await tx<{ id: number; email: string }[]>`select id, email from public.users`;
      const plan = recoverInquiryRecipients(inquiries, employees, evidence.records);
      if (plan.unmatchedInquiryIds.length) {
        throw new Error(`Missing delivery evidence for inquiries: ${plan.unmatchedInquiryIds.join(', ')}`);
      }

      let updated = 0;
      for (const assignment of plan.assignments) {
        if (mode !== '--apply') continue;
        const changed = await tx`
          update public.inquiries set recipient_user_id = ${assignment.recipientUserId}
          where id = ${assignment.inquiryId} and recipient_user_id is null
          returning id
        `;
        updated += changed.length;
      }
      const summary = {
        mode: mode === '--apply' ? 'applied' : 'dry-run',
        evidenceFetchedAt: evidence.fetchedAt,
        completedAt: new Date().toISOString(),
        inquiryCount: inquiries.length,
        customerCount: new Set(plan.assignments.map((assignment) => assignment.customerEmail)).size,
        updated,
        correctedRepeats: plan.assignments
          .filter((assignment) => assignment.recipientUserId !== assignment.originalRecipientUserId)
          .map(({ inquiryId, originalRecipientUserId, recipientUserId }) => ({ inquiryId, originalRecipientUserId, recipientUserId })),
        orphanedInquiryIds: plan.orphanedInquiryIds,
        assignments: plan.assignments.map(({ customerEmail, ...assignment }) => ({
          ...assignment,
          customerEmailHash: createHash('sha256').update(customerEmail).digest('hex'),
        })),
      };
      // Write the audit file before commit; failure to preserve evidence rolls
      // back the backfill. The final applied report is written after commit.
      writeFileSync(resolve(metadataPath, '..', 'backfill-plan.json'), JSON.stringify(summary, null, 2));
      return summary;
    });
    if (mode === '--apply') {
      writeFileSync(resolve(metadataPath, '..', 'backfill-applied.json'), JSON.stringify(report, null, 2));
    }
    const { assignments, ...summary } = report;
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
