"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ExpectedRevision, WidgetInstance } from "@/contracts/dashboard";
import { useSession } from "@/features/auth/session-provider";
import { HOME_PATH } from "@/lib/routes";

import { sameWidgets } from "./layout";

/**
 * 首页布局草稿（SPEC §5.2、§6）。草稿保存在外壳级内存中：
 * - 站内导航离开首页、退出、切换演示身份 → “继续编辑 / 放弃更改”；
 * - 浏览器后退/前进 → 草稿保留，回到首页时恢复并提示“还有未保存的布局”；
 * - 刷新/关闭 → 浏览器原生离开提示（文本由浏览器决定）。
 * 在其他非首页页面之间跳转不会丢草稿，所以不打断。
 */
export interface LayoutDraft {
  userId: string;
  baseRevision: ExpectedRevision;
  /** 进入编辑时的已保存布局，用于判断是否有改动 */
  saved: WidgetInstance[];
  widgets: WidgetInstance[];
}

interface LeaveOptions {
  /** 该动作会销毁草稿（退出、切换身份） */
  destroysDraft?: boolean;
}

interface DraftContextValue {
  draft: LayoutDraft | null;
  dirty: boolean;
  setDraft: React.Dispatch<React.SetStateAction<LayoutDraft | null>>;
  /** 需要时先询问，再执行 action；返回是否立即执行 */
  requestLeave(action: () => void, options?: LeaveOptions): boolean;
}

const DraftContext = React.createContext<DraftContextValue | null>(null);

export function isDraftDirty(draft: LayoutDraft | null): boolean {
  return draft !== null && !sameWidgets(draft.saved, draft.widgets);
}

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { onSignOut } = useSession();
  const [draft, setDraft] = React.useState<LayoutDraft | null>(null);
  const [pending, setPending] = React.useState<(() => void) | null>(null);
  const continueButton = React.useRef<HTMLButtonElement>(null);
  const dirty = isDraftDirty(draft);

  // 退出时清除身份相关草稿
  React.useEffect(() => onSignOut(() => setDraft(null)), [onSignOut]);

  // 刷新/关闭：原生离开提示
  React.useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 部分浏览器仍要求设置 returnValue 才会提示
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const requestLeave = React.useCallback<DraftContextValue["requestLeave"]>(
    (action, options) => {
      const onHome = window.location.pathname === HOME_PATH;
      if (dirty && (onHome || options?.destroysDraft)) {
        setPending(() => action);
        return false;
      }
      // 没有改动的编辑态直接结束，不打断
      if (!dirty && draft && onHome) setDraft(null);
      action();
      return true;
    },
    [dirty, draft],
  );

  const keepEditing = () => {
    setPending(null);
    if (window.location.pathname !== HOME_PATH) router.push(HOME_PATH);
  };

  const discard = () => {
    const action = pending;
    setPending(null);
    setDraft(null);
    action?.();
  };

  const value = React.useMemo(
    () => ({ draft, dirty, setDraft, requestLeave }),
    [draft, dirty, requestLeave],
  );

  return (
    <DraftContext.Provider value={value}>
      {children}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent showCloseButton={false} onEscapeKeyDown={() => setPending(null)} onOpenAutoFocus={(event) => {
          event.preventDefault();
          continueButton.current?.focus();
        }}>
          <DialogHeader>
            <DialogTitle>首页布局还没有保存</DialogTitle>
            <DialogDescription>
              放弃后，本次对卡片的添加、移除、排序和宽度修改都会丢失；已保存的布局不受影响。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="danger" onClick={discard}>
              放弃更改
            </Button>
            <Button ref={continueButton} variant="primary" onClick={keepEditing}>
              继续编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DraftContext.Provider>
  );
}

export function useDraft(): DraftContextValue {
  const ctx = React.useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
