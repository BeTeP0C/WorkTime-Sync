/** @type {import('next').NextConfig} */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'http://localhost:8000'

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  // Прокси на бэкенд: фронт и API становятся same-origin → httpOnly cookies
  // (refresh-token) работают без cross-site проблем.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_ORIGIN}/api/:path*` }]
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'))

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ['@svgr/webpack'],
      }
    )

    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
}

export default nextConfig
