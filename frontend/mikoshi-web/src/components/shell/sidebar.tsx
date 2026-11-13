"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLegacy } from "@/features/legacy/legacy-provider";
import { legacyModuleForPath, type LegacyModule } from "@/features/legacy/modules";
import { usePreferences } from "@/features/settings/preferences-provider";
import { useKolStudio } from "@/features/kol-studio/kol-studio-provider";
import { KOL_STUDIO_PATH, KOL_STUDIO_VIEWS, kolStudioHref } from "@/features/kol-studio/modules";
import { IS_DEMO } from "@/adapters";
import { assetPath } from "@/lib/asset-path";
import { cn } from "@/lib/cn";
import { APP_ROUTES, findWorkspaceRoute, type AppRoute } from "@/lib/routes";

import { BrandLogo } from "./brand";
import { useGuardedNavigate } from "./use-guarded-navigate";
import { UserMenu } from "./user-menu";

const personal = APP_ROUTES.filter((r) => r.group === "personal");

/** 深蓝侧栏中的一项（沿用“无限大B站数据系统”：选中为 #345377 底 + 左侧浅蓝内描边） */
const itemClass = (active: boolean, touch: boolean, collapsed: boolean) =>
  cn(
    "group relative flex w-full items-center gap-3 rounded-[9px] px-3.5 text-left text-[0.8125rem]",
    "transition-[background-color,color] duration-(--motion-fast) ease-(--ease-enter)",
    touch ? "min-h-11" : "min-h-10",
    collapsed && "justify-center px-0",
    active
      ? "bg-nav-active font-medium text-nav-fg-strong shadow-[inset_3px_0_var(--nav-indicator)]"
      : "text-nav-fg hover:bg-nav-hover hover:text-nav-fg-strong",
  );

function NavItem({
  route,
  active,
  collapsed,
  touch,
  onNavigate,
  children,
}: {
  route: AppRoute;
  active: boolean;
  collapsed: boolean;
  touch: boolean;
  onNavigate?: () => void;
  children?: React.ReactNode;
}) {
  const { linkHandler } = useGuardedNavigate();
  const Icon = route.icon;
  const link = (
    <Link
      href={route.path}
      onClick={linkHandler(route.path, onNavigate)}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? route.label : undefined}
      className={itemClass(active, touch, collapsed)}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.65} aria-hidden />
      {!collapsed && <span className="min-w-0 break-anywhere">{route.label}</span>}
      {!collapsed && active && <i aria-hidden className="ml-auto size-[5px] shrink-0 rounded-full bg-nav-indicator" />}
    </Link>
  );
  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{route.label}</TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
      {children}
    </li>
  );
}

/** 当前工作区已启用的发布效果页面。 */
function LegacySubnav({ mod, collapsed, touch, onNavigate }: { mod: LegacyModule; collapsed: boolean; touch: boolean; onNavigate?: () => void }) {
  const { pages, go } = useLegacy();
  const pathname = usePathname();
  const current = pages[mod.id];
  return (
    <ul aria-label={`${mod.label}页面`} className="flex flex-col gap-1">
      {mod.pages.map((p) => {
        const active = pathname === mod.path && current === p.id;
        const Icon = p.icon;
        const link = (
            <a
              href={assetPath(`${mod.path}#${p.id}`)}
              aria-current={active ? "true" : undefined}
              aria-label={collapsed ? p.label : undefined}
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                go(mod.id, p.id, onNavigate);
              }}
              className={itemClass(active, touch, collapsed)}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={1.65} aria-hidden />
              {!collapsed && <span className="min-w-0 break-anywhere">{p.label}</span>}
              {!collapsed && active && <i aria-hidden className="ml-auto size-[5px] shrink-0 rounded-full bg-nav-indicator" />}
            </a>
        );
        return (
          <li key={p.id}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{p.label}</TooltipContent>
              </Tooltip>
            ) : link}
          </li>
        );
      })}
    </ul>
  );
}

function KolNavigation({ collapsed, touch, onNavigate }: { collapsed: boolean; touch: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { view } = useKolStudio();
  const mod = legacyModuleForPath("/kol")!;
  const management = APP_ROUTES.filter((route) => route.parentPath === "/kol" && !route.path.startsWith(KOL_STUDIO_PATH));
  return <div className="flex flex-col gap-1">
    <ul className="flex flex-col gap-1" aria-label="KOL工作页面">
      {KOL_STUDIO_VIEWS.map((item) => {
        const route = APP_ROUTES.find((entry) => entry.path === kolStudioHref(item.id))!;
        return <NavItem key={item.id} route={route} active={pathname === KOL_STUDIO_PATH && view === item.id} collapsed={collapsed} touch={touch} onNavigate={onNavigate} />;
      })}
      {management.map((route) => <NavItem key={route.path} route={route} active={pathname === route.path} collapsed={collapsed} touch={touch} onNavigate={onNavigate} />)}
    </ul>
    <LegacySubnav mod={mod} collapsed={collapsed} touch={touch} onNavigate={onNavigate} />
  </div>;
}

/**
 * 导航主体：桌面侧栏与小屏抽屉共用。
 * `touch` 时目标高度 44px（FE-44）。
 */
export function SidebarNav({
  collapsed = false,
  touch = false,
  onNavigate,
}: {
  collapsed?: boolean;
  touch?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const route = findWorkspaceRoute(pathname);
  const legacy = legacyModuleForPath(route?.path ?? pathname);
  const overview = route && {
    ...route,
    label: route.path === "/miko" ? "AI入口" : route.group === "home" ? "工作台总览" : route.group === "personal" ? "外观与偏好" : "业务总览",
    icon: route.path === "/miko" ? route.icon : LayoutDashboard,
  };
  const children = APP_ROUTES.filter((r) => r.parentPath === route?.path);

  const renderList = (routes: readonly AppRoute[]) => (
    <ul className="flex flex-col gap-1">
      {routes.map((r) => (
        <NavItem key={r.path} route={r} active={pathname === r.path} collapsed={collapsed} touch={touch} onNavigate={onNavigate} />
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-max flex-1 flex-col">
      <nav
        aria-label="当前业务页面"
        className="flex shrink-0 flex-col gap-3 px-3.5 pt-4 pb-6"
      >
        {!collapsed && <h2 className="px-3 text-caption font-medium text-nav-fg">{route?.label ?? "工作区"}</h2>}
        {route?.path === "/kol" ? <KolNavigation key={pathname} collapsed={collapsed} touch={touch} onNavigate={onNavigate} /> : legacy
          ? <><LegacySubnav mod={legacy} collapsed={collapsed} touch={touch} onNavigate={onNavigate} />{children.length > 0 && <div className="border-t border-nav-line pt-3">{renderList(children)}</div>}</>
          : overview && renderList([overview, ...children])}
      </nav>
      <div className="mt-auto flex shrink-0 flex-col gap-1.5 border-t border-nav-line px-3.5 py-3">
        <nav aria-label="个人">{renderList(personal)}</nav>
        <UserMenu collapsed={collapsed} onAction={onNavigate} />
        {!collapsed && (
          <p className="flex items-center gap-2 px-2 pt-1 text-[0.6875rem] text-nav-muted">
            <i aria-hidden className="size-1.5 rounded-full bg-nav-indicator" />
            {IS_DEMO ? "本地演示环境 · 资料仅存本机" : "团队工作区 · KOL云端同步"}
          </p>
        )}
      </div>
    </div>
  );
}

/** 桌面侧栏（≥768px）：默认 216px（随根字号扩展），可收起为 64px。 */
export function DesktopSidebar() {
  const { preferences, setSidebarCollapsed } = usePreferences();
  const collapsed = preferences.sidebarCollapsed;
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = collapsed ? "展开侧栏" : "收起侧栏";

  return (
    <div className="hidden shrink-0 bg-sidebar md:block">
      <aside
        aria-label="侧栏"
        className={cn(
          "sticky top-0 flex h-dvh flex-col overflow-y-auto bg-sidebar text-nav-fg [scrollbar-color:var(--nav-muted)_transparent] [scrollbar-width:thin]",
          "w-(--sidebar-width) sidebar-collapsed:w-(--sidebar-collapsed-width)",
          "transition-[width] duration-(--motion-panel) ease-(--ease-move) reduce-motion:transition-none",
        )}
      >
        <div className={cn("relative shrink-0 px-4 pt-5 pb-4", collapsed && "px-2 pt-4")}>
          <BrandLogo compact={collapsed} />
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!collapsed)}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            title={toggleLabel}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] text-nav-muted transition-[background-color,color] duration-(--motion-fast) hover:bg-nav-hover hover:text-nav-fg-strong",
              collapsed ? "mx-auto mt-3 flex" : "absolute top-2 right-1.5",
            )}
          >
            <ToggleIcon className="size-[17px]" aria-hidden />
          </button>
        </div>
        <SidebarNav collapsed={collapsed} />
      </aside>
    </div>
  );
}
