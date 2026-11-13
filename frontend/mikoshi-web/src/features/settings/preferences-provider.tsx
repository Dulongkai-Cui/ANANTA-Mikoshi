"use client";

import * as React from "react";

import { preferencesStore } from "@/adapters";
import { PREFERENCES_KEY } from "@/adapters/demo/preferences";
import {
  DEFAULT_PREFERENCES,
  type MotionPreference,
  type Preferences,
  type ThemePreference,
} from "@/contracts/preferences";

/**
 * 持久化状态：
 * - persisted：已写入本浏览器
 * - session-only：存储不可用/写入失败，本次页面会话有效（SPEC §5.2）
 * - recovered：原记录损坏，已改用默认值；用户下一次修改时才覆盖
 */
export type PersistenceStatus = "persisted" | "session-only" | "recovered";

interface PreferencesContextValue {
  ready: boolean;
  preferences: Preferences;
  persistence: PersistenceStatus;
  /** 系统是否要求减少动态（只读；产品设置无法覆盖） */
  systemReducedMotion: boolean;
  /** 系统当前为深色 */
  systemDark: boolean;
  setTheme(theme: ThemePreference): PersistenceStatus;
  setMotion(motion: MotionPreference): PersistenceStatus;
  setSidebarCollapsed(collapsed: boolean): PersistenceStatus;
}

const PreferencesContext = React.createContext<PreferencesContextValue | null>(null);

/** 在首帧绘制前应用已保存的主题/动效/侧栏偏好，避免错误主题闪烁（FE-17）。 */
export const PREFERENCES_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_KEY,
)})||"null");if(p&&p.version===1){if(p.theme==="light"||p.theme==="dark")d.setAttribute("data-theme",p.theme);if(p.motion==="reduce")d.setAttribute("data-motion","reduce");if(p.sidebarCollapsed===true)d.setAttribute("data-sidebar","collapsed");}}catch(e){}})();`;

function applyToDocument(p: Preferences) {
  const root = document.documentElement;
  if (p.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", p.theme);
  if (p.motion === "reduce") root.setAttribute("data-motion", "reduce");
  else root.removeAttribute("data-motion");
  if (p.sidebarCollapsed) root.setAttribute("data-sidebar", "collapsed");
  else root.removeAttribute("data-sidebar");
}

function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [preferences, setPreferences] = React.useState<Preferences>(DEFAULT_PREFERENCES);
  const currentPreferences = React.useRef(DEFAULT_PREFERENCES);
  const [persistence, setPersistence] = React.useState<PersistenceStatus>("persisted");
  const systemReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");

  React.useEffect(() => {
    const result = preferencesStore.load();
    currentPreferences.current = result.preferences;
    /* eslint-disable react-hooks/set-state-in-effect -- 首次挂载时从外部存储同步一次 */
    setPreferences(result.preferences);
    setPersistence(result.status === "ok" ? "persisted" : result.status === "corrupted" ? "recovered" : "session-only");
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    applyToDocument(result.preferences);
  }, []);

  const update = React.useCallback((patch: Partial<Preferences>) => {
    const next = { ...currentPreferences.current, ...patch };
    currentPreferences.current = next;
    applyToDocument(next);
    const saved = preferencesStore.save(next);
    const status: PersistenceStatus = saved.ok ? "persisted" : "session-only";
    setPreferences(next);
    setPersistence(status);
    return status;
  }, []);

  const value = React.useMemo<PreferencesContextValue>(
    () => ({
      ready,
      preferences,
      persistence,
      systemReducedMotion,
      systemDark,
      setTheme: (theme) => update({ theme }),
      setMotion: (motion) => update({ motion }),
      setSidebarCollapsed: (sidebarCollapsed) => update({ sidebarCollapsed }),
    }),
    [ready, preferences, persistence, systemReducedMotion, systemDark, update],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = React.useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
