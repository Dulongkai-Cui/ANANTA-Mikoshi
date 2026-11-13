"use client";

import * as React from "react";

import { authGateway } from "@/adapters";
import type { Session, SessionIssue, SignInError, SignOutResult } from "@/contracts/auth";

export type SessionState =
  | { status: "checking" }
  | { status: "authenticated"; session: Session }
  /** signedOut：本人刚刚主动退出，登录页不附带 returnTo */
  | { status: "anonymous"; signedOut?: boolean }
  | { status: "invalid"; issue: SessionIssue };

interface SessionContextValue {
  state: SessionState;
  mode: typeof authGateway.mode;
  /** 重新从 sessionStorage 读取（例如 bfcache 恢复页面时） */
  refresh(): Promise<SessionState>;
  signIn(email: string, password: string): Promise<{ ok: true; session: Session } | { ok: false; error: SignInError }>;
  /** 清会话；调用方负责清理身份相关内存状态与跳转 */
  signOut(): Promise<SignOutResult>;
  actionError: string | null;
  clearActionError(): void;
  /** 切换演示身份：先退出（触发清理）再登录，中间不出现未登录渲染 */
  switchUser(email: string, password: string): Promise<boolean>;
  /** 订阅退出事件，用于清理身份相关内存状态（草稿、搜索内容） */
  onSignOut(listener: () => void): () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SessionState>({ status: "checking" });
  const listeners = React.useRef(new Set<() => void>());
  const [actionError, setActionError] = React.useState<string | null>(null);
  const actionPending = React.useRef(false);

  const refresh = React.useCallback(async (): Promise<SessionState> => {
    const result = await authGateway.getSession();
    const next: SessionState =
      result.status === "authenticated"
        ? { status: "authenticated", session: result.session }
        : result.status === "anonymous"
          ? { status: "anonymous" }
          : { status: "invalid", issue: result.issue };
    setState(next);
    return next;
  }, []);

  React.useEffect(() => {
    // refresh 在 await 之后才 setState，属于订阅外部存储的回调
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    // 后退/前进从 bfcache 恢复时重新核对会话，退出后不能恢复已登录界面
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [refresh]);

  const signIn = React.useCallback<SessionContextValue["signIn"]>(async (email, password) => {
    const result = await authGateway.signIn({ email, password });
    if (result.ok) setState({ status: "authenticated", session: result.session });
    return result;
  }, []);

  const signOut = React.useCallback(async () => {
    const result = await authGateway.signOut();
    if (!result.ok) {
      setActionError(authGateway.mode === "production" ? "退出未完成，无法连接身份服务。请恢复连接后重试。" : "退出未完成：浏览器无法清除本地会话。当前身份仍保留，请恢复存储权限后重试。");
      return result;
    }
    setActionError(null);
    listeners.current.forEach((fn) => fn());
    setState({ status: "anonymous", signedOut: true });
    return result;
  }, []);

  const switchUser = React.useCallback(async (email: string, password: string) => {
    if (actionPending.current) return false;
    actionPending.current = true;
    const removed = await authGateway.signOut();
    if (!removed.ok) {
      actionPending.current = false;
      setActionError("身份切换未完成：浏览器无法清除原会话。当前身份仍保留，请恢复存储权限后重试。");
      return false;
    }
    setActionError(null);
    listeners.current.forEach((fn) => fn());
    // 身份切换期间卸载旧身份区域；不能在延迟登录期间再次触发退出或切换。
    setState({ status: "checking" });
    const result = await authGateway.signIn({ email, password });
    actionPending.current = false;
    setState(result.ok ? { status: "authenticated", session: result.session } : { status: "invalid", issue: result.error.code === "not_configured" ? "not_configured" : "storage_unavailable" });
    return result.ok;
  }, []);

  const onSignOut = React.useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = React.useMemo(
    () => ({ state, mode: authGateway.mode, refresh, signIn, signOut, switchUser, onSignOut, actionError, clearActionError: () => setActionError(null) }),
    [state, refresh, signIn, signOut, switchUser, onSignOut, actionError],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

/** 受保护区域内使用：此时一定已登录 */
export function useCurrentUser() {
  const { state } = useSession();
  if (state.status !== "authenticated") throw new Error("useCurrentUser requires an authenticated session");
  return state.session.user;
}

export const SESSION_ISSUE_TEXT: Record<SessionIssue, string> = {
  corrupted: "本地演示会话已失效或数据损坏，请重新登录。",
  storage_unavailable: "浏览器禁止访问会话存储，无法读取本地演示会话。请允许本站使用存储后重新登录。",
  not_configured: "正式身份服务尚未接入，当前构建无法登录。",
};
