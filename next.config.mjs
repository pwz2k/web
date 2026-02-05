import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/f/**',
      },
    ],
    minimumCacheTTL: 60,
  },
  // Increase the build timeout
  staticPageGenerationTimeout: 180, // 3 minutes

  webpack: (config, { isServer, dev }) => {
    // Fix for Prisma client resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '.prisma/client/default': path.resolve(
        __dirname,
        'node_modules/.prisma/client/default'
      ),
      '@prisma/client': path.resolve(
        __dirname,
        'node_modules/@prisma/client'
      ),
    };

    // Reduce "Cannot read properties of undefined (reading 'call')" in production
    // by using stable module IDs so chunk references stay valid after deploy
    if (!isServer && !dev && config.optimization) {
      config.optimization.moduleIds = 'deterministic';
    }

    // Ensure Prisma client is externalized correctly
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '.prisma/client': 'commonjs .prisma/client',
      });
    }

    return config;
  },
};

export default nextConfig;
