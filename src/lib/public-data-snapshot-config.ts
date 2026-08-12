export type PublicDataSnapshotEnvironment = Readonly<
  Record<string, string | undefined>
>;

/**
 * Snapshot reads are opt-in. The build wrapper supplies an explicit path while
 * Next.js prerenders public pages; deployed runtimes without that environment
 * variable must read current content from the database.
 */
export function resolvePublicDataSnapshotPath(
  env: PublicDataSnapshotEnvironment,
): string | null {
  return env.PUBLIC_DATA_SNAPSHOT_PATH || null;
}
