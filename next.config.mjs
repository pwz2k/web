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
  },
  // Increase the build timeout
  staticPageGenerationTimeout: 180, // 3 minutes

  webpack: (config, { isServer }) => {
    // Fix for Prisma client resolution with pnpm
    config.resolve.alias = {
      ...config.resolve.alias,
      '.prisma/client/default': path.resolve(
        __dirname,
        'node_modules/@prisma/client/.prisma/client/default'
      ),
    };
    return config;
  },
};

export default nextConfig;
