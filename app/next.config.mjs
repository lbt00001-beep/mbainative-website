/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
