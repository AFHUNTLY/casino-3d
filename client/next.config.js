/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Serve static files from public/
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
