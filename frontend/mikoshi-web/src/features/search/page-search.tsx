"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { useGuardedNavigate } from "@/components/shell/use-guarded-navigate";
import { useSession } from "@/features/auth/session-provider";
import { cn } from "@/lib/cn";
import { findRoute } from "@/lib/routes";

import { searchPages } from "./search-pages";

interface PageSearchContextValue {
  open: () => void;
}

const PageSearchContext = React.createContext<PageSearchContextValue | null>(null);

export function usePageSearch() {
  const ctx = React.useContext(PageSearchContext);
  if (!ctx) throw new Error("usePageSearch must be used within PageSearchProvider");
  return ctx;
}

/** 平台检测只在客户端用于显示快捷键提示 */
function useIsMac() {
  return React.useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

export function useShortcutLabel() {
  return useIsMac() ? "⌘K" : "Ctrl K";
}

/**
 * 全局“搜索页面”：组合框 + 列表框（WAI-ARIA combobox 模式）。
 * - Ctrl/Cmd+K 打开；方向键移动、Enter 前往、Esc 关闭，关闭后焦点回到触发处（Radix Dialog）。
 * - 中文输入法组合期间（isComposing / keyCode 229）不处理 Enter 与方向键。
 */
export function PageSearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const openSearch = React.useCallback(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);
  const { navigate } = useGuardedNavigate();
  const { onSignOut } = useSession();
  const pathname = usePathname();
  const listId = React.useId();
  const results = React.useMemo(() => searchPages(query), [query]);
  const active = Math.min(activeIndex, Math.max(results.length - 1, 0));
  React.useEffect(() => {
    if (isOpen) document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [isOpen, listId, active, results]);

  // 退出时清空搜索内容（SPEC §5.1）
  React.useEffect(
    () =>
      onSignOut(() => {
        setIsOpen(false);
        setQuery("");
      }),
    [onSignOut],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) { setIsOpen(false); setQuery(""); setActiveIndex(0); }
        else openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, openSearch]);

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  };

  const go = (path: string) => {
    onOpenChange(false);
    if (path !== pathname) navigate(path);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 输入法组合中：Enter 用于上屏，方向键用于选词
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length) setActiveIndex((active + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length) setActiveIndex((active - 1 + results.length) % results.length);
    } else if (event.key === "Home" && results.length) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && results.length) {
      event.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[active];
      if (target) go(target.path);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const value = React.useMemo(() => ({ open: openSearch }), [openSearch]);

  return (
    <PageSearchContext.Provider value={value}>
      {children}
      <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay data-slot="overlay" className="fixed inset-0 z-(--z-modal) bg-scrim" />
          <DialogPrimitive.Content
            onCloseAutoFocus={(event) => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }}
            data-slot="dialog-content"
            aria-describedby={undefined}
            className="fixed top-[12dvh] left-1/2 z-(--z-modal) flex max-h-[min(30rem,76dvh)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-overlay border border-line bg-raised text-fg shadow-overlay"
          >
            <DialogPrimitive.Title className="sr-only">搜索页面</DialogPrimitive.Title>
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-fg-muted" aria-hidden />
              <input
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={results.length ? optionId(active) : undefined}
                aria-autocomplete="list"
                aria-label="搜索页面"
                placeholder="输入页面名称，例如“联动”或“设置”"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                autoComplete="off"
                spellCheck={false}
                className="h-12 min-w-0 flex-1 bg-transparent text-long text-fg outline-none placeholder:text-fg-muted"
              />
            </div>
            <div className="min-h-0 overflow-y-auto p-1.5">
              {results.length > 0 ? (
                <ul id={listId} role="listbox" aria-label="页面" className="flex flex-col gap-0.5">
                  {results.map((r, i) => {
                    const Icon = r.icon;
                    const selected = i === active;
                    const current = r.path === pathname;
                    return (
                      <li
                        key={r.path}
                        id={optionId(i)}
                        role="option"
                        aria-selected={selected}
                        onPointerMove={() => setActiveIndex(i)}
                        onClick={() => go(r.path)}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3",
                          selected ? "bg-accent-soft" : "hover:bg-hover",
                        )}
                      >
                        <Icon className={cn("size-[18px] shrink-0", selected ? "text-accent" : "text-fg-muted")} aria-hidden />
                        <span className="min-w-0 flex-1 py-2">
                          <span className="block truncate font-medium">{r.label}</span>
                          {r.parentPath && <span className="block text-caption text-fg-secondary">{findRoute(r.parentPath)?.label}</span>}
                        </span>
                        {current && <span className="text-caption text-fg-muted">当前页面</span>}
                        {selected && <CornerDownLeft className="size-4 shrink-0 text-fg-muted" aria-hidden />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div role="status" className="px-3 py-8 text-center">
                  <p className="font-medium text-fg">没有名为“{query.trim()}”的页面</p>
                  <p className="mt-1 text-fg-secondary">这里只搜索页面名称，暂不支持业务内容搜索。</p>
                </div>
              )}
            </div>
            <div aria-hidden className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-caption text-fg-muted">
              <span>↑ ↓ 选择</span>
              <span>Enter 前往</span>
              <span>Esc 关闭</span>
            </div>
            <p className="sr-only" role="status" aria-live="polite">
              {results.length ? `${results.length} 个页面` : "没有匹配的页面"}
            </p>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </PageSearchContext.Provider>
  );
}
