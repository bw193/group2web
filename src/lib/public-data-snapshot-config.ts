import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type PublicDataSnapshotEnvironment = Readonly<
  Record<string, string | undefined>
>;

export type ResolvePublicDataSnapshotPathOptions = {
  exists?: (path: string) => boolean;
  defaultPath?: string;
};

/** Bundled JSON written by `scripts/build-with-public-data.ts` before `next build`. */
export const DEFAULT_RUNTIME_PUBLIC_DATA_SNAPSHOT_PATH = resolve(
  process.cwd(),
  '.build-cache',
  'public-data.json',
);

/**
 * Where public pages should read catalog JSON.
 *
 * Explicit `PUBLIC_DATA_SNAPSHOT_PATH` always wins (the build wrapper sets this
 * so prerender never opens Postgres). An empty string disables snapshot reads.
 *
 * Otherwise production uses `.build-cache/public-data.json` when that file
 * exists. That is the Jun 24 runtime fix (`9a94146`): ISR product/video/insight
 * pages read the bundled snapshot instead of opening a postgres.js pool per
 * render. Build-time snapshot generation (`9d59276`) is separate and still
 * required; this fallback is what keeps *deployed* ISR off the database.
 *
 * Do not revert to opt-in-only resolution. Aug 12 (`a5778ee`, "Fix public
 * content revalidation") did that so CMS edits would appear without a redeploy.
 * Vercel does not set `PUBLIC_DATA_SNAPSHOT_PATH` at runtime, so every public
 * ISR called `getDb()`, then the Aug 14 video merge added related-video queries
 * and product-wide revalidation on top. Postgres hit EMAXCONN (limit 200).
 * Public catalog freshness waits for the next production deploy; CMS/API still
 * uses live `getDb()`. Lowering pool `max` or raising timeouts is not a substitute.
 */
export function resolvePublicDataSnapshotPath(
  env: PublicDataSnapshotEnvironment,
  options: ResolvePublicDataSnapshotPathOptions = {},
): string | null {
  if (typeof env.PUBLIC_DATA_SNAPSHOT_PATH === 'string') {
    return env.PUBLIC_DATA_SNAPSHOT_PATH || null;
  }

  if (env.NODE_ENV !== 'production') {
    return null;
  }

  const defaultPath = options.defaultPath ?? DEFAULT_RUNTIME_PUBLIC_DATA_SNAPSHOT_PATH;
  const exists = options.exists ?? existsSync;
  return exists(defaultPath) ? defaultPath : null;
}
