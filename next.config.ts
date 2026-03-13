import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "covers.openlibrary.org" },
      { hostname: "image.tmdb.org" },
    ],
  },
};

export default nextConfig;
