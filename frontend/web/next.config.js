/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'blue-casual-wombat-745.mypinata.cloud',
      // 'ipfs.io',
      'picsum.photos'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blue-casual-wombat-745.mypinata.cloud',
        pathname: '/ipfs/**',
      },
      // {
      //   protocol: 'https',
      //   hostname: 'ipfs.io',
      //   pathname: '/ipfs/**',
      // },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      }
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    }
    return config
  }
}

module.exports = nextConfig 