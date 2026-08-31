/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saas/db", "@saas/core", "@saas/types"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
