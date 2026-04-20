import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Cache the client across HMR reloads in development to avoid exhausting
// pooler connections. In production each lambda gets its own instance.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    prepare: false, // required for Supabase transaction pooler (port 6543)
    max: 10,
    idle_timeout: 20,
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
