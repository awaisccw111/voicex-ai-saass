/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@saas/ui", "@saas/core", "@saas/types", "@saas/db"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://voicexadmin:Awais.0two3@voicex-db.postgres.database.azure.com:5432/postgres?sslmode=require",
    FISH_AUDIO_API_KEY: process.env.FISH_AUDIO_API_KEY || "e4c5b36bb0344d9ea729606ea2b8b9d7",
  },
};

export default nextConfig;
