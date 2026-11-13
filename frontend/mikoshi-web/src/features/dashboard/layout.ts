/**
 * 首页布局的纯函数：默认布局、schema 校验与编辑操作。
 * 不触碰存储，便于单元测试；DashboardRepository 与编辑状态都复用这里。
 */
import {
  DASHBOARD_SCHEMA_VERSION,
  WIDGET_SIZES,
  WIDGET_TYPES,
  type DashboardLayout,
  type LayoutCorruption,
  type WidgetInstance,
  type WidgetSize,
  type WidgetType,
} from "@/contracts/dashboard";
import { isRecord } from "@/lib/storage";

/** 默认四张卡片；业务概览为宽卡 */
const DEFAULT_WIDGETS: ReadonlyArray<Pick<WidgetInstance, "type" | "size">> = [
  { type: "business-overview", size: "wide" },
  { type: "my-todos", size: "standard" },
  { type: "recent-work", size: "standard" },
  { type: "agent-activity", size: "wide" },
];

/** 每类卡片最多一个实例，所以实例 ID 由类型派生即可保持稳定 */
export function instanceIdFor(type: WidgetType): string {
  return `w-${type}`;
}

export function defaultWidgets(): WidgetInstance[] {
  return DEFAULT_WIDGETS.map((w, order) => ({ id: instanceIdFor(w.type), type: w.type, size: w.size, order }));
}

export function defaultLayout(userId: string, revision = 0): DashboardLayout {
  return { schemaVersion: DASHBOARD_SCHEMA_VERSION, userId, revision, widgets: defaultWidgets() };
}

const isWidgetType = (v: unknown): v is WidgetType => typeof v === "string" && (WIDGET_TYPES as readonly string[]).includes(v);
const isWidgetSize = (v: unknown): v is WidgetSize => typeof v === "string" && (WIDGET_SIZES as readonly string[]).includes(v);

export type ValidationResult = { ok: true; layout: DashboardLayout } | { ok: false; reason: LayoutCorruption };

/** 校验已解析的存储数据。任何不合规都返回原因，不做静默修补。 */
export function validateLayout(raw: unknown, expectedUserId: string): ValidationResult {
  if (!isRecord(raw)) return { ok: false, reason: "invalid_shape" };
  if (raw.schemaVersion !== DASHBOARD_SCHEMA_VERSION) return { ok: false, reason: "schema_version" };
  if (raw.userId !== expectedUserId) return { ok: false, reason: "user_mismatch" };
  if (typeof raw.revision !== "number" || !Number.isSafeInteger(raw.revision) || raw.revision < 0) {
    return { ok: false, reason: "invalid_shape" };
  }
  if (!Array.isArray(raw.widgets)) return { ok: false, reason: "invalid_shape" };

  const result = validateWidgets(raw.widgets);
  if (!result.ok) return result;
  return {
    ok: true,
    layout: { schemaVersion: DASHBOARD_SCHEMA_VERSION, userId: expectedUserId, revision: raw.revision, widgets: result.widgets },
  };
}

export function validateWidgets(list: unknown[]): { ok: true; widgets: WidgetInstance[] } | { ok: false; reason: LayoutCorruption } {
  const ids = new Set<string>();
  const types = new Set<string>();
  const orders = new Set<number>();
  const widgets: WidgetInstance[] = [];
  for (const item of list) {
    if (!isRecord(item)) return { ok: false, reason: "invalid_shape" };
    if (!isWidgetType(item.type)) return { ok: false, reason: "unknown_type" };
    if (typeof item.id !== "string" || item.id.length === 0 || item.id.length > 64) return { ok: false, reason: "invalid_shape" };
    if (!isWidgetSize(item.size)) return { ok: false, reason: "invalid_shape" };
    if (typeof item.order !== "number" || !Number.isSafeInteger(item.order) || item.order < 0 || item.order >= list.length || orders.has(item.order)) {
      return { ok: false, reason: "invalid_shape" };
    }
    if (ids.has(item.id) || types.has(item.type)) return { ok: false, reason: "duplicate" };
    ids.add(item.id);
    types.add(item.type);
    orders.add(item.order);
    widgets.push({ id: item.id, type: item.type, size: item.size, order: item.order });
  }
  return { ok: true, widgets: normalizeOrder(widgets) };
}

/** 按 order 排序并重编为 0..n-1 */
export function normalizeOrder(widgets: readonly WidgetInstance[]): WidgetInstance[] {
  return [...widgets].sort((a, b) => a.order - b.order).map((w, order) => ({ ...w, order }));
}

// ---- 编辑操作（全部返回新数组） ----

export function availableTypes(widgets: readonly WidgetInstance[]): WidgetType[] {
  const used = new Set(widgets.map((w) => w.type));
  return WIDGET_TYPES.filter((t) => !used.has(t));
}

export function addWidget(widgets: readonly WidgetInstance[], type: WidgetType): WidgetInstance[] {
  if (widgets.some((w) => w.type === type)) return [...widgets];
  const preset = DEFAULT_WIDGETS.find((w) => w.type === type);
  return normalizeOrder([...widgets, { id: instanceIdFor(type), type, size: preset?.size ?? "standard", order: widgets.length }]);
}

export function removeWidget(widgets: readonly WidgetInstance[], id: string): WidgetInstance[] {
  return normalizeOrder(widgets.filter((w) => w.id !== id));
}

export function moveWidget(widgets: readonly WidgetInstance[], id: string, direction: -1 | 1): WidgetInstance[] {
  const list = normalizeOrder(widgets);
  const index = list.findIndex((w) => w.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  if (item) next.splice(target, 0, item);
  return next.map((w, order) => ({ ...w, order }));
}

export function setWidgetSize(widgets: readonly WidgetInstance[], id: string, size: WidgetSize): WidgetInstance[] {
  return widgets.map((w) => (w.id === id ? { ...w, size } : w));
}

export function sameWidgets(a: readonly WidgetInstance[], b: readonly WidgetInstance[]): boolean {
  const x = normalizeOrder(a);
  const y = normalizeOrder(b);
  if (x.length !== y.length) return false;
  return x.every((w, i) => {
    const o = y[i];
    return o !== undefined && w.id === o.id && w.type === o.type && w.size === o.size;
  });
}
