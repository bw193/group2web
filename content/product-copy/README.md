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

Production builds use a point-in-time snapshot for static generation. Deployed
runtime revalidation reads the live database, so the normal ISR window can
expose an applied or rolled-back batch without waiting for another deployment.

After the affected pages revalidate (or after a deployment), verify every
localized target page against the reviewed batch. The verifier checks HTTP
status, new and previous copy, canonical and hreflang URLs, and Hebrew RTL
metadata:

```bash
npx tsx scripts/verify-product-copy-production.ts \
  --batch content/product-copy/2026-07-23-distinct-products.json \
  --origin https://chengtaimirror.com
```
