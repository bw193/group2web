# Product copy batches

Product-copy batches are immutable, versioned JSON files. Each entry stores the
current database identity, the original `full_description`, the replacement,
and exact SHA-256 preconditions so the same file can safely apply or roll back
the change without overwriting later CMS edits.

Create a batch from one or more reviewed draft files:

```bash
npx tsx scripts/create-product-copy-batch.ts \
  --output content/product-copy/<batch-id>.json \
  <draft.json> [draft.json ...]
```

The creator refuses to overwrite an existing batch. Use a new batch ID for a
new revision.

Validate the live database without writing:

```bash
npx tsx scripts/apply-product-copy.ts \
  --batch content/product-copy/<batch-id>.json
```

Apply or roll back the exact batch:

```bash
npx tsx scripts/apply-product-copy.ts \
  --batch content/product-copy/<batch-id>.json --apply

npx tsx scripts/apply-product-copy.ts \
  --batch content/product-copy/<batch-id>.json --rollback
```

Production builds dump a point-in-time JSON snapshot (`.build-cache/public-data.json`)
for static generation **and** deployed ISR. Public catalog pages read that
bundled file, so an applied or rolled-back batch is not visible on the live
site until the next production deploy. Do not switch public ISR back to live
Postgres for CMS freshness: Aug 12 (`a5778ee`) did that by making snapshot
resolution opt-in-only, Vercel never sets `PUBLIC_DATA_SNAPSHOT_PATH` at
runtime, and product pages then exhausted Postgres (`EMAXCONN`, limit 200).
CMS/API routes still use the live database.

A batch stores the slug each row had when it was created, and slugs move:
`drizzle/0009_english_product_slugs.sql` rewrote every localized product URL to
the English one. `apply-product-copy.ts` therefore accepts a recorded slug that
now appears in `product_slug_history` for the same product and locale, so an
older batch still validates and can still roll back. `verify-product-copy-production.ts`
does not read the database, so for a batch created before a slug migration it
requests the old URL, follows the 308, and reports the redirect as an unexpected
final URL. Verify those targets against their current URLs instead.

After a production deployment, verify every localized target page against the
reviewed batch. The verifier checks HTTP status, new and previous copy,
canonical and hreflang URLs, and Hebrew RTL metadata:

```bash
npx tsx scripts/verify-product-copy-production.ts \
  --batch content/product-copy/2026-07-23-distinct-products.json \
  --origin https://chengtaimirror.com
```
