/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force port 3000 for development
  env: {
    PORT: '3000',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add any existing config here
}

module.exports = nextConfig