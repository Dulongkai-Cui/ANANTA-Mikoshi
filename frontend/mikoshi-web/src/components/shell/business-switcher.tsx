"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { APP_ROUTES, findWorkspaceRoute } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { kolStudioHref, KOL_STUDIO_PATH } from "@/features/kol-studio/modules";
import { useGuardedNavigate } from "./use-guarded-navigate";

const workspaces = APP_ROUTES.filter((route) => route.group !== "personal" && !route.parentPath);

/** 顶部切业务、侧栏切页面。窄屏仅导航带滚动，不挤压整页或截断名称。 */
export function BusinessSwitcher() {
  const pathname = usePathname();
  const workspace = findWorkspaceRoute(pathname);
  const { linkHandler } = useGuardedNavigate();
  const list = React.useRef<HTMLUListElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  React.useEffect(() => {
    const node = list.current;
    if (!node) return;
    const update = () => {
      const next = { left: node.scrollLeft > 2, right: node.scrollWidth - node.clientWidth - node.scrollLeft > 2 };
      setEdges((previous) => previous.left === next.left && previous.right === next.right ? previous : next);
    };
    const resize = new ResizeObserver(update);
    resize.observe(node);
    for (const child of node.children) resize.observe(child);
    node.addEventListener("scroll", update, { passive: true });
    update();
    return () => { resize.disconnect(); node.removeEventListener("scroll", update); };
  }, []);

  React.useEffect(() => {
    list.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [pathname]);

  const overflow = edges.left || edges.right;
  const move = (direction: number) => list.current?.scrollBy({ left: direction * list.current.clientWidth * 0.7, behavior: "instant" });
  return (
    <nav aria-label="主导航" className="flex min-w-0 items-center gap-1">
      {overflow && (
        <button type="button" aria-label="向左查看业务板块" disabled={!edges.left} onClick={() => move(-1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-hover disabled:cursor-default disabled:opacity-40 md:pointer-fine:size-9">
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      <ul ref={list} className="flex min-w-0 flex-1 scroll-px-[4px] gap-1.5 overflow-x-auto overscroll-x-contain px-1 py-1 [scrollbar-color:var(--control)_transparent] [scrollbar-width:thin]">
        {workspaces.map((route) => {
          const active = workspace?.path === route.path;
          const Icon = route.icon;
          const href = route.path === "/kol" ? kolStudioHref() : route.path;
          return (
            <li key={route.path} className="shrink-0 first:pl-1 last:pr-1">
              <Link href={href} aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if ((route.path === "/kol" ? pathname === KOL_STUDIO_PATH : pathname === route.path) && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    return;
                  }
                  linkHandler(href)(event);
                }}
                onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" })}
                className={cn("inline-flex min-h-11 scroll-mx-[4px] items-center justify-center gap-1.5 whitespace-nowrap rounded-control border px-2.5 text-[0.8125rem] font-medium transition-[background-color,border-color,color,box-shadow] duration-(--motion-fast) md:pointer-fine:min-h-9",
                  active ? "border-accent bg-accent text-on-accent shadow-primary hover:bg-accent-hover" : "border-control/40 bg-canvas text-fg-secondary shadow-control hover:border-control/60 hover:bg-subtle hover:text-fg")}
              ><Icon className="size-4 shrink-0" strokeWidth={1.7} aria-hidden />{route.label}</Link>
            </li>
          );
        })}
      </ul>
      {overflow && (
        <button type="button" aria-label="向右查看业务板块" disabled={!edges.right} onClick={() => move(1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-hover disabled:cursor-default disabled:opacity-40 md:pointer-fine:size-9">
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </nav>
  );
}
