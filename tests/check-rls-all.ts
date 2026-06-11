// Read-only: RLS state + policy count for every table in the public schema.
// Tables with rls_on=false are fully readable/writable through Supabase's
// public Data API with the (public) anon key. Run:
//   npx tsx tests/check-rls-all.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });
  try {
    const rows = await sql`
      SELECT c.relname AS table,
             c.relrowsecurity AS rls_on,
             (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relrowsecurity, c.relname`;
    for (const r of rows) {
      console.log(`${r.rls_on ? 'LOCKED  ' : 'EXPOSED '} ${r.table}  (policies: ${r.policies})`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FAILED:', e);
    process.exit(1);
  },
);
