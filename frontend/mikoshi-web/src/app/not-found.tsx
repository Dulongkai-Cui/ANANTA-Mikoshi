import Link from "next/link";

import { BrandTile } from "@/components/shell/brand";
import { buttonVariants } from "@/components/ui/button";
import { HOME_PATH } from "@/lib/routes";

export const metadata = { title: "页面不存在" };

/** 未知路由：不暴露登录内容；登录后进入工作台，未登录时会被导向登录页 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 text-center">
      <BrandTile className="mb-8 size-40" />
      <p className="tabular text-caption font-semibold tracking-[0.08em] text-fg-muted">404</p>
      <h1 className="mt-2 text-title font-semibold text-fg">没有找到这个页面</h1>
      <p className="mt-2 max-w-sm text-fg-secondary">地址可能输入有误，或者该页面不在本步提供的范围内。</p>
      <Link href={HOME_PATH} className={buttonVariants({ variant: "primary", size: "lg", className: "mt-6" })}>
        返回我的工作台
      </Link>
    </main>
  );
}
