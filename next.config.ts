import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/webp'],
  },
  
  // Optimize production builds
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
};

export default nextConfig;
