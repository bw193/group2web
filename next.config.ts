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
    // Cap static-generation concurrency to fit the build DB pool (max 3). The
    // insight loaders fetch sequentially — one connection per page, like the
    // product pages — so N concurrent pages = N connections. maxConcurrency:1 is
    // proven green on Vercel; :3 dropped idle connections on the long-haul link
    // (CONNECTION_CLOSED). :2 is the middle ground — 2 of the 3 pool slots, less
    // idle churn than 3, ~2x faster than 1. cpus:1 keeps a single shared pool;
    // retryCount cushions the occasional cold-setup straggler.
    cpus: 1,
    staticGenerationMaxConcurrency: 2,
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
