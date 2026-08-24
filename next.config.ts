import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, a stray lockfile in a
  // parent directory makes Turbopack infer the wrong root and fail to resolve
  // dependencies like tailwindcss during `next dev`.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
