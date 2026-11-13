import { parseJson, readItem, writeItem } from "@/lib/storage";
import { emptyStore, storeError, type WorkbenchStore, type Result } from "./model";
export const workbenchKey = (id: string) => `mikoshi:workbench:v1:${encodeURIComponent(id)}`;
export function readWorkbench(id: string): Result {
  const r = readItem("local", workbenchKey(id));
  if (!r.ok) return { ok: false, error: "无法读取工作台资料，请恢复浏览器存储权限后重试。" };
  if (r.value === null) return { ok: true, data: emptyStore() };
  const data = parseJson(r.value);
  if (storeError(data)) return { ok: false, error: "工作台资料损坏或版本不支持，原数据已保留，暂时无法保存。请先备份检查。" };
  return { ok: true, data: data as WorkbenchStore };
}
export async function writeWorkbench(id: string, expected: string | null, next: WorkbenchStore): Promise<Result> {
  const commit = (): Result => {
    const current = readWorkbench(id);
    if (!current.ok) return current;
    if (current.data?.revision !== expected) return { ok: false, error: "其他窗口已更新工作台，本次未保存。输入已保留；请复制所需内容，再载入最新版本。" };
    const data = { ...next, schema: 1 as const, revision: crypto.randomUUID() };
    const invalid = storeError(data); if (invalid) return { ok: false, error: invalid };
    const raw = JSON.stringify(data), result = writeItem("local", workbenchKey(id), raw);
    if (!result.ok) return { ok: false, error: result.error === "quota" ? "浏览器空间不足，本次未保存，输入已保留。" : "无法保存工作台资料，输入已保留，请恢复存储权限后重试。" };
    const check = readItem("local", workbenchKey(id));
    if (!check.ok || check.value !== raw) return { ok: false, error: "保存结果未确认，请重新读取核对；输入已保留。" };
    return { ok: true, data };
  };
  try { return typeof navigator !== "undefined" && navigator.locks ? await navigator.locks.request(workbenchKey(id), commit) : commit(); }
  catch { return { ok: false, error: "保存未完成，请重试；输入已保留。" }; }
}
