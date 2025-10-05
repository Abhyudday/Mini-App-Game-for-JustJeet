/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Next/Image optimization in Docker to avoid native sharp dependency
  images: {
    domains: [],
    unoptimized: true,
  },
  // Create a smaller production bundle with all server deps included
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
