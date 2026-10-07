/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/aplicaciones/observatorio-electoral/**': ['vendor/electoral/**', 'node_modules/parse5/**', 'node_modules/entities/**', 'node_modules/proper-lockfile/**', 'node_modules/graceful-fs/**', 'node_modules/retry/**', 'node_modules/signal-exit/**', 'node_modules/pdfjs-dist/**', 'node_modules/@napi-rs/canvas*/**'],
  },
  poweredByHeader: false,
  distDir: process.env.MBAI_DEV === '1' ? '.next-dev' : '.next',
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }, { source: '/api/:path*', headers: [
      { key: 'Cache-Control', value: 'no-store' },
    ] }, { source: '/_next/static/:path*', headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ] }];
  },
};
export default nextConfig;
