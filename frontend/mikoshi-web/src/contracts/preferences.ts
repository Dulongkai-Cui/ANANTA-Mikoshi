/**
 * 本地偏好合同（SPEC §5.2、FE-17/43）。
 * 主题与减少动效相互独立；产品设置只能“进一步减少”，不能覆盖系统的减少动态。
 */

export const PREFERENCES_VERSION = 1;

export type ThemePreference = "system" | "light" | "dark";
export type MotionPreference = "system" | "reduce";

export interface Preferences {
  version: typeof PREFERENCES_VERSION;
  theme: ThemePreference;
  motion: MotionPreference;
  sidebarCollapsed: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  version: PREFERENCES_VERSION,
  theme: "system",
  motion: "system",
  sidebarCollapsed: false,
};

export type PreferencesLoad =
  | { status: "ok"; preferences: Preferences; source: "saved" | "default" }
  | { status: "corrupted"; preferences: Preferences }
  | { status: "unavailable"; preferences: Preferences };

export type PreferencesSave = { ok: true } | { ok: false; error: "storage_unavailable" | "quota_exceeded" | "write_failed" };

export interface PreferencesStore {
  load(): PreferencesLoad;
  save(preferences: Preferences): PreferencesSave;
}
