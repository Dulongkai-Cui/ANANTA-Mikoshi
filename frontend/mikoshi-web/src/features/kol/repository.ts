import { isRecord, parseJson, readItem, writeItem } from "@/lib/storage";
import { BOOKINGS, CHOICES, PLATFORMS, SCHEDULE_STATUSES, SELECTIONS, STAGES, TALENT_STATUSES, emptyStore, normalizeIdentity, safeProfileUrl, validDate, type KolStore, type SaveResult } from "./model";

export const kolKey = (userId: string) => `mikoshi:kol:initial-20261019:${encodeURIComponent(userId)}`;
export type LoadResult = { ok: true; data: KolStore } | { ok: false; error: string };
const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
const fields = (v: Record<string, unknown>, keys: string[], max: number) => keys.every(k => text(v[k], max));
const num = (v: unknown, integer = false) => v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER && (!integer || Number.isInteger(v)));
const meta = (v: Record<string, unknown>) => text(v.id, 120) && Boolean(v.id) && typeof v.createdAt === "string" && Number.isFinite(Date.parse(v.createdAt)) && typeof v.updatedAt === "string" && Number.isFinite(Date.parse(v.updatedAt));
const member = (choices: object, value: unknown) => typeof value === "string" && Object.hasOwn(choices, value);
export function decodeStore(raw: string | null): LoadResult {
  if (raw === null) return { ok: true, data: emptyStore() };
  const bad: LoadResult = { ok: false, error: "本机 KOL 资料损坏或版本不支持。原数据已保留，暂时无法保存，请先备份并检查浏览器存储。" };
  const v = parseJson(raw);
  if (!isRecord(v) || v.schema !== 1 || !text(v.revision, 120) || !v.revision || !Array.isArray(v.talents) || !Array.isArray(v.collaborations) || !Array.isArray(v.schedules)) return bad;
  for (const t of v.talents) {
    if (!isRecord(t) || !meta(t) || !PLATFORMS.includes(t.platform as never) || !fields(t, ["externalId", "name"], 80) || !(t.name as string).trim() || !(t.externalId as string).trim() || /[\s\u0000-\u001f\u007f]/.test(t.externalId as string) || (t.platform === "B站" && !/^[1-9]\d{0,19}$/.test(t.externalId as string)) || normalizeIdentity(t.platform as never, t.externalId as string) !== t.externalId || !text(t.profileUrl, 500) || !safeProfileUrl(t.profileUrl as string) || !fields(t, ["category", "tier", "supplier", "contact", "owner"], 120) || !text(t.tags, 240) || !text(t.notes, 2000) || !num(t.followers, true) || !num(t.referencePrice) || !member(SELECTIONS, t.selection) || !member(TALENT_STATUSES, t.status)) return bad;
  }
  for (const c of v.collaborations) {
    if (!isRecord(c) || !meta(c) || !fields(c, ["talentId", "wave", "owner", "supplier", "productionCycle"], 120) || !text(c.title, 160) || !(c.title as string).trim() || !fields(c, ["creative", "sellingPoint", "notes"], 2000) || !fields(c, ["quoteScope", "nextStep", "blocker"], 1000) || !["scriptDate", "draftDate", "deadline", "latestOrderDate"].every(k => typeof c[k] === "string" && (!c[k] || validDate(c[k] as string))) || !num(c.quote) || !member(STAGES, c.stage) || !member(BOOKINGS, c.booking) || !member(CHOICES, c.choice) || !v.talents.some(t => t.id === c.talentId)) return bad;
  }
  for (const s of v.schedules) {
    if (!isRecord(s) || !meta(s) || !text(s.collaborationId, 120) || !text(s.title, 160) || !(s.title as string).trim() || typeof s.date !== "string" || !validDate(s.date) || typeof s.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time) || !text(s.content, 4000) || !text(s.notes, 2000) || !member(SCHEDULE_STATUSES, s.status) || !["pending", "confirmed"].includes(s.review as string) || !v.collaborations.some(c => c.id === s.collaborationId)) return bad;
  }
  if ([v.talents, v.collaborations, v.schedules].some(list => new Set(list.map(i => i.id)).size !== list.length) || new Set(v.talents.map(t => `${t.platform}:${t.externalId}`)).size !== v.talents.length) return bad;
  return { ok: true, data: v as unknown as KolStore };
}
export function readKol(userId: string): LoadResult {
  const result = readItem("local", kolKey(userId));
  return result.ok ? decodeStore(result.value) : { ok: false, error: "无法读取本机 KOL 资料，请恢复浏览器存储权限后重试。" };
}
export async function writeKol(userId: string, expectedRevision: string | null, next: KolStore): Promise<SaveResult & { data?: KolStore }> {
  const commit = () => {
    const current = readKol(userId);
    if (!current.ok) return current;
    if (current.data.revision !== expectedRevision) return { ok: false as const, error: "其他窗口已更新 KOL 资料，本次未保存。草稿已保留，请关闭后重新打开最新记录再修改。" };
    const data: KolStore = { ...next, schema: 1, revision: crypto.randomUUID() };
    const raw = JSON.stringify(data);
    if (!decodeStore(raw).ok) return { ok: false as const, error: "KOL 资料校验失败，本次未保存。" };
    const result = writeItem("local", kolKey(userId), raw);
    if (!result.ok) return { ok: false as const, error: result.error === "quota" ? "浏览器存储空间不足，本次未保存，草稿已保留。" : "无法保存本机 KOL 资料，草稿已保留，请恢复存储权限后重试。" };
    const check = readItem("local", kolKey(userId));
    if (!check.ok || check.value !== raw) return { ok: false as const, error: "保存结果未能确认，草稿已保留，请重新读取后核对。" };
    return { ok: true as const, data };
  };
  try { return typeof navigator !== "undefined" && navigator.locks ? await navigator.locks.request(kolKey(userId), commit) : commit(); }
  catch { return { ok: false, error: "KOL 保存未完成，草稿已保留，请重试。" }; }
}
