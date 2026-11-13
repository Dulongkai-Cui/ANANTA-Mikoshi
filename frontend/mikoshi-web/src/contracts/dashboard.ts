/**
 * DashboardRepository 合同（SPEC §6、FE-25/27/33 布局存储）。
 * 只保存布局配置，不保存业务数据副本。revision 用于演示级陈旧版本检测。
 */

export const DASHBOARD_SCHEMA_VERSION = 1;

export const WIDGET_TYPES = ["business-overview", "my-todos", "recent-work", "agent-activity"] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export const WIDGET_SIZES = ["standard", "wide"] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export interface WidgetInstance {
  /** 稳定实例 ID */
  id: string;
  type: WidgetType;
  size: WidgetSize;
  /** 从 0 开始的连续顺序；DOM 与键盘顺序与之相同 */
  order: number;
}

export interface DashboardLayout {
  schemaVersion: typeof DASHBOARD_SCHEMA_VERSION;
  userId: string;
  /** 已保存版本号；从未保存为 0 */
  revision: number;
  widgets: WidgetInstance[];
}

/**
 * 保存时携带的期望版本：读取时的 revision；
 * 若读取时原数据已损坏，传 "corrupted"，保存即由用户主动覆盖。
 */
export type ExpectedRevision = number | "corrupted";

export type LayoutCorruption = "unparseable" | "schema_version" | "user_mismatch" | "invalid_shape" | "unknown_type" | "duplicate";

export type LoadResult =
  | { status: "ok"; layout: DashboardLayout; source: "saved" | "default" }
  /** 原数据保持不动；界面用默认布局展示，用户保存时才覆盖 */
  | { status: "corrupted"; reason: LayoutCorruption; fallback: DashboardLayout }
  | { status: "unavailable"; fallback: DashboardLayout };

export type SaveError =
  | { code: "conflict"; currentRevision: ExpectedRevision }
  | { code: "storage_unavailable" }
  | { code: "quota_exceeded" }
  | { code: "write_failed" }
  | { code: "invalid_layout" };

export type SaveResult = { ok: true; layout: DashboardLayout } | { ok: false; error: SaveError };

export interface DashboardRepository {
  load(userId: string): Promise<LoadResult>;
  save(input: { userId: string; widgets: WidgetInstance[]; expectedRevision: ExpectedRevision }): Promise<SaveResult>;
}
