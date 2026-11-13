import { LEGACY_MODULES, isLegacyPage, type LegacyModuleId } from "./modules";

export type LegacyPages = Record<LegacyModuleId, string>;
export const DEFAULT_LEGACY_PAGES: LegacyPages = { kol: "home", thirdparty: "home" };

export function legacyMemoryKey(userId: string) {
  return `mikoshi.legacy-pages.v2:${userId}`;
}

export function decodeLegacyMemory(raw: string | null): LegacyPages {
  const result = { ...DEFAULT_LEGACY_PAGES };
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return result;
    for (const id of Object.keys(result) as LegacyModuleId[]) {
      const page = (value as Record<string, unknown>)[id];
      if (isLegacyPage(LEGACY_MODULES[id], page)) result[id] = page;
    }
  } catch { /* Malformed memory has no effect on page availability. */ }
  return result;
}

export function legacyPageFromHash(module: LegacyModuleId, hash: string): string | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  return isLegacyPage(LEGACY_MODULES[module], value) ? value : null;
}

export function legacyHref(module: LegacyModuleId, page: string) {
  return `${LEGACY_MODULES[module].path}#${isLegacyPage(LEGACY_MODULES[module], page) ? page : "home"}`;
}

export function isLegacyModule(value: unknown): value is LegacyModuleId {
  return value === "kol" || value === "thirdparty";
}
