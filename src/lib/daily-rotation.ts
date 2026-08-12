/**
 * Deterministic "shuffle of the day".
 *
 * The homepage featured grid shows a different selection of products every
 * day. The order has to be a pure function of the calendar date rather than
 * Math.random(): public pages are statically generated and revalidated every
 * few minutes (ISR), so a non-deterministic order would reshuffle on every
 * regeneration and a visitor refreshing twice in a minute would see a
 * different grid. Seeding on the date keeps the order stable for a full day
 * and turns it over at midnight.
 */

// Day boundary is Asia/Shanghai (UTC+8), where the business runs — "today's
// products" should change when the factory's day changes, not eight hours
// later. China has observed no DST since 1991, so a fixed offset is exact.
const DAY_BOUNDARY_OFFSET_MINUTES = 8 * 60;

/** yyyymmdd on the Shanghai calendar — the seed for a given day. */
export function dailySeed(now: Date = new Date()): number {
  const shifted = new Date(now.getTime() + DAY_BOUNDARY_OFFSET_MINUTES * 60_000);
  return (
    shifted.getUTCFullYear() * 10000 +
    (shifted.getUTCMonth() + 1) * 100 +
    shifted.getUTCDate()
  );
}

/** mulberry32 — compact, well-distributed PRNG from a 32-bit seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle driven by the seeded PRNG. Returns a new array and
 * leaves the input untouched.
 */
export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Today's ordering of `items`. Same input + same day => same output, on every
 * locale and every regeneration.
 */
export function rotateDaily<T>(items: readonly T[], now?: Date): T[] {
  return shuffleWithSeed(items, dailySeed(now));
}
