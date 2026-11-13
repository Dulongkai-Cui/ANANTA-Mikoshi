import { addCalendarDays, parseCalendarDate, shanghaiToday } from "@/lib/calendar-dates";

export const STATUS = { todo: "待办", doing: "进行中", done: "已完成", blocked: "阻塞" } as const;
export const PRIORITY = { P0: "高优先级", P1: "中优先级", P2: "低优先级" } as const;
export const SECTIONS = { charts: "任务分布与负载", deliveries: "近期交付事项", milestones: "项目里程碑", activity: "最近动态" } as const;
export type Status = keyof typeof STATUS;
export const DEFAULT_LINE = "default";
export interface Meta { id: string; createdAt: string; updatedAt: string }
export interface TaskNode { title: string; date: string; done: boolean }
export interface TaskInput { title: string; module: string; owner: string; description: string; status: Status; priority: keyof typeof PRIORITY; start: string; end: string; progress: number; nodes: TaskNode[] }
export interface Task extends TaskInput, Meta {}
export interface EventInput { title: string; date: string; lineId: string; description: string }
export interface ProjectEvent extends EventInput, Meta {}
export interface LineInput { title: string; description: string }
export interface EventLine extends LineInput, Meta {}
export interface Settings { name: string; members: string[]; modules: string[]; sections: (keyof typeof SECTIONS)[] }
export interface Activity { id: string; at: string; actor: string; action: string; title: string }
export interface WorkbenchStore { schema: 1; revision: string | null; settings: Settings; tasks: Task[]; lines: EventLine[]; events: ProjectEvent[]; activities: Activity[] }
export type Kind = "task" | "event" | "line" | "settings";
export type Value = TaskInput | EventInput | LineInput | Settings;
export interface Editor { kind: Kind; value: Value; id?: string; revision: string | null; initial: string; origin: string }
export type Result = { ok: true; data?: WorkbenchStore } | { ok: false; error: string };
export const emptyStore = (): WorkbenchStore => ({ schema: 1, revision: null, settings: { name: "无限大营销项目", members: [], modules: ["三方号", "KOL"], sections: Object.keys(SECTIONS) as Settings["sections"] }, tasks: [], lines: [], events: [], activities: [] });
export const emptyTask = (): TaskInput => ({ title: "", module: "", owner: "", description: "", status: "todo", priority: "P1", start: shanghaiToday(), end: addCalendarDays(shanghaiToday(), 7), progress: 0, nodes: [] });
export const daysBetween = (a: string, b: string) => Math.round((+parseCalendarDate(a) - +parseCalendarDate(b)) / 86400000);
export function validDate(value: unknown): value is string { if (typeof value !== "string" || value < "2000-01-01" || value > "2100-12-31") return false; try { parseCalendarDate(value); return true; } catch { return false; } }
export const linesFor = (s: WorkbenchStore): EventLine[] => [{ id: DEFAULT_LINE, title: "重要发布与交付", description: "总体营销节奏", createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z" }, ...s.lines].filter((l, i, all) => i !== 0 || !all.slice(1).some(x => x.id === DEFAULT_LINE));
export const membersFor = (s: WorkbenchStore) => [...new Set([...s.settings.members, ...s.tasks.map(t => t.owner)])];
export const modulesFor = (s: WorkbenchStore) => [...new Set([...s.settings.modules, ...s.tasks.map(t => t.module)])];
export const isLate = (t: Task, today = shanghaiToday()) => t.status !== "done" && t.end < today;
export function transitionTask(t: Task, status: Status): Task { return { ...t, status, progress: status === "done" ? 100 : status === "todo" || t.status === "done" ? 0 : t.progress }; }
export function taskStats(tasks: Task[], today = shanghaiToday()) { const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, tasks.filter(t => t.status === k).length])) as Record<Status, number>; return { counts, total: tasks.length, late: tasks.filter(t => isLate(t, today)).length, rate: tasks.length ? Math.round(counts.done / tasks.length * 100) : null }; }
export interface Filter { module: string; owner: string; priority: string; search: string }
export const emptyFilter = (): Filter => ({ module: "", owner: "", priority: "", search: "" });
export function filterTasks(s: WorkbenchStore, f: Filter) { return s.tasks.filter(t => (!f.module || t.module === f.module) && (!f.owner || t.owner === f.owner) && (!f.priority || t.priority === f.priority) && (!f.search || [t.title, t.description, t.owner, t.module].join(" ").toLocaleLowerCase().includes(f.search.toLocaleLowerCase()))).sort((a, b) => Number(isLate(b)) - Number(isLate(a)) || a.priority.localeCompare(b.priority) || a.end.localeCompare(b.end)); }
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const txt = (v: unknown, max: number, required = false) => typeof v === "string" && v.length <= max && (!required || Boolean(v.trim()));
const texts = (v: unknown, max = 100) => Array.isArray(v) && v.length <= max && v.every(x => txt(x, 80, true)) && new Set(v).size === v.length;
export function validation(kind: Kind, value: unknown, store: WorkbenchStore): string | null {
  if (!object(value)) return "资料格式无效。";
  if (kind === "settings") {
    if (!txt(value.name, 160, true) || !texts(value.members) || !texts(value.modules)) return "项目名称必填，成员和模块各不超过100个、每项不超过80字且不能重复。";
    if (!Array.isArray(value.sections) || value.sections.length > 4 || new Set(value.sections).size !== value.sections.length || !value.sections.every(x => typeof x === "string" && Object.hasOwn(SECTIONS, x))) return "首页布局格式无效。";
    return null;
  }
  if (!txt(value.title, 160, true) || !txt(value.description, 4000)) return "请填写名称（最多160字），说明最多4000字。";
  if (kind === "task") {
    if (!txt(value.module, 80, true) || !txt(value.owner, 80, true)) return "请填写任务模块和负责人（最多80字）。";
    if (typeof value.status !== "string" || !Object.hasOwn(STATUS, value.status) || typeof value.priority !== "string" || !Object.hasOwn(PRIORITY, value.priority)) return "任务状态或优先级无效。";
    if (!validDate(value.start) || !validDate(value.end) || value.end < value.start) return "请填写有效起止日期（2000–2100年），截止不能早于开始。";
    if (typeof value.progress !== "number" || !Number.isInteger(value.progress) || value.progress < 0 || value.progress > 100 || (value.status === "done" && value.progress !== 100) || (value.status === "todo" && value.progress !== 0)) return "进度应为0–100整数；待办为0，已完成为100。";
    if (!Array.isArray(value.nodes) || value.nodes.length > 20 || value.nodes.some(n => !object(n) || !txt(n.title, 160, true) || !validDate(n.date) || n.date < (value.start as string) || n.date > (value.end as string) || typeof n.done !== "boolean")) return "最多20个任务节点，名称和日期必填，日期须在任务起止范围内。";
  }
  if (kind === "event" && (!validDate(value.date) || !linesFor(store).some(l => l.id === value.lineId))) return "请填写有效节点日期并选择事件线。";
  return null;
}
export function storeError(v: unknown): string | null {
  if (!object(v) || v.schema !== 1 || !(v.revision === null || txt(v.revision, 120, true)) || !Array.isArray(v.tasks) || !Array.isArray(v.events) || !Array.isArray(v.lines) || !Array.isArray(v.activities)) return "资料格式或版本不支持。";
  const s = v as unknown as WorkbenchStore;
  if (validation("settings", s.settings, s)) return "项目设置无效。";
  for (const [kind, items] of [["task", s.tasks], ["line", s.lines], ["event", s.events]] as const) {
    if (items.length > 5000 || new Set(items.map(i => i?.id)).size !== items.length) return "记录过多或标识重复。";
    for (const i of items) if (!object(i) || !txt(i.id, 120, true) || !txt(i.createdAt, 60, true) || !Number.isFinite(Date.parse(i.createdAt)) || !txt(i.updatedAt, 60, true) || !Number.isFinite(Date.parse(i.updatedAt)) || validation(kind, i, s)) return "记录内容校验失败。";
  }
  if (s.activities.length > 40 || s.activities.some(a => !object(a) || !txt(a.id, 120, true) || !txt(a.at, 60, true) || !Number.isFinite(Date.parse(a.at)) || !txt(a.actor, 80, true) || !txt(a.action, 80, true) || !txt(a.title, 160, true))) return "动态记录无效。";
  return null;
}
export function reminders(s: WorkbenchStore, today = shanghaiToday()) {
  return [...s.tasks.filter(t => t.status !== "done").flatMap(t => [ ...(daysBetween(t.end, today) <= 7 ? [{ kind: "task" as const, id: t.id, title: t.title, date: t.end, detail: `${t.owner} · 任务截止` }] : []), ...t.nodes.filter(n => !n.done && daysBetween(n.date, today) <= 3).map(n => ({ kind: "task" as const, id: t.id, title: n.title, date: n.date, detail: t.title })) ]), ...s.events.filter(e => Math.abs(daysBetween(e.date, today)) <= 3).map(e => ({ kind: "event" as const, id: e.id, title: e.title, date: e.date, detail: "项目关键节点" }))].sort((a, b) => a.date.localeCompare(b.date));
}
