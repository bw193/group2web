import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// 301s for slug typos corrected in drizzle/0003_fix_product_typos.sql.
// Keeps any inbound link/index entry to a typoed slug from 404ing after
// the DB rename. Add a new entry here every time a slug is corrected.
const TYPO_SLUG_REDIRECTS: { from: string; to: string }[] = [
  { from: 'asymmetrical-led-miirror', to: 'asymmetrical-led-mirror' },
  { from: 'ps-full-length-mirorr', to: 'ps-full-length-mirror' },
  { from: 'silm-framed-bathroom-mirror', to: 'slim-framed-bathroom-mirror' },
];

// Static unprefixed English routes that were live before the /en-prefix
// switch and may still be indexed. 301 them to the /en/... equivalent so
// crawlers can transfer signal instead of finding 404s.
// Dynamic /products/<slug> is handled in middleware.ts (Next.js redirects()
// can't pattern-match dynamic segments cleanly).
const UNPREFIXED_STATIC_ROUTES = ['/products', '/about', '/contact'];

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'yleuaykcrrrqdhzmrmoq.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'] as ('image/avif' | 'image/webp')[],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'next-intl'],
    // Client-side router cache for previously-visited routes.
    // Default in Next 15 is 0s for dynamic routes, which makes every
    // internal navigation round-trip to the server for the RSC payload.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Throttle static generation in every build environment. Insight added
    // enough DB-backed prerender targets that full parallelism queues more
    // simultaneous Supavisor connection setups than the 60s per-page budget
    // tolerates (verified: c5c24fa failed at /en/insight 60s × 3 even after
    // unstable_cache + indexes + EN-only product reduction). With this cap,
    // a previous A/B settled it: throttle on → built green twice (04d2b4c,
    // 984a603, d25f814); throttle off → failed immediately (b93b9f9, f1ec642,
    // c5c24fa). Cost: builds take ~3 min longer. Runtime unaffected.
    cpus: 2,
    staticGenerationMaxConcurrency: 2,
    // 3 was just barely too tight: the merge invalidated prerender cache and
    // /de/insight exhausted all 3 attempts on cold-connection slowness while
    // every other locale recovered by attempt 2. 5 covers the unlucky case.
    staticGenerationRetryCount: 5,
  },
  async redirects() {
    return [
      ...TYPO_SLUG_REDIRECTS.flatMap(({ from, to }) => [
        {
          source: `/:locale/products/${from}`,
          destination: `/:locale/products/${to}`,
          permanent: true,
        },
        // Unprefixed legacy form, in case it was ever indexed before the
        // `localePrefix: 'always'` switch.
        {
          source: `/products/${from}`,
          destination: `/en/products/${to}`,
          permanent: true,
        },
      ]),
      ...UNPREFIXED_STATIC_ROUTES.map((path) => ({
        source: path,
        destination: `/en${path}`,
        permanent: true,
      })),
    ];
  },
};

export default withNextIntl(nextConfig);
