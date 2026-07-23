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

After a successful apply or rollback, run a fresh deployment. Public product
pages use the build-time data snapshot, so ISR revalidation alone cannot expose
the new database content.
