// 10.2.6 — bundle analyzer (uso: ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 10.2.2 — WebP/AVIF automáticos
    formats: ['image/avif', 'image/webp'],
    // 10.2.5 — sizes otimizados para catálogo mobile-first
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    // cache 1 ano para imagens com hash
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  // 10.2.7 — compressão e performance
  compress: true,
  poweredByHeader: false,
};

module.exports = withBundleAnalyzer(nextConfig);
