import { isRecord, parseJson, readItem, writeItem } from "@/lib/storage";
import { emptyStore, isValidDate, type ManagedAccount, type PublicationSchedule, type PublicationStore, type SaveResult } from "./model";

// SBS-0013: start a new dataset without deleting the archived v1 browser values.
// The schema remains 1; the dataset generation is independent of schema versions.
export const publicationKey = (userId: string) => `mikoshi:third-party:initial-20261019:${encodeURIComponent(userId)}`;
const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
function validAccount(v: unknown): v is ManagedAccount {
  return isRecord(v) && typeof v.id === "string" && text(v.uid, 20) && /^[1-9]\d*$/.test(v.uid as string) &&
    text(v.name, 80) && Boolean((v.name as string).trim()) && ["蘑菇", "伏羲", "其他"].includes(v.group as string) &&
    ["active", "attention", "retired"].includes(v.status as string) &&
    ["supplier", "manager", "settlement", "category", "persona"].every(k => text(v[k], 120)) && text(v.phone, 40) && text(v.notes, 2000) &&
    typeof v.createdAt === "string" && typeof v.updatedAt === "string";
}
function validSchedule(v: unknown): v is PublicationSchedule {
  return isRecord(v) && typeof v.id === "string" && typeof v.accountId === "string" && text(v.title, 160) && Boolean((v.title as string).trim()) &&
    typeof v.date === "string" && isValidDate(v.date) && typeof v.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.time) &&
    ["planned", "cancelled", "withdrawn"].includes(v.status as string) && ["pending", "confirmed"].includes(v.review as string) && text(v.content, 4000) && text(v.notes, 2000) && typeof v.createdAt === "string" && typeof v.updatedAt === "string";
}
export type LoadResult = { ok: true; data: PublicationStore } | { ok: false; error: string };
export function decodeStore(raw: string | null): LoadResult {
  if (raw === null) return { ok: true, data: emptyStore() };
  const v = parseJson(raw);
  if (!isRecord(v) || v.schema !== 1 || typeof v.revision !== "string" || !Array.isArray(v.accounts) || !Array.isArray(v.schedules) ||
    !v.accounts.every(validAccount) || !v.schedules.every(validSchedule) ||
    new Set(v.accounts.map(a => a.id)).size !== v.accounts.length || new Set(v.accounts.map(a => a.uid)).size !== v.accounts.length ||
    new Set(v.schedules.map(s => s.id)).size !== v.schedules.length) return { ok: false, error: "本机三方号资料损坏或版本不支持。原数据已保留，暂时无法保存，请先备份并检查浏览器存储。" };
  return { ok: true, data: v as unknown as PublicationStore };
}
export function readPublication(userId: string): LoadResult {
  const result = readItem("local", publicationKey(userId));
  return result.ok ? decodeStore(result.value) : { ok: false, error: "无法读取本机资料，请允许本站使用浏览器存储后重试。" };
}
export async function writePublication(userId: string, expectedRevision: string | null, next: PublicationStore): Promise<SaveResult & { data?: PublicationStore }> {
  const commit = () => {
    const current = readPublication(userId);
    if (!current.ok) return current;
    if (current.data.revision !== expectedRevision) return { ok: false as const, error: "其他窗口已更新资料，本次未保存。草稿已保留；请关闭编辑并重新打开最新记录，再应用更改。" };
    const data: PublicationStore = { ...next, schema: 1, revision: crypto.randomUUID() };
    const valid = decodeStore(JSON.stringify(data));
    if (!valid.ok) return { ok: false as const, error: "资料校验失败，本次未保存。" };
    const result = writeItem("local", publicationKey(userId), JSON.stringify(data));
    if (!result.ok) return { ok: false as const, error: result.error === "quota" ? "浏览器存储空间不足，本次未保存。草稿仍在，请释放空间后重试。" : "无法写入本机资料，本次未保存。请恢复浏览器存储权限后重试。" };
    return { ok: true as const, data };
  };
  try {
    if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request(publicationKey(userId), commit);
    return commit();
  } catch { return { ok: false, error: "保存未完成，草稿仍在，请重试。" }; }
}
