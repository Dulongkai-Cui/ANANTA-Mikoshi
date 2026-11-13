/** KOL 管理资料；达人、合作和具体排期分别拥有稳定身份。效果数据不在此合同内。 */
export const PLATFORMS = ["B站", "抖音", "小红书", "微博", "YouTube", "其他"] as const;
export type Platform = typeof PLATFORMS[number];
export const SELECTIONS = { pending: "未判断", passed: "初筛通过", backup: "备用", rejected: "不采用" } as const;
export const TALENT_STATUSES = { active: "启用", archived: "已停用" } as const;
export const STAGES = { proposal: "待提案", communicating: "沟通中", confirming: "待确认", production: "制作中", review: "待审核", ready: "待发布", recap: "待复盘", completed: "已完成", cancelled: "已取消" } as const;
export const BOOKINGS = { none: "未询档", asking: "询档中", verbal: "口头预留", locked: "正式锁档" } as const;
export const CHOICES = { primary: "主推", backup: "备选" } as const;
export const SCHEDULE_STATUSES = { planned: "已计划", cancelled: "已取消", withdrawn: "已撤下" } as const;
export interface TalentInput {
  platform: Platform; externalId: string; name: string; profileUrl: string; category: string; tier: string; tags: string;
  supplier: string; contact: string; owner: string; selection: keyof typeof SELECTIONS; status: keyof typeof TALENT_STATUSES;
  followers: number | null; referencePrice: number | null; notes: string;
}
interface RecordMeta { id: string; createdAt: string; updatedAt: string }
export interface Talent extends TalentInput, RecordMeta {}
export interface CollaborationInput {
  talentId: string; title: string; wave: string; owner: string; supplier: string; choice: keyof typeof CHOICES;
  creative: string; sellingPoint: string; quote: number | null; quoteScope: string; booking: keyof typeof BOOKINGS;
  stage: keyof typeof STAGES; scriptDate: string; draftDate: string; deadline: string; productionCycle: string; latestOrderDate: string; nextStep: string; blocker: string; notes: string;
}
export interface Collaboration extends CollaborationInput, RecordMeta {}
export interface ScheduleInput {
  collaborationId: string; title: string; date: string; time: string; content: string; review: "pending" | "confirmed";
  status: keyof typeof SCHEDULE_STATUSES; notes: string;
}
export interface Schedule extends ScheduleInput, RecordMeta {}
export interface KolStore { schema: 1; revision: string | null; talents: Talent[]; collaborations: Collaboration[]; schedules: Schedule[] }
export const emptyStore = (): KolStore => ({ schema: 1, revision: null, talents: [], collaborations: [], schedules: [] });
export const emptyTalent = (): TalentInput => ({ platform: "B站", externalId: "", name: "", profileUrl: "", category: "", tier: "", tags: "", supplier: "", contact: "", owner: "", selection: "pending", status: "active", followers: null, referencePrice: null, notes: "" });
export const emptyCollaboration = (): CollaborationInput => ({ talentId: "", title: "", wave: "", owner: "", supplier: "", choice: "primary", creative: "", sellingPoint: "", quote: null, quoteScope: "", booking: "none", stage: "proposal", scriptDate: "", draftDate: "", deadline: "", productionCycle: "", latestOrderDate: "", nextStep: "", blocker: "", notes: "" });
export type FieldErrors = Record<string, string>;
export type SaveResult = { ok: true } | { ok: false; error: string; fields?: FieldErrors };
interface EditorMeta { id?: string; originPath: string; baseRevision: string | null; initial: string }
export type Editor = EditorMeta & ({ kind: "talent"; value: TalentInput } | { kind: "collaboration"; value: CollaborationInput } | { kind: "schedule"; value: ScheduleInput });
export function normalizeIdentity(platform: Platform, value: string): string {
  const trimmed = value.trim();
  return platform === "B站" ? trimmed.replace(/^0+(?=\d)/, "") : trimmed;
}
export function safeProfileUrl(value: string): boolean {
  if (!value) return true;
  try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password && Boolean(u.hostname); } catch { return false; }
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2000-01-01" || value > "2100-12-31") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
const numeric = (value: number | null, integer = false) => value === null || (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER && (!integer || Number.isInteger(value)));
function limits(input: object, fields: Record<string, number>, e: FieldErrors) {
  const values = input as Record<string, unknown>;
  for (const [key, max] of Object.entries(fields)) if (typeof values[key] !== "string" || (values[key] as string).length > max) e[key] = `请填写不超过 ${max} 字的内容。`;
}
export function validateTalent(input: TalentInput, store: KolStore, id?: string): FieldErrors {
  const e: FieldErrors = {};
  limits(input, { externalId: 80, name: 80, profileUrl: 500, category: 120, tier: 120, tags: 240, supplier: 120, contact: 120, owner: 120, notes: 2000 }, e);
  if (!PLATFORMS.includes(input.platform)) e.platform = "请选择平台。";
  const identity = normalizeIdentity(input.platform, input.externalId);
  if (!identity || /[\s\u0000-\u001f\u007f]/.test(identity) || (input.platform === "B站" && !/^[1-9]\d{0,19}$/.test(identity))) e.externalId = input.platform === "B站" ? "请填写 1–20 位有效 B站 UID。" : "请填写平台账号标识，不含空白或控制字符。";
  if (!input.name.trim()) e.name = "请填写达人昵称。";
  if (!safeProfileUrl(input.profileUrl.trim())) e.profileUrl = "请填写不含账号密码的 http(s) 主页链接。";
  if (!Object.hasOwn(SELECTIONS, input.selection)) e.selection = "初筛状态无效。";
  if (!Object.hasOwn(TALENT_STATUSES, input.status)) e.status = "达人状态无效。";
  if (!numeric(input.followers, true)) e.followers = "粉丝数应为非负整数；未知请留空。";
  if (!numeric(input.referencePrice)) e.referencePrice = "参考价应为非负金额；未知请留空。";
  if (store.talents.some(t => t.id !== id && t.platform === input.platform && t.externalId === identity)) e.externalId = "这个平台账号已经入库，请编辑已有资料。";
  const old = store.talents.find(t => t.id === id);
  if (old && (old.platform !== input.platform || old.externalId !== identity)) e.externalId = "已入库的平台和账号标识不可更换。";
  return e;
}
export function validateCollaboration(input: CollaborationInput, store: KolStore, id?: string): FieldErrors {
  const e: FieldErrors = {};
  limits(input, { talentId: 120, title: 160, wave: 120, owner: 120, supplier: 120, productionCycle: 120, creative: 2000, sellingPoint: 2000, quoteScope: 1000, nextStep: 1000, blocker: 1000, notes: 2000 }, e);
  const talent = store.talents.find(t => t.id === input.talentId);
  if (!talent) e.talentId = "请选择已入库达人。";
  else if (!id && talent.status !== "active") e.talentId = "达人已停用，不能新增合作。";
  const old = store.collaborations.find(c => c.id === id);
  if (old && old.talentId !== input.talentId) e.talentId = "已有合作的达人不能更换，请另建合作。";
  if (!input.title.trim()) e.title = "请填写主题或合作名称。";
  if (!Object.hasOwn(STAGES, input.stage)) e.stage = "合作阶段无效。";
  if (!Object.hasOwn(BOOKINGS, input.booking)) e.booking = "档期状态无效。";
  if (!Object.hasOwn(CHOICES, input.choice)) e.choice = "请选择主推或备选。";
  if (!numeric(input.quote)) e.quote = "合作报价应为非负金额；未知请留空。";
  for (const key of ["scriptDate", "draftDate", "deadline", "latestOrderDate"] as const) if (input[key] && !validDate(input[key])) e[key] = "请填写有效日期（2000–2100 年），或留空。";
  return e;
}
export function talentForSchedule(item: ScheduleInput, store: KolStore): Talent | undefined {
  const c = store.collaborations.find(c => c.id === item.collaborationId);
  return store.talents.find(t => t.id === c?.talentId);
}
export function validateSchedule(input: ScheduleInput, store: KolStore, id?: string): FieldErrors {
  const e: FieldErrors = {};
  limits(input, { collaborationId: 120, title: 160, content: 4000, notes: 2000 }, e);
  const c = store.collaborations.find(c => c.id === input.collaborationId), t = talentForSchedule(input, store);
  if (!c || !t) e.collaborationId = "请选择可用的达人合作。";
  else if (input.status === "planned" && (c.stage === "cancelled" || t.status !== "active")) e.collaborationId = "合作已取消或达人已停用，不能新建或恢复排期。";
  if (!input.title.trim()) e.title = "请填写排期标题。";
  if (!validDate(input.date)) e.date = "请选择有效日期（2000–2100 年）。";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) e.time = "请选择有效时间。";
  if (!Object.hasOwn(SCHEDULE_STATUSES, input.status)) e.status = "排期状态无效。";
  if (!["pending", "confirmed"].includes(input.review)) e.review = "确认状态无效。";
  if (t && input.status === "planned" && store.schedules.some(s => s.id !== id && s.status === "planned" && s.date === input.date && s.time === input.time && talentForSchedule(s, store)?.id === t.id)) e.time = "此达人在该时刻已有排期，请调整时间。";
  return e;
}
export function matchesStatus(item: Schedule, filter: string): boolean { return filter ? item.status === filter : item.status !== "withdrawn"; }
export function isOverdue(item: ScheduleInput, now = new Date()): boolean { return item.status === "planned" && Date.parse(`${item.date}T${item.time}:00+08:00`) < now.getTime(); }
export function planBlocked(item: ScheduleInput, store: KolStore): boolean { return talentForSchedule(item, store)?.status !== "active" || store.collaborations.find(c => c.id === item.collaborationId)?.stage === "cancelled"; }
