import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: optimizePackageImports was removed – it can trigger "reading 'call'" with some chunk splits in dev.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/f/**',
      },
    ],
    minimumCacheTTL: 600, // 10 min cache for remote images (faster repeat loads)
    // Smaller image sizes so Next serves smaller files = faster load
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640],
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

    // Use stable module IDs so chunk references stay valid (avoids "reading 'call'" in prod)
    if (!isServer && config.optimization) {
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
