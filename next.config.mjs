let userConfig = undefined;
try {
  userConfig = await import('./v0-user-next.config');
} catch (e) {
  // Ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  webpack: (config, options) => {
    // Add your externals here
    config.externals = [...(config.externals || []), "steam-user", "lzma", "bytebuffer"];

    // Allow user config to override or modify webpack settings
    if (userConfig && typeof userConfig.webpack === 'function') {
      config = userConfig.webpack(config, options);
    }

    return config;
  },
};

// Merge user config if available
if (userConfig) {
  for (const key in userConfig) {
    if (key !== 'webpack') { // Skip webpack as it's handled separately
      if (
        typeof nextConfig[key] === 'object' &&
        !Array.isArray(nextConfig[key])
      ) {
        nextConfig[key] = {
          ...nextConfig[key],
          ...userConfig[key],
        };
      } else {
        nextConfig[key] = userConfig[key];
      }
    }
  }
}

export default nextConfig;
