import { STATUS, DEFAULT_LINE, emptyStore, storeError, type WorkbenchStore, type Task } from "./model";
export const BACKUP_FORMAT = "mikoshi-workbench-v1";
export function csvCell(v: unknown) { let s = String(v ?? ""); if (/^[\s]*[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`; }
export const csv = (rows: unknown[][]) => "\uFEFF" + rows.map(r => r.map(csvCell).join(",")).join("\r\n");
export const taskRows = (tasks: Task[]) => [["任务", "模块", "负责人", "状态", "优先级", "开始", "截止", "手工进度%", "说明", "任务节点"], ...tasks.map(t => [t.title, t.module, t.owner, STATUS[t.status], t.priority, t.start, t.end, t.progress, t.description, t.nodes.map(n => `${n.date} ${n.title} ${n.done ? "已完成" : "待完成"}`).join("；")])];
export function parseBackup(raw: string): WorkbenchStore {
  if (new Blob([raw]).size > 2000000) throw new Error("备份不得超过2MB。");
  let b: { format?: string; data?: unknown }; try { b = JSON.parse(raw); } catch { throw new Error("JSON格式无效。"); }
  if (b?.format !== BACKUP_FORMAT || storeError(b.data)) throw new Error("仅支持有效的 Mikoshi 工作台备份，原型 cedian-v1 需单独映射后导入。");
  const s = b.data as WorkbenchStore;
  if (s.tasks.length + s.events.length + s.lines.length > 300) throw new Error("单次最多追加300条任务、事件线和节点。");
  return s;
}
export function appendBackup(current: WorkbenchStore, incoming: WorkbenchStore, id = () => crypto.randomUUID(), now = new Date().toISOString()): WorkbenchStore {
  const ids = new Map(incoming.lines.map(l => [l.id, id()]));
  const meta = () => ({ id: id(), createdAt: now, updatedAt: now });
  return { ...current, tasks: [...current.tasks, ...incoming.tasks.map(t => ({ ...t, ...meta() }))], lines: [...current.lines, ...incoming.lines.map(l => ({ ...l, ...meta(), id: ids.get(l.id)! }))], events: [...current.events, ...incoming.events.map(e => ({ ...e, ...meta(), lineId: ids.get(e.lineId) ?? DEFAULT_LINE }))] };
}
export function download(content: string, filename: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function demoStore(today: string): WorkbenchStore {
  // Explicit, memory-only illustration. Never passed to the repository by the provider.
  const s = emptyStore(); s.settings = { ...s.settings, name: "无限大营销项目 · 示例", members: ["林晓", "陈予", "周宁", "许言"] };
  const day = (n: number) => { const d = new Date(today + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const titles = ["首批达人名单筛选与确认", "品牌主视觉与延展设计", "新品短视频脚本定稿", "KOL Brief 与产品寄送", "社媒首发内容排期", "媒体合作资源确认", "达人内容初稿审阅", "活动落地页内容准备", "全渠道内容发布核对", "营销目标与受众洞察", "产品卖点与内容素材库", "首轮渠道策略确认"];
  s.tasks = titles.map((title, i) => ({ id: `demo-${i}`, createdAt: `${today}T00:00:00Z`, updatedAt: `${today}T00:00:00Z`, title, owner: s.settings.members[i % 4]!, module: s.settings.modules[i % s.settings.modules.length]!, description: "示例任务，用于展示分工、进展与交付节点。", status: i > 8 ? "done" : i === 5 ? "blocked" : i % 2 ? "todo" : "doing", priority: i % 3 === 0 ? "P0" : i % 3 === 1 ? "P1" : "P2", start: day(-8 + i), end: day(i - 2), progress: i > 8 ? 100 : i === 5 ? 20 : i % 2 ? 0 : 60, nodes: [] }));
  s.lines = ["营销外放素材", "线下活动事件"].map((title, i) => ({ id: `demo-line-${i}`, title, description: "示例事件线", createdAt: `${today}T00:00:00Z`, updatedAt: `${today}T00:00:00Z` }));
  s.events = ["品牌 PV 正式发布", "独家对谈视频", "UP 主线下联动", "全渠道首发"].map((title, i) => ({ id: `demo-event-${i}`, title, date: day(i * 3 + 2), lineId: i === 2 ? "demo-line-1" : "demo-line-0", description: "示例关键节点，不代表正式排期。", createdAt: `${today}T00:00:00Z`, updatedAt: `${today}T00:00:00Z` }));
  return s;
}

