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
    // pool. 3 is plenty at runtime and keeps us well under the pooler's
    // limit when many function instances spin up concurrently. LOCAL builds
    // get a wider pool: withDbRetry's timeout cannot cancel an in-flight
    // query, so on a slow link a stalled query parks a connection — with
    // only 3, the retries then queue behind the stall and time out in a
    // pile-up. Vercel builds (dub1, sub-ms to the DB) keep the small pool so
    // full build parallelism doesn't multiply into the pooler's client cap.
    max: isBuildPhase && !process.env.VERCEL ? 10 : 3,
    // Runtime on Vercel: recycle briskly (10s idle) so a silently-dropped
    // socket isn't reused after an idle gap — reuse is what hangs until the
    // ~60s OS TCP timeout. Local runtime: keep connections warm longer (60s)
    // because every fresh handshake on the long-haul link is a wedge risk and
    // CMS clicks arrive more than 10s apart; withDbRetry covers the stale-
    // socket case. Build: hold sockets for the whole run.
    idle_timeout: isBuildPhase ? undefined : process.env.VERCEL ? 10 : 60,
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
  // 8s per attempt rides out a slow long-haul TLS handshake (~2.5s observed)
  // plus queueing, while a fully-failed triple cycle (~24.5s) — or two
  // sequential ones on the homepage (~49s) — still fits Next's 60s
  // static-generation budget per page.
  { attempts = 3, timeoutMs = 8_000 }: { attempts?: number; timeoutMs?: number } = {},
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
