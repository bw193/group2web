// Patches fullDescription for matching productIds in tests/translations-<locale>.json,
// leaving all other fields untouched. Safe to run multiple times.
//
// Usage:
//   npx tsx tests/apply-fulldesc-patch.ts <locale> <patchPath>
// e.g.:
//   npx tsx tests/apply-fulldesc-patch.ts fr tests/fulldesc-patch-fr.json
//
// Patch file shape: [{ "productId": 75, "fullDescription": "<p>…</p>" }, …]
// Only productIds present in the patch are updated; missing IDs are left alone
// so the patcher can be invoked with partial batches.

import { readFileSync, writeFileSync } from 'node:fs';

type Patch = { productId: number; fullDescription: string };
type Trans = {
  productId: number;
  name: string;
  shortDescription: string;
  fullDescription: string;
  specs: { key: string; value: string }[];
};

function main() {
  const [, , locale, patchPath] = process.argv;
  if (!locale || !patchPath) {
    console.error('Usage: npx tsx tests/apply-fulldesc-patch.ts <locale> <patchPath>');
    process.exit(1);
  }

  const transPath = `tests/translations-${locale}.json`;
  const trans = JSON.parse(readFileSync(transPath, 'utf8')) as Trans[];
  const patch = JSON.parse(readFileSync(patchPath, 'utf8')) as Patch[];

  const patchMap = new Map(patch.map((p) => [p.productId, p.fullDescription]));
  let updated = 0;
  const missing: number[] = [];

  for (const entry of trans) {
    const next = patchMap.get(entry.productId);
    if (next !== undefined) {
      entry.fullDescription = next;
      updated += 1;
      patchMap.delete(entry.productId);
    }
  }
  for (const id of patchMap.keys()) missing.push(id);

  writeFileSync(transPath, JSON.stringify(trans, null, 2), 'utf8');
  console.log(`[${locale}] patched fullDescription for ${updated} product(s); file: ${transPath}`);
  if (missing.length) {
    console.warn(`[${locale}] WARN: ${missing.length} patch entries had no matching productId: ${missing.join(', ')}`);
  }
}

main();
