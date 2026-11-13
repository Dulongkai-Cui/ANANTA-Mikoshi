import type { Metadata, Viewport } from "next";

import { Providers } from "@/app/providers";
import { PREFERENCES_BOOT_SCRIPT } from "@/features/settings/preferences-provider";
import { assetPath } from "@/lib/asset-path";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Mikoshi", template: "%s · Mikoshi" },
  description: "Mikoshi · 无限大业务工作中枢",
  robots: { index: false, follow: false },
  icons: { icon: assetPath("/brand/mikoshi-fox.png"), apple: assetPath("/brand/mikoshi-fox.png") },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 不限制缩放（FE-47）
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1724" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 启动脚本会在水合前设置 data-theme/data-motion/data-sidebar
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
