import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["192.168.101.9:3000", "192.168.101.9", "localhost"],
};

export default nextConfig;
