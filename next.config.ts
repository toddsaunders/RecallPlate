import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization: allow external domains for CDN-hosted assets
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
    ],
  },

  // Custom headers for caching and security
  async headers() {
    return [
      {
        // Static assets: long cache
        source: "/:path*.(ico|png|jpg|jpeg|svg|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // API routes: short cache to keep data fresh
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
