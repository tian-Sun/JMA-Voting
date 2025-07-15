/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  images: {
    unoptimized: true
  },
  // appDir 在 Next.js 13+ 中默认启用，无需显式配置
}

module.exports = nextConfig 