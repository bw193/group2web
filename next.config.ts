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
    // Throttle gating:
    //   BUILD_CACHE=1 → src/lib/build-cache.ts warms once per worker and every
    //     page render answers from in-memory indices, so the DB pool is no
    //     longer the bottleneck. cpus is CAPPED at 4 (not the OS default of
    //     ~os.cpus().length): every worker re-warms the snapshot independently
    //     (workers are forked processes, module state is per-worker), so N
    //     workers = N simultaneous cold connection-setup bursts to Supavisor
    //     at second 0. cpus:14 (this machine's OS count) hangs the build;
    //     cpus:4 keeps the burst small enough for the long-haul pooler.
    //   unset → fall back to the defensive throttle that fits the max-3 build
    //     pool against the eu-west-1 Supavisor link. maxConcurrency:1 is
    //     proven green on Vercel; :3 dropped idle connections on the long-haul
    //     link (CONNECTION_CLOSED); :2 is the safe middle ground. cpus:1 keeps
    //     one shared pool; retryCount cushions cold-setup stragglers.
    // Unsetting BUILD_CACHE reverts the entire optimization with no code change.
    ...(process.env.BUILD_CACHE === '1'
      ? { cpus: 4 }
      : {
          cpus: 1,
          staticGenerationMaxConcurrency: 2,
          staticGenerationRetryCount: 5,
        }),
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
