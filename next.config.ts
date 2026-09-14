import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/api/directus/:path*",
        destination: `${process.env.DIRECTUS_BACKEND_URL || "http://goatedcodoer:8056"}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
