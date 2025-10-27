/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: true
  },
  output: 'standalone'
};

export default nextConfig;
