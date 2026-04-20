import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
  },
};

export default withNextIntl(nextConfig);
