/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  basePath: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  images: {
    unoptimized: true
  },
}

module.exports = nextConfig 