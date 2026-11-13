"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useCurrentUser } from "@/features/auth/session-provider";
import { usePreferences } from "@/features/settings/preferences-provider";

import { useLegacy } from "./legacy-provider";
import { LEGACY_MODULES, legacyModuleForPath, type LegacyModuleId } from "./modules";

function LegacyFrame({ id, active }: { id: LegacyModuleId; active: boolean }) {
  const { registerFrame, markLoading } = useLegacy();
  const user = useCurrentUser();
  const { preferences, systemDark, systemReducedMotion } = usePreferences();
  const mod = LEGACY_MODULES[id];
  // Keep src stable when preferences change; the bridge updates the retained document.
  const [src] = React.useState(() => {
    const params = new URLSearchParams({
      user: user.id,
      theme: preferences.theme === "system" ? systemDark ? "dark" : "light" : preferences.theme,
      motion: systemReducedMotion || preferences.motion === "reduce" ? "reduce" : "auto",
      font: typeof window === "undefined" ? "16" : String(parseFloat(window.getComputedStyle(document.documentElement).fontSize)),
    });
    return `${mod.src}?${params}`;
  });
  const ref = React.useCallback(
    (frame: HTMLIFrameElement | null) => {
      registerFrame(id, frame);
      if (frame) markLoading(id);
    },
    [id, registerFrame, markLoading],
  );
  return (
    <iframe
      ref={ref}
      src={src}
      title={`${mod.label}数据工作台（原无限大B站数据系统）`}
      sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      hidden={!active}
      className={cn("absolute inset-0 size-full border-0 bg-canvas", !active && "hidden")}
    />
  );
}

/**
 * 原工作台的承载区。访问过的工作台保持挂载（隐藏而不卸载），
 * 在 KOL、三方号与其他页面之间来回切换时保留各自的筛选与滚动状态。
 */
export function LegacyStage() {
  const pathname = usePathname();
  const active = legacyModuleForPath(pathname)?.id;
  const { status, generation, retry } = useLegacy();
  const [visited, setVisited] = React.useState<LegacyModuleId[]>([]);
  if (active && !visited.includes(active)) setVisited([...visited, active]);

  const current = active ? status[active] : "idle";
  return (
    <div hidden={!active} className="relative min-h-0 flex-1 bg-canvas">
      {visited.map((id) => (
        <LegacyFrame key={`${id}-${generation[id]}`} id={id} active={id === active} />
      ))}
      {active && current !== "ready" && (
        <div
          role={current === "error" ? "alert" : "status"}
          className={cn("absolute inset-0 z-[1] flex flex-col items-center justify-center bg-canvas px-6 text-center")}
        >
          {current === "error" ? (
            <>
              <p className="font-semibold text-fg">{LEGACY_MODULES[active].label}工作台没有载入</p>
              <p className="mt-1 max-w-sm text-caption text-fg-secondary">
                数据快照暂时无法显示，可能是加载中断或页面脚本出错。请重新载入，仍未恢复时联系维护人员。
              </p>
              <Button className="mt-4" onClick={() => retry(active)}>
                重新载入
              </Button>
            </>
          ) : (
            <>
              <span aria-hidden className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <i
                    key={i}
                    className="size-1.5 rounded-full bg-nav-indicator motion-safe:animate-pulse reduce-motion:animate-none"
                    style={{ animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </span>
              <p className="mt-4 font-medium text-fg-secondary">正在打开{LEGACY_MODULES[active].label}数据工作台</p>
              <p className="mt-1 text-caption text-fg-muted">载入内置图表、头像与作品明细</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
