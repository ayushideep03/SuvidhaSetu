import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://suvidhasetu-backend.vercel.app/:path*',
      },
    ];
  },
};

export default nextConfig;
