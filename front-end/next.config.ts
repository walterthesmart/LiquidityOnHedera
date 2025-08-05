/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Skip auth routes during static export
  ...(process.env.NODE_ENV === 'production' && {
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
  }),
  // Handle CommonJS modules that need to be transpiled
  transpilePackages: ['@vanilla-extract/sprinkles'],
  webpack: (config: any) => {
    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true, // optional, with some bundlers/frameworks it doesn't work without
    };

    // Handle CommonJS modules that are imported as ES modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
