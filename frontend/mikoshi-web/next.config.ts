import type { NextConfig } from "next";

/**
 * 认证模式必须显式确定（SPEC §5.1）。本步默认构建为 demo；
 * production 构建使用邀请码注册及服务端会话，不回退演示身份。
 */
const authMode = process.env.NEXT_PUBLIC_MIKOSHI_AUTH_MODE ?? "demo";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_MIKOSHI_BASE_PATH || "",
  output: "standalone",
  // Preserve the directory URL used by the embedded application's relative assets.
  skipTrailingSlashRedirect: true,
  experimental: { cpus: 1 },
  poweredByHeader: false,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_MIKOSHI_AUTH_MODE: authMode, NEXT_PUBLIC_MIKOSHI_BASE_PATH: process.env.NEXT_PUBLIC_MIKOSHI_BASE_PATH || "" },
  async rewrites() {
    const gateway = process.env.MIKOSHI_GATEWAY_ORIGIN || "http://127.0.0.1:8878";
    return [
      { source: "/mikoshi-api/:path*", destination: `${gateway}/mikoshi-api/:path*`, basePath: false },
      { source: "/kol-studio/:path*", destination: `${gateway}/kol-studio/:path*`, basePath: false },
    ];
  },
};

export default nextConfig;
