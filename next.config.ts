import type { NextConfig } from "next";

const isCloudflare = process.env.BACKEND === "cloudflare";

const nextConfig: NextConfig = {
  ...(isCloudflare ? {} : { output: "standalone" as const }),
  serverExternalPackages: isCloudflare ? [] : ["better-sqlite3"],
};

export default nextConfig;
