/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Allow camera and external image domains
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'pg'],
  },
};

module.exports = nextConfig;

