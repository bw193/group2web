import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// A local Postgres (Docker/native) for offline dev doesn't speak SSL, whereas
// Supabase's pooler requires it. Detect a localhost target and disable SSL so
// the same code works against either without editing connection options.
const isLocalDb = /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(connectionString);

// Cache the client across HMR reloads in development to avoid exhausting
// pooler connections. In production each lambda gets its own instance.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
};

// During `next build`, queries flow continuously, and on a congested
// long-haul link it's the TCP/TLS *handshake* that fails — established
// connections answer in ~300ms. So while building, hold connections open for
// the whole run (few handshakes); at runtime, recycle idle sockets briskly so
// a NAT-killed connection isn't reused after sitting cold between requests.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    prepare: false, // required for Supabase transaction pooler (port 6543)
    // Supabase's transaction pooler already multiplexes across all
    // clients, so each serverless instance only needs a small local
    // pool. 3 is plenty and keeps us well under the pooler's limit
    // when many function instances spin up concurrently (same as main).
    // Exception — builds on THIS dev machine: withDbRetry's timeout cannot
    // cancel an in-flight query, so on the lossy long-haul link a stalled
    // query parks a connection and, with only 3, retries pile up behind it
    // (verified: local builds fail at 3, pass at 10). Vercel builds keep 3.
    max: isBuildPhase && !process.env.VERCEL ? 10 : 3,
    // Runtime: recycle idle sockets after 20s (main's historical value). A
    // connection that sits idle between CMS clicks gets silently dropped by
    // NAT/proxy boxes on the long-haul dev link; reusing it surfaces as
    // `write CONNECTION_CLOSED` only after a ~2min OS TCP timeout, so a short
    // idle window keeps the dead-reuse risk small and withDbRetry turns any
    // residual hit into an ~8s retry. Build: hold sockets for the whole run —
    // constant traffic keeps them honest and skips needless re-handshakes.
    idle_timeout: isBuildPhase ? undefined : 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  });

export const db = globalForDb.drizzleDb ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
  globalForDb.drizzleDb = db;
}

export function getDb() {
  return db;
}

export type DB = typeof db;

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
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  // Build phase: when many pages prerender at once, the pooler (Supavisor)
  // queues the burst of fresh connection setups and a query can legitimately
  // take 10–20s to get a connection — while the Postgres server sits nearly
  // idle. An 8s timeout converts that slow-but-successful wait into a failed
  // build (observed on Vercel: insight pages threw DbTimeoutError at 8000ms;
  // main, which never times out, builds fine at full parallelism). And a
  // retry cannot cancel the abandoned attempt, so short timeouts only deepen
  // the setup queue. So during builds wait like main does: 2 × 25s (~50s)
  // stays inside Next's 60s per-page budget while outlasting the queue.
  // Runtime keeps 3 × 8s — that is what stops CMS routes from hanging for
  // minutes on a wedged dev-link connection.
  {
    attempts = isBuildPhase ? 2 : 3,
    timeoutMs = isBuildPhase ? 25_000 : 8_000,
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
