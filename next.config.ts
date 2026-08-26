import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev overlay badge sits exactly where the hero's bottom rail is.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Thumbnails uploaded through /admin land in Vercel Blob.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
