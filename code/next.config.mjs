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

 
};

export default nextConfig;
