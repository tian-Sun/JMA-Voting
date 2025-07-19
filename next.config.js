/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'docs',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  images: {
    unoptimized: true
  },
}

module.exports = nextConfig 