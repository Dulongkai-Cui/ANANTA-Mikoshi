"use client";

import * as React from "react";
import { IS_DEMO } from "@/adapters";
import { usePathname } from "next/navigation";
import { FlaskConical, Menu, Search } from "lucide-react";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePageSearch, useShortcutLabel } from "@/features/search/page-search";
import { cn } from "@/lib/cn";
import { findRoute } from "@/lib/routes";

import { BrandLogo } from "./brand";
import { BusinessSwitcher } from "./business-switcher";
import { SidebarNav } from "./sidebar";

/** 持续但克制的环境标识（SPEC §5.1） */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-[6px] bg-warning-soft px-2.5 py-1 text-caption font-medium text-warning",
            className,
          )}
        >
          <FlaskConical className="size-3.5" aria-hidden />
          {IS_DEMO ? "演示环境" : "团队工作区"}
        </span>
      </TooltipTrigger>
      <TooltipContent>{IS_DEMO ? "本地演示：身份为虚构；KOL与三方号管理资料保存在本机，发布效果与其他板块尚未接入" : "邀请制团队工作区：KOL筛选与策划保存到服务器；原发布管理、三方号与我的工作台资料仍保存在各自浏览器。"}</TooltipContent>
    </Tooltip>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const route = findRoute(pathname);
  const { open } = usePageSearch();
  const shortcut = useShortcutLabel();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const drawerTrigger = React.useRef<HTMLButtonElement>(null);

  return (
    <header className="sticky top-0 z-(--z-sticky) grid min-h-(--topbar-height) shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-3 py-1 md:px-5">
      {/* 小屏：抽屉导航 */}
      <div className="flex min-w-0 items-center gap-1 max-[480px]:col-span-2 md:hidden">
      <button
        ref={drawerTrigger}
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="打开导航"
        aria-expanded={drawerOpen}
        className="-ml-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-hover hover:text-fg md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <p className="min-w-0 break-anywhere text-body font-medium text-fg">{route?.label ?? "Mikoshi"}</p>
      </div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent
          className="bg-sidebar text-nav-fg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            drawerTrigger.current?.focus();
          }}
        >
          <div className="shrink-0 px-4 pt-5 pb-4">
            <BrandLogo />
          </div>
          <DrawerTitle className="sr-only">导航</DrawerTitle>
          <DrawerDescription className="sr-only">选择要前往的页面</DrawerDescription>
          <SidebarNav touch onNavigate={() => setDrawerOpen(false)} />
        </DrawerContent>
      </Drawer>

      <div className="order-last col-span-2 min-w-0 md:order-none md:col-span-1">
        <BusinessSwitcher />
      </div>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 max-[480px]:col-span-2 max-[480px]:justify-end">
      <button
        type="button"
        onClick={open}
        aria-label="搜索页面"
        aria-keyshortcuts="Control+K Meta+K"
        className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-control text-fg-secondary transition-[background-color,box-shadow,color] duration-(--motion-fast) hover:bg-hover hover:text-fg md:pointer-fine:min-h-9 2xl:w-40 2xl:justify-start 2xl:bg-canvas 2xl:px-2.5 2xl:py-1 2xl:ring-1 2xl:ring-line 2xl:hover:ring-control/60"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left text-caption 2xl:inline">搜索页面</span>
        <kbd className="hidden rounded-[4px] bg-surface px-1.5 font-sans text-caption text-fg-muted ring-1 ring-line 2xl:inline">{shortcut}</kbd>
      </button>
      <DemoBadge />
      </div>
    </header>
  );
}
