import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import { DEFAULT_PUBLIC_DATA_SNAPSHOT_PATH, generatePublicDataSnapshot } from './generate-public-data-snapshot';

loadEnvConfig(process.cwd());

function nextBinPath(): string {
  const localBin = resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!existsSync(localBin)) {
    throw new Error('Next.js CLI not found. Run npm install before building.');
  }
  return localBin;
}

async function main() {
  const snapshotPath = DEFAULT_PUBLIC_DATA_SNAPSHOT_PATH;
  const started = Date.now();
  await generatePublicDataSnapshot(snapshotPath);

  const child = spawn(process.execPath, [nextBinPath(), 'build'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PUBLIC_DATA_SNAPSHOT_PATH: snapshotPath,
      PUBLIC_DATA_NO_LIVE_DB: '1',
    },
  });

  const code = await new Promise<number | null>((resolveExit) => {
    child.on('exit', (exitCode) => resolveExit(exitCode));
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`[public-data] Build finished in ${seconds}s`);
  process.exit(code ?? 1);
}

main().catch((err) => {
  console.error('[public-data] Build failed:', err);
  process.exit(1);
});
