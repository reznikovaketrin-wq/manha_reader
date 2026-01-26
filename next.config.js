/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 🔥 Fix webpack cache allocation errors
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable cache in development to prevent memory issues
      config.cache = false;
    }
    return config;
  },

  // 📦 Увеличиваем лимит размера body для загрузки файлов (100MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
}

module.exports = nextConfig
