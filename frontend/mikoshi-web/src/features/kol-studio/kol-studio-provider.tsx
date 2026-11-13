"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePreferences } from "@/features/settings/preferences-provider";
import { KOL_STUDIO_CHANNEL, KOL_STUDIO_PATH, isKolStudioView, kolStudioHref, kolStudioViewFromHash, type KolStudioView } from "./modules";

type FrameStatus = "idle" | "loading" | "ready" | "error";
interface LeaveOptions { destroysDraft?: boolean }
interface PendingLeave { action: () => void; message: string; discard: boolean }
interface StudioContext {
  view: KolStudioView;
  status: FrameStatus;
  generation: number;
  error: string;
  registerFrame(frame: HTMLIFrameElement | null): void;
  requestLeave(action: () => void, options?: LeaveOptions): boolean;
  retry(): void;
}
const Context = React.createContext<StudioContext | null>(null);

/** Retains the complete workbench, including forms, when the host route changes. */
export function KolStudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { preferences, systemDark, systemReducedMotion } = usePreferences();
  const [view, setView] = React.useState<KolStudioView>("kols");
  const [status, setStatus] = React.useState<FrameStatus>("idle");
  const [error, setError] = React.useState("");
  const [generation, setGeneration] = React.useState(0);
  const [pending, setPending] = React.useState<PendingLeave | null>(null);
  const frame = React.useRef<HTMLIFrameElement | null>(null);
  const ready = React.useRef(false);
  const currentView = React.useRef<KolStudioView>("kols");
  const desiredView = React.useRef<KolStudioView>("kols");
  const dirty = React.useRef(false);
  const environment = React.useRef(() => {});
  const checks = React.useRef(new Map<string, { action: () => void; timer: number }>());

  const post = React.useCallback((type: string, detail: Record<string, unknown> = {}) => {
    frame.current?.contentWindow?.postMessage({ channel: KOL_STUDIO_CHANNEL, type, ...detail }, window.location.origin);
  }, []);
  const syncHash = React.useCallback((next: KolStudioView, push = false) => {
    if (!window.location.pathname.endsWith(KOL_STUDIO_PATH)) return;
    // Preserve the deployment base path instead of forcing a root-level route.
    const href = `${window.location.pathname}#${next}`;
    if (window.location.pathname + window.location.hash !== href) {
      if (push) window.history.pushState(window.history.state, "", href);
      else window.history.replaceState(window.history.state, "", href);
    }
  }, []);

  const registerFrame = React.useCallback((node: HTMLIFrameElement | null) => {
    frame.current = node;
    ready.current = false;
    if (node) { setStatus("loading"); setError(""); }
  }, []);

  const requestLeave = React.useCallback((action: () => void, _options?: LeaveOptions) => {
    // Both route changes and sign-out wait for the same save/draft acknowledgement.
    void _options;
    if (!frame.current || !ready.current) {
      // A failed/loading document may still contain an edited form. Never silently destroy it.
      if (dirty.current) { setPending({ action, message: "工作室尚有未保存编辑，连接暂时中断。继续编辑可保留当前内容。", discard: true }); return false; }
      action(); return true;
    }
    const id = crypto.randomUUID();
    const timer = window.setTimeout(() => {
      checks.current.delete(id);
      setPending({ action, message: "工作室未能确认保存状态。请回到工作室检查连接，当前编辑会继续保留。", discard: false });
    }, 12_000);
    checks.current.set(id, { action, timer });
    post("prepare-leave", { id });
    return false;
  }, [post]);

  React.useEffect(() => {
    const apply = () => {
      const css = getComputedStyle(document.documentElement);
      post("environment", {
        theme: preferences.theme === "system" ? systemDark ? "dark" : "light" : preferences.theme,
        motion: systemReducedMotion || preferences.motion === "reduce" ? "reduce" : "auto",
        fontSize: parseFloat(css.fontSize),
        colors: Object.fromEntries(["canvas", "raised", "subtle", "fg", "fg-secondary", "fg-muted", "line", "accent", "accent-soft"].map((key) => [key, css.getPropertyValue(`--${key}`).trim()])),
      });
    };
    environment.current = apply;
    if (ready.current) apply();
    const observer = new MutationObserver(() => { if (ready.current) apply(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-theme", "data-motion"] });
    return () => observer.disconnect();
  }, [post, preferences.theme, preferences.motion, systemDark, systemReducedMotion]);

  React.useEffect(() => {
    const apply = () => {
      if (!window.location.pathname.endsWith(KOL_STUDIO_PATH)) return;
      const next = kolStudioViewFromHash(window.location.hash) ?? "kols";
      desiredView.current = next;
      if (ready.current) post("navigate", { view: next });
      else setView(next);
    };
    apply();
    window.addEventListener("hashchange", apply);
    window.addEventListener("popstate", apply);
    return () => { window.removeEventListener("hashchange", apply); window.removeEventListener("popstate", apply); };
  }, [pathname, post]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const m = event.data;
      if (!m || typeof m !== "object" || m.channel !== KOL_STUDIO_CHANNEL) return;
      if (m.type === "error") {
        setStatus("error"); setError(typeof m.message === "string" ? m.message.slice(0,240) : "资料服务暂时无法连接。"); return;
      }
      if (m.type === "dirty") { dirty.current = m.dirty === true || m.saving === true; return; }
      if (m.type === "leave-result" && typeof m.id === "string") {
        const check = checks.current.get(m.id);
        if (!check) return;
        window.clearTimeout(check.timer); checks.current.delete(m.id);
        if (m.canLeave === true) { dirty.current = false; check.action(); }
        else setPending({ action: check.action, message: m.saving ? "正在保存修改，请稍候再离开。" : "当前表单还有未保存的修改。返回工作室可以继续编辑，放弃后仅撤销这个表单中的更改。", discard: !m.saving });
        return;
      }
      if (m.type === "navigation-blocked" && isKolStudioView(m.view)) {
        const next = m.view;
        syncHash(currentView.current);
        setPending({ action: () => post("navigate", { view: next }), message: m.saving ? "正在保存修改，请稍候再切换页面。" : "当前表单还有未保存的修改，切换页面前请先保存或放弃。", discard: !m.saving });
        return;
      }
      if ((m.type === "ready" || m.type === "view") && isKolStudioView(m.view)) {
        const first = !ready.current;
        ready.current = true; setStatus("ready"); setError("");
        currentView.current = m.view;
        setView(m.view);
        if (first) {
          environment.current();
          if (m.view !== desiredView.current) { post("navigate", { view: desiredView.current }); return; }
        }
        syncHash(m.view, !first);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post, syncHash]);

  React.useEffect(() => {
    if (status !== "loading") return;
    const timer = window.setTimeout(() => { if (!ready.current) { setStatus("error"); setError("工作室载入超时，请检查登录状态或资料服务。"); } }, 45_000);
    return () => window.clearTimeout(timer);
  }, [status, generation]);
  React.useEffect(() => {
    const pendingChecks = checks.current;
    const guard = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => { window.removeEventListener("beforeunload", guard); for (const check of pendingChecks.values()) window.clearTimeout(check.timer); };
  }, []);

  const retry = React.useCallback(() => requestLeave(() => {
    ready.current = false; setStatus("loading"); setError(""); setGeneration((previous) => previous + 1);
  }), [requestLeave]);
  const value = React.useMemo(() => ({ view, status, generation, error, registerFrame, requestLeave, retry }), [view, status, generation, error, registerFrame, requestLeave, retry]);
  const keepEditing = () => { setPending(null); if (pathname !== KOL_STUDIO_PATH) router.push(kolStudioHref(currentView.current)); post("focus-editor"); };

  return <Context.Provider value={value}>
    {children}
    <Dialog open={pending !== null} onOpenChange={(open) => { if (!open) setPending(null); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader><DialogTitle>先处理工作室中的修改</DialogTitle><DialogDescription>{pending?.message}</DialogDescription></DialogHeader>
        <DialogFooter>
          {pending?.discard && <Button variant="danger" onClick={() => { const action = pending.action; post("discard-draft"); dirty.current = false; setPending(null); action(); }}>放弃更改并继续</Button>}
          <Button variant="primary" onClick={keepEditing}>返回工作室</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Context.Provider>;
}

export function useKolStudio() {
  const context = React.useContext(Context);
  if (!context) throw new Error("useKolStudio must be used within KolStudioProvider");
  return context;
}
