import {
  DASHBOARD_SCHEMA_VERSION,
  type DashboardLayout,
  type DashboardRepository,
  type ExpectedRevision,
  type LayoutCorruption,
  type LoadResult,
  type SaveResult,
} from "@/contracts/dashboard";
import { defaultLayout, validateLayout, validateWidgets } from "@/features/dashboard/layout";
import { getDemoFaults, wait } from "@/lib/demo-faults";
import { parseJson, readItem, writeItem } from "@/lib/storage";

/** 每个演示身份独立的布局键，避免 A/B 串布局 */
export function layoutKey(userId: string): string {
  return `mikoshi.dashboard.v${DASHBOARD_SCHEMA_VERSION}.${userId}`;
}

type Current =
  | { kind: "missing" }
  | { kind: "ok"; layout: DashboardLayout }
  | { kind: "corrupted"; reason: LayoutCorruption }
  | { kind: "unavailable" };

function readCurrent(userId: string): Current {
  const read = readItem("local", layoutKey(userId));
  if (!read.ok) return { kind: "unavailable" };
  if (read.value === null) return { kind: "missing" };
  const parsed = parseJson(read.value);
  if (parsed === undefined) return { kind: "corrupted", reason: "unparseable" };
  const result = validateLayout(parsed, userId);
  return result.ok ? { kind: "ok", layout: result.layout } : { kind: "corrupted", reason: result.reason };
}

function revisionOf(current: Current): ExpectedRevision | null {
  if (current.kind === "missing") return 0;
  if (current.kind === "ok") return current.layout.revision;
  if (current.kind === "corrupted") return "corrupted";
  return null;
}

/**
 * localStorage 演示实现。读、比较、写不是原子操作：
 * 只承诺同身份两个实例的陈旧 revision 检测，不承诺跨标签并发写入安全（SPEC §6）。
 */
export function createDemoDashboardRepository(): DashboardRepository {
  return {
    async load(userId): Promise<LoadResult> {
      const current = readCurrent(userId);
      switch (current.kind) {
        case "missing":
          return { status: "ok", layout: defaultLayout(userId), source: "default" };
        case "ok":
          return { status: "ok", layout: current.layout, source: "saved" };
        case "corrupted":
          // 不覆盖原数据；只在用户主动保存时替换
          return { status: "corrupted", reason: current.reason, fallback: defaultLayout(userId) };
        case "unavailable":
          return { status: "unavailable", fallback: defaultLayout(userId) };
      }
    },

    async save({ userId, widgets, expectedRevision }): Promise<SaveResult> {
      await wait(getDemoFaults().layoutSaveDelayMs);

      const checked = validateWidgets(widgets);
      if (!checked.ok) return { ok: false, error: { code: "invalid_layout" } };

      const current = readCurrent(userId);
      const currentRevision = revisionOf(current);
      if (currentRevision === null) return { ok: false, error: { code: "storage_unavailable" } };
      if (currentRevision !== expectedRevision) {
        return { ok: false, error: { code: "conflict", currentRevision } };
      }

      const base = current.kind === "ok" ? current.layout.revision : 0;
      // 极端/损坏的版本值不能进入“递增后仍相同”的数值区间。
      if (base >= Number.MAX_SAFE_INTEGER) return { ok: false, error: { code: "invalid_layout" } };
      const next: DashboardLayout = {
        schemaVersion: DASHBOARD_SCHEMA_VERSION,
        userId,
        revision: base + 1,
        widgets: checked.widgets,
      };
      const written = writeItem("local", layoutKey(userId), JSON.stringify(next));
      if (!written.ok) {
        const code = written.error === "quota" ? "quota_exceeded" : written.error === "unavailable" ? "storage_unavailable" : "write_failed";
        return { ok: false, error: { code } };
      }
      return { ok: true, layout: next };
    },
  };
}
