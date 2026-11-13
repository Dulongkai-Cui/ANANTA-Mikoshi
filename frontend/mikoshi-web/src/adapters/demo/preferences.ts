import {
  DEFAULT_PREFERENCES,
  PREFERENCES_VERSION,
  type MotionPreference,
  type Preferences,
  type PreferencesLoad,
  type PreferencesSave,
  type PreferencesStore,
  type ThemePreference,
} from "@/contracts/preferences";
import { isRecord, parseJson, readItem, writeItem } from "@/lib/storage";

/** 主题等外观偏好属于本浏览器（登录页也需要它），不随演示身份隔离。 */
export const PREFERENCES_KEY = "mikoshi.preferences";

const THEMES: readonly ThemePreference[] = ["system", "light", "dark"];
const MOTIONS: readonly MotionPreference[] = ["system", "reduce"];

export function parsePreferences(raw: unknown): Preferences | null {
  if (!isRecord(raw) || raw.version !== PREFERENCES_VERSION) return null;
  if (!THEMES.includes(raw.theme as ThemePreference)) return null;
  if (!MOTIONS.includes(raw.motion as MotionPreference)) return null;
  if (typeof raw.sidebarCollapsed !== "boolean") return null;
  return {
    version: PREFERENCES_VERSION,
    theme: raw.theme as ThemePreference,
    motion: raw.motion as MotionPreference,
    sidebarCollapsed: raw.sidebarCollapsed,
  };
}

export function createDemoPreferencesStore(): PreferencesStore {
  return {
    load(): PreferencesLoad {
      const read = readItem("local", PREFERENCES_KEY);
      if (!read.ok) return { status: "unavailable", preferences: DEFAULT_PREFERENCES };
      if (read.value === null) return { status: "ok", preferences: DEFAULT_PREFERENCES, source: "default" };
      const parsed = parsePreferences(parseJson(read.value));
      if (!parsed) return { status: "corrupted", preferences: DEFAULT_PREFERENCES };
      return { status: "ok", preferences: parsed, source: "saved" };
    },
    save(preferences): PreferencesSave {
      const written = writeItem("local", PREFERENCES_KEY, JSON.stringify(preferences));
      if (written.ok) return { ok: true };
      if (written.error === "quota") return { ok: false, error: "quota_exceeded" };
      if (written.error === "unavailable") return { ok: false, error: "storage_unavailable" };
      return { ok: false, error: "write_failed" };
    },
  };
}
