// One round-trip ping to confirm Supavisor reachability. If THIS hangs, the
// local network to eu-west-1 is the problem, not the snapshot logic.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
  const client = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 30,
  });

  const t0 = Date.now();
  const rows = await client`select 1 as ok`;
  const t1 = Date.now();
  console.log(`ping: ${t1 - t0}ms`, rows);

  const t2 = Date.now();
  const rows2 = await client`select count(*)::int as n from product_translations`;
  const t3 = Date.now();
  console.log(`count product_translations: ${t3 - t2}ms`, rows2);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('ping failed:', err);
  process.exit(1);
});
