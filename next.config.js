// 10.2.6 — bundle analyzer (uso: ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isProduction = process.env.NODE_ENV === 'production';

const wahaApiUrl = process.env.WAHA_API_URL || '';
let wahaOrigin = '';
try {
  wahaOrigin = wahaApiUrl ? new URL(wahaApiUrl).origin : '';
} catch { /* ignore */ }

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' www.googletagmanager.com connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: *.supabase.co",
  `connect-src 'self' www.google-analytics.com www.googletagmanager.com connect.facebook.net graph.facebook.com *.supabase.co ${wahaOrigin}`,
  "font-src 'self' data:",
  "frame-src 'self' https://www.facebook.net",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join('; ');

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
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  output: 'standalone',
  // 10.2.7 — compressão e performance
  compress: true,
  poweredByHeader: false,

  async headers() {
    // 13.2.3 — Edge caching em rotas públicas
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
      { key: 'Content-Security-Policy', value: cspDirectives },
    ];
    if (isProduction) {
      // HSTS: força HTTPS por 1 ano, incluindo subdomínios, preload-ready
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }
    return [
      {
        source: '/api/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      // Segurança
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);

