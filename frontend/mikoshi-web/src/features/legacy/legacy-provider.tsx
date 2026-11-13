"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { assetPath } from "@/lib/asset-path";

import { useGuardedNavigate } from "@/components/shell/use-guarded-navigate";
import { useCurrentUser } from "@/features/auth/session-provider";
import { usePreferences } from "@/features/settings/preferences-provider";

import { LEGACY_MODULES, isLegacyPage, type LegacyModuleId } from "./modules";
import { DEFAULT_LEGACY_PAGES, decodeLegacyMemory, isLegacyModule, legacyHref, legacyMemoryKey, legacyPageFromHash, type LegacyPages } from "./navigation";

const CHANNEL = "mikoshi-legacy-v1";
export type FrameStatus = "idle" | "loading" | "ready" | "error";
interface LegacyContextValue {
  pages: LegacyPages;
  status: Record<LegacyModuleId, FrameStatus>;
  go(mod: LegacyModuleId, page: string, after?: () => void): void;
  registerFrame(mod: LegacyModuleId, frame: HTMLIFrameElement | null): void;
  retry(mod: LegacyModuleId): void;
  generation: Record<LegacyModuleId, number>;
  markLoading(mod: LegacyModuleId): void;
}
const LegacyContext = React.createContext<LegacyContextValue | null>(null);

/** The host owns navigation/history; retained frames own their current filters/scroll. */
export function LegacyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { navigate } = useGuardedNavigate();
  const { preferences, systemDark, systemReducedMotion } = usePreferences();
  const [pages, setPages] = React.useState<LegacyPages>(DEFAULT_LEGACY_PAGES);
  const [status, setStatus] = React.useState<Record<LegacyModuleId, FrameStatus>>({ kol: "idle", thirdparty: "idle" });
  const [generation, setGeneration] = React.useState<Record<LegacyModuleId, number>>({ kol: 0, thirdparty: 0 });
  const frames = React.useRef<Partial<Record<LegacyModuleId, HTMLIFrameElement>>>({});
  const ready = React.useRef<Record<LegacyModuleId, boolean>>({ kol: false, thirdparty: false });
  const pending = React.useRef<Partial<Record<LegacyModuleId, string>>>({});
  const initialized = React.useRef(false);
  const pagesRef = React.useRef<LegacyPages>(DEFAULT_LEGACY_PAGES);
  const environmentRef = React.useRef<() => void>(() => {});

  const setPage = React.useCallback((mod: LegacyModuleId, page: string) => {
    const next = { ...pagesRef.current, [mod]: page };
    pagesRef.current = next;
    setPages(next);
    try { sessionStorage.setItem(legacyMemoryKey(user.id), JSON.stringify(next)); } catch { /* Memory-only is still usable. */ }
  }, [user.id]);

  const syncHash = React.useCallback((mod: LegacyModuleId, page: string, push: boolean) => {
    if (window.location.pathname !== assetPath(LEGACY_MODULES[mod].path)) return;
    const target = assetPath(legacyHref(mod, page));
    if (window.location.pathname + window.location.hash === target) return;
    if (push) window.history.pushState(window.history.state, "", target);
    else window.history.replaceState(window.history.state, "", target);
  }, []);

  const post = React.useCallback((mod: LegacyModuleId, page: string) => {
    pending.current[mod] = page;
    const frame = frames.current[mod];
    if (frame?.contentWindow && ready.current[mod]) {
      frame.contentWindow.postMessage({ channel: CHANNEL, module: mod, type: "navigate", page }, window.location.origin);
    }
  }, []);

  React.useEffect(() => {
    const applyEnvironment = () => {
      const computed = window.getComputedStyle(document.documentElement);
      const theme = preferences.theme === "system" ? systemDark ? "dark" : "light" : preferences.theme;
      for (const id of ["kol", "thirdparty"] as const) {
        if (!ready.current[id]) continue;
        frames.current[id]?.contentWindow?.postMessage({
          channel: CHANNEL, module: id, type: "environment", theme,
          motion: systemReducedMotion || preferences.motion === "reduce" ? "reduce" : "auto",
          fontSize: parseFloat(computed.fontSize), letterSpacing: computed.letterSpacing, wordSpacing: computed.wordSpacing,
        }, window.location.origin);
      }
    };
    environmentRef.current = applyEnvironment;
    applyEnvironment();
    const observer = new MutationObserver(applyEnvironment);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-theme", "data-motion"] });
    // User accessibility stylesheets can alter computed text sizing without a root attribute change.
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", applyEnvironment);
    return () => { observer.disconnect(); window.removeEventListener("resize", applyEnvironment); };
  }, [preferences.theme, preferences.motion, systemDark, systemReducedMotion]);

  React.useEffect(() => {
    const applyLocation = () => {
      if (!initialized.current) {
        let memory = { ...DEFAULT_LEGACY_PAGES };
        try { memory = decodeLegacyMemory(sessionStorage.getItem(legacyMemoryKey(user.id))); } catch { /* Use defaults. */ }
        pagesRef.current = memory;
        setPages(memory);
        initialized.current = true;
      }
      // popstate can fire before React has committed the new pathname.
      const mod = Object.values(LEGACY_MODULES).find((item) => assetPath(item.path) === window.location.pathname);
      if (!mod) return;
      const page = legacyPageFromHash(mod.id, window.location.hash) ?? (window.location.hash ? "home" : pagesRef.current[mod.id]);
      setPage(mod.id, page);
      syncHash(mod.id, page, false);
      post(mod.id, page);
    };
    applyLocation();
    window.addEventListener("hashchange", applyLocation);
    window.addEventListener("popstate", applyLocation);
    return () => { window.removeEventListener("hashchange", applyLocation); window.removeEventListener("popstate", applyLocation); };
  }, [pathname, user.id, setPage, syncHash, post]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message: unknown = event.data;
      if (typeof message !== "object" || message === null) return;
      const m = message as Record<string, unknown>;
      if (m.channel !== CHANNEL || !isLegacyModule(m.module)) return;
      const mod = m.module;
      if (event.source !== frames.current[mod]?.contentWindow) return;
      if (m.type === "error") {
        ready.current[mod] = false;
        setStatus((previous) => ({ ...previous, [mod]: "error" }));
        return;
      }
      if (m.type !== "state" || !isLegacyPage(LEGACY_MODULES[mod], m.page)) return;
      const first = !ready.current[mod];
      if (first) {
        ready.current[mod] = true;
        setStatus((previous) => ({ ...previous, [mod]: "ready" }));
        environmentRef.current();
      }
      const wanted = pending.current[mod] ?? (first ? pagesRef.current[mod] : null);
      if (wanted && m.page !== wanted) { post(mod, wanted); return; }
      delete pending.current[mod];
      const changed = pagesRef.current[mod] !== m.page;
      if (changed) setPage(mod, m.page);
      syncHash(mod, m.page, !first && changed);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post, setPage, syncHash]);

  const go = React.useCallback<LegacyContextValue["go"]>((mod, page, after) => {
    if (!isLegacyPage(LEGACY_MODULES[mod], page)) return;
    const commit = () => { setPage(mod, page); post(mod, page); after?.(); };
    if (window.location.pathname === assetPath(LEGACY_MODULES[mod].path)) {
      syncHash(mod, page, true);
      commit();
    } else {
      // The callback runs only after the unsaved dashboard guard allows navigation.
      navigate(legacyHref(mod, page), commit);
    }
  }, [navigate, post, setPage, syncHash]);

  const registerFrame = React.useCallback((mod: LegacyModuleId, frame: HTMLIFrameElement | null) => {
    if (frame) frames.current[mod] = frame;
    else { delete frames.current[mod]; ready.current[mod] = false; }
  }, []);
  const markLoading = React.useCallback((mod: LegacyModuleId) => {
    ready.current[mod] = false;
    setStatus((previous) => previous[mod] === "loading" ? previous : { ...previous, [mod]: "loading" });
  }, []);
  React.useEffect(() => {
    const timers = (["kol", "thirdparty"] as const).filter((id) => status[id] === "loading").map((id) => window.setTimeout(() => {
      if (!ready.current[id]) setStatus((previous) => ({ ...previous, [id]: "error" }));
    }, 45_000));
    return () => timers.forEach(window.clearTimeout);
  }, [status]);
  const retry = React.useCallback((mod: LegacyModuleId) => {
    ready.current[mod] = false;
    setGeneration((previous) => ({ ...previous, [mod]: previous[mod] + 1 }));
    setStatus((previous) => ({ ...previous, [mod]: "loading" }));
  }, []);
  const value = React.useMemo(() => ({ pages, status, go, registerFrame, retry, generation, markLoading }), [pages, status, go, registerFrame, retry, generation, markLoading]);
  return <LegacyContext.Provider value={value}>{children}</LegacyContext.Provider>;
}

export function useLegacy(): LegacyContextValue {
  const value = React.useContext(LegacyContext);
  if (!value) throw new Error("useLegacy must be used within LegacyProvider");
  return value;
}
