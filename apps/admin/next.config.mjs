/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Turbopack config expects an object in Next 14
    turbo: {},
  },
  output: 'standalone'
};

export default nextConfig;
