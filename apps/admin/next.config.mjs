/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Turbopack config expects an object in Next 14
    turbo: {},
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'starshieldpaints.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' }
    ]
  }
};

export default nextConfig;
