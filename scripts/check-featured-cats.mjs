// Read-only: per-category featured/active product counts (diagnose the homepage tabs).
import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false }, prepare: false, max: 1, idle_timeout: 5, connect_timeout: 30 });
try {
  const rows = await sql`
    SELECT pc.id, pc.is_active, pc.display_order,
           (SELECT name FROM category_translations ct WHERE ct.category_id = pc.id AND ct.locale='en' LIMIT 1) AS name_en,
           (SELECT count(*) FROM products p WHERE p.category_id = pc.id AND p.is_active AND p.is_featured)::int AS featured,
           (SELECT count(*) FROM products p WHERE p.category_id = pc.id AND p.is_active)::int AS active_products
    FROM product_categories pc ORDER BY pc.display_order`;
  console.log('id | active | featured | active_products | name');
  for (const r of rows) console.log(`${r.id} | ${r.is_active} | ${r.featured} | ${r.active_products} | ${r.name_en}`);
  const [tot] = await sql`SELECT count(*)::int n FROM products WHERE is_active AND is_featured`;
  const [nullcat] = await sql`SELECT count(*)::int n FROM products WHERE is_active AND is_featured AND category_id IS NULL`;
  console.log(`total active+featured products: ${tot.n}  (category_id NULL: ${nullcat.n})`);
} finally { await sql.end(); }
