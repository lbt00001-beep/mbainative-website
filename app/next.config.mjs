/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Make environment variables available at runtime in API routes
  serverRuntimeConfig: {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_TO: process.env.EMAIL_TO,
  },
};

export default nextConfig;
