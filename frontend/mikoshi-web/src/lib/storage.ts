/**
 * Web Storage 的安全访问层。所有 adapter 通过这里读写，
 * 把“不可用 / 超额 / 其他写入失败”转成可辨识结果，不让异常冒到界面。
 */
export type StorageKind = "local" | "session";

export type StorageFailure = "unavailable" | "quota" | "write_failed";

export type ReadResult =
  | { ok: true; value: string | null }
  | { ok: false; error: "unavailable" };

export type WriteResult = { ok: true } | { ok: false; error: StorageFailure };

function getStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    // 访问 length 可在部分隐私模式下触发 SecurityError
    void storage.length;
    return storage;
  } catch {
    return null;
  }
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
}

export function readItem(kind: StorageKind, key: string): ReadResult {
  const storage = getStorage(kind);
  if (!storage) return { ok: false, error: "unavailable" };
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export function writeItem(kind: StorageKind, key: string, value: string): WriteResult {
  const storage = getStorage(kind);
  if (!storage) return { ok: false, error: "unavailable" };
  try {
    storage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) return { ok: false, error: "quota" };
    if (error instanceof DOMException && error.name === "SecurityError") {
      return { ok: false, error: "unavailable" };
    }
    return { ok: false, error: "write_failed" };
  }
}

export function removeItem(kind: StorageKind, key: string): WriteResult {
  const storage = getStorage(kind);
  if (!storage) return { ok: false, error: "unavailable" };
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, error: "write_failed" };
  }
}

/** 解析 JSON；失败返回 undefined（调用方区分“没有记录”与“已损坏”）。 */
export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
