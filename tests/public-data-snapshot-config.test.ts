import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePublicDataSnapshotPath } from '../src/lib/public-data-snapshot-config';

test('public-data snapshots are enabled by an explicit path', () => {
  assert.equal(
    resolvePublicDataSnapshotPath({
      PUBLIC_DATA_SNAPSHOT_PATH: 'D:\\group2web\\.build-cache\\public-data.json',
    }),
    'D:\\group2web\\.build-cache\\public-data.json',
  );
});

test('explicit path wins over the production file fallback', () => {
  assert.equal(
    resolvePublicDataSnapshotPath(
      {
        NODE_ENV: 'production',
        PUBLIC_DATA_SNAPSHOT_PATH: 'D:\\group2web\\.build-cache\\public-data.json',
      },
      { defaultPath: '/tmp/public-data.json', exists: () => false },
    ),
    'D:\\group2web\\.build-cache\\public-data.json',
  );
});

test('production runtime uses the bundled snapshot when the file exists', () => {
  const defaultPath = '/tmp/public-data.json';
  assert.equal(
    resolvePublicDataSnapshotPath(
      { NODE_ENV: 'production' },
      { defaultPath, exists: (path) => path === defaultPath },
    ),
    defaultPath,
  );
});

test('production runtime falls back to live database when the snapshot file is missing', () => {
  assert.equal(
    resolvePublicDataSnapshotPath(
      { NODE_ENV: 'production' },
      { defaultPath: '/tmp/missing-public-data.json', exists: () => false },
    ),
    null,
  );
});

test('non-production without an explicit path does not use the bundled file', () => {
  assert.equal(
    resolvePublicDataSnapshotPath(
      { NODE_ENV: 'development' },
      { defaultPath: '/tmp/public-data.json', exists: () => true },
    ),
    null,
  );
});

test('an empty snapshot path does not enable snapshot reads', () => {
  assert.equal(
    resolvePublicDataSnapshotPath(
      { NODE_ENV: 'production', PUBLIC_DATA_SNAPSHOT_PATH: '' },
      { defaultPath: '/tmp/public-data.json', exists: () => true },
    ),
    null,
  );
});
