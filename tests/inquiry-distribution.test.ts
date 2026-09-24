import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { DB } from '../src/lib/db';
import * as schema from '../src/lib/db/schema';
import {
  INQUIRY_RECIPIENT_USER_IDS_KEY,
  parseInquiryRoutingState,
  serializeInquiryRoutingState,
} from '../src/lib/inquiry-routing';

const databaseUrl = process.env.INQUIRY_TEST_DATABASE_URL;
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-24T12:00:00.000Z');

// Opt in with INQUIRY_TEST_DATABASE_URL and run npm run test:inquiry-routing.
// Every table is temporary, shadows the application table on this connection,
// and is rolled back. Explicit IDs avoid advancing any production sequence.
test('inquiry recipient persistence and delivery', {
  skip: !databaseUrl,
  timeout: 300_000,
}, async (t) => {
  const local = /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(databaseUrl!);
  const client = postgres(databaseUrl!, {
    ssl: local ? false : { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 10,
    onnotice: () => {},
  });
  const db = drizzle(client, { schema });
  const rollback = new Error('Roll back isolated inquiry test fixtures');

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local statement_timeout = '15s'`);
      await tx.execute(sql`set local search_path = pg_temp`);
      await tx.execute(sql`
        create temporary table users (
          id integer primary key, email text not null, status text not null,
          created_at timestamp not null
        ) on commit drop;
        create temporary table site_settings (
          id integer primary key, key text unique not null, value text,
          updated_at timestamp not null default now()
        ) on commit drop;
        create temporary table inquiries (
          id integer primary key, name text not null, email text not null,
          phone text, company text, country text, product_interest text,
          message text not null, is_read boolean not null default false,
          is_replied boolean not null default false,
          created_at timestamp not null default now()
        ) on commit drop;
      `);

      const migrationName = readdirSync('drizzle')
        .find((name) => name.endsWith('_inquiry_recipient_history.sql'));
      assert.ok(migrationName, 'The recipient history migration must exist');
      const migration = readFileSync(`drizzle/${migrationName}`, 'utf8')
        .replaceAll('public.', 'pg_temp.');
      await tx.execute(sql.raw(migration));
      // The additive migration must also tolerate being applied again.
      await tx.execute(sql.raw(migration));

      const { claimInquiryRecipient, distributeInquiry } = await import('../src/lib/inquiry-distribution');
      const cache = globalThis as unknown as { drizzleDb?: DB };
      const previousDb = cache.drizzleDb;
      cache.drizzleDb = tx as unknown as DB;
      t.mock.method(Date, 'now', () => NOW);

      async function reset() {
        await tx.execute(sql`truncate pg_temp.inquiries, pg_temp.site_settings, pg_temp.users`);
        await tx.execute(sql`
          insert into pg_temp.users (id, email, status, created_at) values
            (1, 'first@example.test', 'approved', '2026-01-01'),
            (2, 'second@example.test', 'approved', '2026-01-02'),
            (3, 'third@example.test', 'approved', '2026-01-03')
        `);
        await tx.insert(schema.siteSettings).values({
          id: 1,
          key: INQUIRY_RECIPIENT_USER_IDS_KEY,
          value: serializeInquiryRoutingState({ recipientUserIds: [1, 2, 3], lastRecipientUserId: null }),
        });
      }

      async function inquiry(id: number, email: string, age = 0, recipientUserId: number | null = null) {
        const [row] = await tx.insert(schema.inquiries).values({
          id, email, name: 'Test customer', message: 'Test inquiry', recipientUserId,
          createdAt: new Date(NOW - age).toISOString(),
        }).returning();
        return row;
      }

      async function cursor() {
        const [setting] = await tx.select({ value: schema.siteSettings.value }).from(schema.siteSettings);
        return parseInquiryRoutingState(setting.value).lastRecipientUserId;
      }

      async function scenario(name: string, run: () => Promise<void>) {
        await t.test(name, async () => {
          await reset();
          await run();
        });
      }

      try {
        await scenario('repeat emails reuse one employee without consuming a rotation turn', async () => {
          await inquiry(1, ' Alice@Example.test ');
          await inquiry(2, 'bob@example.test');
          await inquiry(3, 'alice@example.TEST');
          await inquiry(4, 'carol@example.test');
          assert.equal((await claimInquiryRecipient(1, tx))?.id, 1);
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 2);
          assert.equal((await claimInquiryRecipient(3, tx))?.id, 1);
          assert.equal(await cursor(), 2);
          assert.equal((await claimInquiryRecipient(4, tx))?.id, 3);
          const [saved] = await tx.select().from(schema.inquiries).where(eq(schema.inquiries.id, 3));
          assert.equal(saved.recipientUserId, 1);
        });

        await scenario('exactly 30 days reuses the recipient across calendar months', async () => {
          await inquiry(1, 'boundary@example.test', 30 * DAY, 3);
          await inquiry(2, 'boundary@example.test');
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 3);
          assert.equal(await cursor(), null);
        });

        await scenario('an assignment older than 30 days starts a new rotation turn', async () => {
          await inquiry(1, 'expired@example.test', 30 * DAY + 1, 3);
          await inquiry(2, 'expired@example.test');
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 1);
          assert.equal(await cursor(), 1);
        });

        await scenario('the latest assigned inquiry extends the rolling window', async () => {
          await inquiry(1, 'rolling@example.test', 50 * DAY, 2);
          await inquiry(2, 'rolling@example.test', 25 * DAY, 2);
          await inquiry(3, 'rolling@example.test', DAY);
          assert.equal((await claimInquiryRecipient(3, tx))?.id, 2);
          await inquiry(4, 'rolling@example.test');
          assert.equal((await claimInquiryRecipient(4, tx))?.id, 2);
          assert.equal(await cursor(), null);
        });

        await scenario('unassigned historical inquiries do not hide an earlier assignment', async () => {
          await inquiry(1, 'legacy@example.test', 10 * DAY, 2);
          await inquiry(2, 'legacy@example.test', DAY);
          await inquiry(3, 'legacy@example.test');
          assert.equal((await claimInquiryRecipient(3, tx))?.id, 2);
        });

        await scenario('the most recent assignment wins, including a timestamp tie', async () => {
          await inquiry(1, 'history@example.test', DAY, 1);
          await inquiry(2, 'history@example.test', DAY, 2);
          await inquiry(3, 'history@example.test');
          assert.equal((await claimInquiryRecipient(3, tx))?.id, 2);
        });

        await scenario('different email addresses do not share an assignment', async () => {
          await inquiry(1, 'buyer+one@example.test', DAY, 3);
          await inquiry(2, 'buyer+two@example.test');
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 1);
        });

        await scenario('new repeats rotate away from an unavailable employee', async () => {
          await inquiry(1, 'inactive@example.test', DAY, 1);
          await tx.update(schema.users).set({ status: 'pending' }).where(eq(schema.users.id, 1));
          await inquiry(2, 'inactive@example.test');
          await inquiry(3, 'inactive@example.test');
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 2);
          assert.equal((await claimInquiryRecipient(3, tx))?.id, 2);
          assert.equal(await cursor(), 2);
          assert.equal(await claimInquiryRecipient(1, tx), null);
        });

        await scenario('removing an employee from routing reassigns new inquiries', async () => {
          await inquiry(1, 'removed@example.test', DAY, 3);
          await tx.update(schema.siteSettings).set({
            value: serializeInquiryRoutingState({ recipientUserIds: [1, 2], lastRecipientUserId: null }),
          });
          await inquiry(2, 'removed@example.test');
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 1);
        });

        await scenario('deleting an employee clears the foreign key and allows reassignment', async () => {
          await inquiry(1, 'deleted@example.test', DAY, 1);
          await tx.delete(schema.users).where(eq(schema.users.id, 1));
          const [oldInquiry] = await tx.select().from(schema.inquiries).where(eq(schema.inquiries.id, 1));
          assert.equal(oldInquiry.recipientUserId, null);
          await inquiry(2, 'deleted@example.test');
          assert.equal((await claimInquiryRecipient(2, tx))?.id, 2);
        });

        await scenario('a retry retains the original recipient after the window expires', async () => {
          await inquiry(1, 'retry@example.test', 60 * DAY, 3);
          assert.equal((await claimInquiryRecipient(1, tx))?.id, 3);
          assert.equal((await claimInquiryRecipient(1, tx))?.id, 3);
          assert.equal(await cursor(), null);
        });

        await scenario('missing inquiries and unavailable routing do not advance the cursor', async () => {
          assert.equal(await claimInquiryRecipient(999, tx), null);
          await inquiry(1, 'nobody@example.test');
          await tx.update(schema.users).set({ status: 'pending' });
          assert.equal(await claimInquiryRecipient(1, tx), null);
          assert.equal(await cursor(), null);
          await tx.delete(schema.siteSettings);
          assert.equal(await claimInquiryRecipient(1, tx), null);
        });

        await scenario('provider failure and retry send only to the saved recipient with the same key', async () => {
          const row = await inquiry(1, 'delivery@example.test');
          const oldApiKey = process.env.RESEND_API_KEY;
          const oldFrom = process.env.INQUIRY_FROM_EMAIL;
          process.env.RESEND_API_KEY = 'test-key';
          process.env.INQUIRY_FROM_EMAIL = 'inquiries@example.test';
          const requests: RequestInit[] = [];
          const fetchMock = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options?: RequestInit) => {
            assert.equal(url, 'https://api.resend.com/emails');
            requests.push(options!);
            return new Response('{}', { status: requests.length === 1 ? 503 : 200 });
          });
          try {
            await assert.rejects(distributeInquiry(row), /Resend request failed \(503\)/);
            await inquiry(2, 'another@example.test');
            assert.equal((await claimInquiryRecipient(2, tx))?.id, 2);
            assert.deepEqual(await distributeInquiry(row), { status: 'sent', recipientCount: 1 });
            for (const request of requests) {
              const payload = JSON.parse(String(request.body));
              assert.deepEqual(payload.to, ['first@example.test']);
              assert.equal(payload.reply_to, row.email);
              assert.equal(new Headers(request.headers).get('Idempotency-Key'), 'website-inquiry/1/recipient/1/v2');
            }
            assert.equal(requests.length, 2);
            assert.equal(await cursor(), 2);
          } finally {
            fetchMock.mock.restore();
            if (oldApiKey === undefined) delete process.env.RESEND_API_KEY;
            else process.env.RESEND_API_KEY = oldApiKey;
            if (oldFrom === undefined) delete process.env.INQUIRY_FROM_EMAIL;
            else process.env.INQUIRY_FROM_EMAIL = oldFrom;
          }
        });
      } finally {
        if (previousDb === undefined) delete cache.drizzleDb;
        else cache.drizzleDb = previousDb;
      }

      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
});
