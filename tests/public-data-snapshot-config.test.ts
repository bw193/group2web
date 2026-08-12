import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePublicDataSnapshotPath } from '../src/lib/public-data-snapshot-config';

test('public-data snapshots are enabled only by an explicit path', () => {
  assert.equal(
    resolvePublicDataSnapshotPath({
      PUBLIC_DATA_SNAPSHOT_PATH: 'D:\\group2web\\.build-cache\\public-data.json',
    }),
    'D:\\group2web\\.build-cache\\public-data.json',
  );
});

test('production runtime defaults to live database content', () => {
  const productionEnv: NodeJS.ProcessEnv = { NODE_ENV: 'production' };

  assert.equal(resolvePublicDataSnapshotPath(productionEnv), null);
});

test('an empty snapshot path does not enable snapshot reads', () => {
  assert.equal(resolvePublicDataSnapshotPath({ PUBLIC_DATA_SNAPSHOT_PATH: '' }), null);
});
