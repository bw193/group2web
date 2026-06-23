import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type PgClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// Cache the client across HMR reloads in development to avoid exhausting
// pooler connections. In production each lambda gets its own instance.
const globalForDb = globalThis as unknown as {
  pgClient?: PgClient;
  drizzleDb?: DrizzleDb;
};

function assertLiveDbAllowed() {
  if (process.env.PUBLIC_DATA_NO_LIVE_DB === '1') {
    throw new Error(
      'Live database access is disabled during the public-data snapshot build. Use snapshot-backed public data helpers instead.',
    );
  }
}

function createDb(): DrizzleDb {
  assertLiveDbAllowed();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for live database access.');
  }

  // A local Postgres (Docker/native) for offline dev doesn't speak SSL, whereas
  // Supabase's pooler requires it. Detect a localhost target and disable SSL so
  // the same code works against either without editing connection options.
  const isLocalDb = /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(connectionString);

  const client =
    globalForDb.pgClient ??
    postgres(connectionString, {
      ssl: isLocalDb ? false : { rejectUnauthorized: false },
      prepare: false, // required for Supabase transaction pooler (port 6543)
      // Serverless prod: keep small (pooler multiplexes across many lambdas).
      // Dev: one Next process services every request; a CMS navigation fans
      // out to 6+ parallel DB-touching fetches that need a roomier pool.
      max: process.env.NODE_ENV === 'production' ? 3 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  const db = globalForDb.drizzleDb ?? drizzle(client, { schema });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pgClient = client;
    globalForDb.drizzleDb = db;
  }

  return db;
}

export function getDb() {
  assertLiveDbAllowed();
  return globalForDb.drizzleDb ?? createDb();
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    const database = getDb();
    const value = Reflect.get(database as object, prop);
    return typeof value === 'function' ? value.bind(database) : value;
  },
});

export type DB = DrizzleDb;

// ---------------------------------------------------------------------------
// Transient-failure resilience
// ---------------------------------------------------------------------------
// The path from a dev machine to the eu-west-1 pooler is long-haul and can be
// unreliable: a pooled connection may be severed mid-flight (`write
// CONNECTION_CLOSED`) or a query may hang on a half-dead socket until the OS
// TCP timeout (~60s). `withDbRetry` caps each attempt with a client-side
// timeout and retries transient failures with a fresh connection.
//
// Use it for IDEMPOTENT READS ONLY — never wrap inserts/updates, since a retry
// after an ambiguous failure could double-write.

const TRANSIENT =
  /CONNECTION_CLOSED|CONNECT_TIMEOUT|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|connection terminated|terminating connection/i;

export class DbTimeoutError extends Error {
  constructor(ms: number) {
    super(`Database operation timed out after ${ms}ms`);
    this.name = 'DbTimeoutError';
  }
}

function isTransient(err: unknown): boolean {
  if (err instanceof DbTimeoutError) return true;
  const e = err as { code?: unknown; message?: unknown } | null;
  const code = typeof e?.code === 'string' ? e.code : '';
  const message = typeof e?.message === 'string' ? e.message : '';
  return TRANSIENT.test(code) || TRANSIENT.test(message);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new DbTimeoutError(ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Run an idempotent read, capping each attempt with a client-side timeout and
 * retrying transient connection failures with a fresh connection. Do NOT use
 * for mutations.
 *
 * Default budget: 2 × 25s. When many pages render at once (builds, ISR
 * bursts) the pooler queues fresh connection setups and a query can
 * legitimately take 10–20s to get a connection while the Postgres server
 * sits nearly idle. Short timeouts convert that slow-but-successful wait
 * into failures (observed twice: Vercel builds threw DbTimeoutError at
 * 8000ms, and later preview *runtime* ISR renders 500'd the same way —
 * main, which never times out, just waits and succeeds). A retry cannot
 * cancel the abandoned attempt, so a patient budget is strictly better for
 * public pages; ~50s also stays inside Next's 60s per-page build budget.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  {
    attempts = 2,
    timeoutMs = 25_000,
  }: { attempts?: number; timeoutMs?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Promise.resolve().then(fn) guards against a synchronous throw in fn.
      return await withTimeout(Promise.resolve().then(fn), timeoutMs);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === attempts) throw err;
      await sleep(150 * attempt);
    }
  }
  throw lastErr; // unreachable; keeps TypeScript's control-flow analysis happy
}

/**
 * CMS-API variant: fail fast (3 × 8s) so an admin screen on a wedged
 * dev-machine connection errors in seconds instead of hanging for minutes.
 * Public pages must NOT use this — they get the patient default above,
 * matching main's wait-it-out semantics under ISR/build bursts.
 */
export function withDbRetryFast<T>(fn: () => Promise<T>): Promise<T> {
  return withDbRetry(fn, { attempts: 3, timeoutMs: 8_000 });
}
