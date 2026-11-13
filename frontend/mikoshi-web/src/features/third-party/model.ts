/** 三方号本地管理合同。历史事实与人工资料/计划始终分开。 */
export const GROUPS = ["蘑菇", "伏羲", "其他"] as const;
export type AccountGroup = typeof GROUPS[number];
export const ACCOUNT_STATUSES = { active: "正常运营", attention: "待整改", retired: "已回收停用" } as const;
export type AccountStatus = keyof typeof ACCOUNT_STATUSES;
export interface AccountInput {
  uid: string; name: string; group: AccountGroup; supplier: string; manager: string;
  phone: string; settlement: string; category: string; persona: string; status: AccountStatus; notes: string;
}
export interface ManagedAccount extends AccountInput { id: string; createdAt: string; updatedAt: string }
export interface HistoricalWork {
  id: string; title: string | null; date: string | null; time: string | null;
  view: number | null; like: number | null; reply: number | null; link: string | null;
}
export interface HistoricalAccount {
  id: string; uid: string | null; name: string; link: string | null; suppliers: string[];
  workCount: number; view: number | null; works: HistoricalWork[];
}
export interface Catalog { schema: 1; sourceHash: string; accounts: HistoricalAccount[] }
/** Even local generated JSON is treated as an external boundary, not blindly cast. */
export function decodeCatalog(value: unknown): Catalog | null {
  const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  const nullableText = (v: unknown) => v === null || typeof v === "string";
  const metric = (v: unknown) => v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0);
  const link = (v: unknown) => {
    if (v === null) return true;
    if (typeof v !== "string") return false;
    try { const u = new URL(v); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password && (u.hostname === "bilibili.com" || u.hostname.endsWith(".bilibili.com")); } catch { return false; }
  };
  if (!record(value) || value.schema !== 1 || typeof value.sourceHash !== "string" || !/^[a-f0-9]{64}$/i.test(value.sourceHash) || !Array.isArray(value.accounts)) return null;
  for (const a of value.accounts) {
    if (!record(a) || typeof a.id !== "string" || !a.id || typeof a.name !== "string" ||
      !(a.uid === null || (typeof a.uid === "string" && /^[1-9]\d*$/.test(a.uid))) || !link(a.link) ||
      !Array.isArray(a.suppliers) || !a.suppliers.every(s => typeof s === "string") ||
      typeof a.workCount !== "number" || !Number.isInteger(a.workCount) || a.workCount < 0 || !metric(a.view) || !Array.isArray(a.works) || a.works.length > 3) return null;
    for (const w of a.works) if (!record(w) || typeof w.id !== "string" || !nullableText(w.title) || !nullableText(w.date) || !nullableText(w.time) || !metric(w.view) || !metric(w.like) || !metric(w.reply) || !link(w.link)) return null;
  }
  if (new Set(value.accounts.map(a => a.id)).size !== value.accounts.length) return null;
  return value as unknown as Catalog;
}
export interface AccountRef {
  id: string; uid: string | null; name: string; group: AccountGroup | null; status: AccountStatus;
  link: string | null; managed?: ManagedAccount; history?: HistoricalAccount;
}
export interface ScheduleInput {
  accountId: string; title: string; date: string; time: string; content: string;
  review: "pending" | "confirmed"; notes: string; status: "planned" | "cancelled" | "withdrawn";
}
export const SCHEDULE_STATUSES = { planned: "已计划", cancelled: "已取消", withdrawn: "已撤下" } as const;
export function matchesScheduleStatus(item: ScheduleInput, filter: string): boolean {
  return filter ? item.status === filter : item.status !== "withdrawn";
}
export interface PublicationSchedule extends ScheduleInput { id: string; createdAt: string; updatedAt: string }
export interface PublicationStore { schema: 1; revision: string | null; accounts: ManagedAccount[]; schedules: PublicationSchedule[] }
export const emptyStore = (): PublicationStore => ({ schema: 1, revision: null, accounts: [], schedules: [] });
export const emptyAccount = (): AccountInput => ({ uid: "", name: "", group: "蘑菇", supplier: "", manager: "", phone: "", settlement: "", category: "", persona: "", status: "active", notes: "" });
export type FieldErrors = Record<string, string>;
export type SaveResult = { ok: true } | { ok: false; error: string; fields?: FieldErrors };
export type Editor =
  | { kind: "account"; id?: string; sourceAccountId?: string; originPath: string; baseRevision: string | null; initial: string; value: AccountInput }
  | { kind: "schedule"; id?: string; originPath: string; baseRevision: string | null; initial: string; value: ScheduleInput };

export function normalizeUid(value: string): string { return value.trim().replace(/^0+(?=\d)/, ""); }
export function homeForUid(uid: string): string { return `https://space.bilibili.com/${uid}`; }
export function shanghaiNow(now = new Date()): { date: string; time: string } {
  const shifted = new Date(now.getTime() + 8 * 3600_000).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2000-01-01" || value > "2100-12-31") return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function isOverdue(item: ScheduleInput, now = new Date()): boolean {
  return item.status === "planned" && new Date(`${item.date}T${item.time}:00+08:00`).getTime() < now.getTime();
}
export function accountReferences(store: PublicationStore, catalog: Catalog | null): AccountRef[] {
  const managed = new Map(store.accounts.map(a => [a.id, a]));
  const refs: AccountRef[] = (catalog?.accounts ?? []).map(history => {
    const id = `snapshot:${history.id}`;
    const local = managed.get(id); managed.delete(id);
    return { id, uid: local?.uid ?? history.uid, name: local?.name ?? history.name, group: local?.group ?? null,
      status: local?.status ?? "active", link: local ? homeForUid(local.uid) : history.link, managed: local, history };
  });
  for (const a of managed.values()) refs.push({ id: a.id, uid: a.uid, name: a.name, group: a.group, status: a.status, link: homeForUid(a.uid), managed: a });
  return refs.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
export function validateAccount(input: AccountInput, store: PublicationStore, id?: string): FieldErrors {
  const e: FieldErrors = {}, uid = normalizeUid(input.uid);
  if (!/^[1-9]\d{0,19}$/.test(uid)) e.uid = "请填写有效的 B站 UID（1–20 位数字）。";
  if (!input.name.trim() || input.name.length > 80) e.name = "请填写账号昵称，不超过 80 字。";
  if (!GROUPS.includes(input.group)) e.group = "请选择归属标签。";
  if (!(input.status in ACCOUNT_STATUSES)) e.status = "请选择有效账号状态。";
  if (store.accounts.some(a => a.id !== id && a.uid === uid)) e.uid = "此 UID 已入库，请编辑已有账号。";
  const existing = store.accounts.find(a => a.id === id);
  if (existing && existing.uid !== uid) e.uid = "已入库账号的 UID 不可更换，请另建账号。";
  for (const key of ["supplier", "manager", "phone", "settlement", "category", "persona"] as const)
    if (input[key].length > (key === "phone" ? 40 : 120)) e[key] = "内容过长，请精简后保存。";
  if (input.notes.length > 2000) e.notes = "备注最多 2000 字。";
  return e;
}
export function validateSchedule(input: ScheduleInput, store: PublicationStore, accounts: AccountRef[], id?: string): FieldErrors {
  const e: FieldErrors = {}, account = accounts.find(a => a.id === input.accountId);
  if (!account) e.accountId = "请选择可用账号。";
  else if (account.status === "retired" && input.status === "planned") e.accountId = "该账号已回收停用，不能安排发布。";
  if (!input.title.trim() || input.title.length > 160) e.title = "请填写排期标题，不超过 160 字。";
  if (!isValidDate(input.date)) e.date = "请选择有效日期（2000–2100 年）。";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) e.time = "请选择有效时间。";
  if (!(input.status in SCHEDULE_STATUSES)) e.status = "排期状态无效。";
  if (!["pending", "confirmed"].includes(input.review)) e.review = "请选择确认状态。";
  if (input.content.length > 4000) e.content = "内容说明最多 4000 字。";
  if (input.notes.length > 2000) e.notes = "备注最多 2000 字。";
  if (input.status === "planned" && store.schedules.some(s => s.id !== id && s.status === "planned" && s.accountId === input.accountId && s.date === input.date && s.time === input.time))
    e.time = "此账号在该时刻已有排期，请更换时间。";
  return e;
}
