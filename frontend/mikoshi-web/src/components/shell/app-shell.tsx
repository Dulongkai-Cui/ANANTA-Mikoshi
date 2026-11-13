"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSession } from "@/features/auth/session-provider";
import { DraftProvider } from "@/features/dashboard/draft-provider";
import { LegacyProvider } from "@/features/legacy/legacy-provider";
import { KolStudioProvider } from "@/features/kol-studio/kol-studio-provider";
import { KolStudioStage } from "@/features/kol-studio/kol-studio-stage";
import { KOL_STUDIO_PATH } from "@/features/kol-studio/modules";
import { PublicationProvider } from "@/features/third-party/publication-provider";
import { KolProvider } from "@/features/kol/kol-provider";
import { WorkbenchProvider } from "@/features/workbench/workbench-provider";
import { LegacyStage } from "@/features/legacy/legacy-stage";
import { legacyModuleForPath } from "@/features/legacy/modules";
import { PageSearchProvider } from "@/features/search/page-search";
import { LOGIN_PATH, isProtectedPath, loginHrefFor } from "@/lib/routes";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { ErrorBoundary } from "./error-boundary";
import { DesktopSidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** 检查会话期间的中性加载壳：不闪现已登录内容（SPEC §5.1） */
export function NeutralShell({ label = "正在检查登录状态" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <span aria-hidden className="size-1.5 rounded-full bg-control/60" />
    </div>
  );
}

/**
 * 受保护区域：会话守卫 + 外壳。未登录或会话无效时回登录页；
 * 主动退出后不附带 returnTo。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, actionError, clearActionError } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const returnTarget = pathname + window.location.hash;
    if (state.status === "anonymous") {
      router.replace(state.signedOut || !isProtectedPath(pathname) ? LOGIN_PATH : loginHrefFor(returnTarget));
    } else if (state.status === "invalid") {
      const base = isProtectedPath(pathname) ? loginHrefFor(returnTarget) : LOGIN_PATH;
      router.replace(`${base}${base.includes("?") ? "&" : "?"}issue=${state.issue}`);
    }
  }, [state, pathname, router]);

  if (state.status !== "authenticated") return <NeutralShell />;

  const legacy = legacyModuleForPath(pathname);
  const fullHeight = !!legacy || pathname === KOL_STUDIO_PATH;
  const notice = actionError && (
    <Notice
      tone="danger"
      title="账户操作未完成"
      className="mb-4"
      role="alert"
      actions={
        <Button size="sm" onClick={clearActionError}>
          知道了
        </Button>
      }
    >
      {actionError}
    </Notice>
  );

  return (
    <DraftProvider>
      <PublicationProvider key={state.session.user.id}>
      <KolProvider key={state.session.user.id}>
      <WorkbenchProvider key={state.session.user.id}>
      <KolStudioProvider key={state.session.user.id}>
      <LegacyProvider key={state.session.user.id}>
        <PageSearchProvider>
          <a
            href="#main"
            className="sr-only z-(--z-toast) rounded-control bg-raised px-3 py-2 font-medium text-fg shadow-overlay focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            跳到主要内容
          </a>
          <div className="flex min-h-dvh bg-canvas">
            <DesktopSidebar />
            {/* 工作台路由占满一屏，iframe 自己滚动；其他页面随文档滚动 */}
            <div className={cn("flex min-w-0 flex-1 flex-col bg-canvas", fullHeight && "h-dvh")}>
              <Topbar />
              <main
                id="main"
                tabIndex={-1}
                className={cn(
                  "min-w-0 flex-1 outline-none",
                  fullHeight ? "flex min-h-0 flex-col" : "mx-auto w-full max-w-[1640px] px-4 pt-6 pb-10 md:px-8 md:pt-7",
                )}
              >
                {fullHeight ? notice && <div className="px-4 pt-4 md:px-8">{notice}</div> : notice}
                <ErrorBoundary key={`${state.session.user.id}:${pathname}`} area="page">
                  {children}
                </ErrorBoundary>
                <LegacyStage />
                <KolStudioStage />
              </main>
            </div>
          </div>
        </PageSearchProvider>
      </LegacyProvider>
      </KolStudioProvider>
      </WorkbenchProvider>
      </KolProvider>
      </PublicationProvider>
    </DraftProvider>
  );
}
