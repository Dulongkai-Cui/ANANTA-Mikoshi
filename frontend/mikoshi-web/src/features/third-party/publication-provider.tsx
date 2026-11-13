"use client";
import { assetPath } from "@/lib/asset-path";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accountReferences, decodeCatalog, emptyAccount, emptyStore, normalizeUid, shanghaiNow, validateAccount, validateSchedule,
  type AccountRef, type Catalog, type Editor, type HistoricalAccount, type ManagedAccount,
  type PublicationSchedule, type PublicationStore, type SaveResult, type ScheduleInput } from "./model";
import { publicationKey, readPublication, writePublication } from "./repository";

interface PublicationContext {
  data: PublicationStore; accounts: AccountRef[]; loaded: boolean; loadError: string | null; historyError: string | null;
  editor: Editor | null; setEditor: React.Dispatch<React.SetStateAction<Editor | null>>; notice: string | null;
  openAccount(account?: ManagedAccount, history?: HistoricalAccount): void;
  openSchedule(schedule?: PublicationSchedule, defaults?: Partial<ScheduleInput>): void;
  closeEditor(): void; saveEditor(): Promise<SaveResult>;
  setScheduleStatus(item: PublicationSchedule, status: ScheduleInput["status"]): Promise<SaveResult>;
  requestLeave(action: () => void): boolean; refresh(): void;
}
const Context = React.createContext<PublicationContext | null>(null);

export function PublicationProvider({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser(), pathname = usePathname(), router = useRouter();
  const [data, setData] = React.useState<PublicationStore>(emptyStore);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [catalog, setCatalog] = React.useState<Catalog | null>(null);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [catalogVersion, setCatalogVersion] = React.useState(0);
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<(() => void) | null>(null);
  const busy = React.useRef(false);
  const dirty = editor !== null && JSON.stringify(editor.value) !== editor.initial;
  const accounts = React.useMemo(() => accountReferences(data, catalog), [data, catalog]);

  const refresh = React.useCallback(() => {
    const result = readPublication(user.id);
    if (result.ok) { setData(result.data); setLoadError(null); }
    else setLoadError(result.error);
    setLoaded(true);
    setCatalogVersion(version => version + 1);
  }, [user.id]);
  React.useEffect(() => {
    let alive = true;
    // 外部本机仓储订阅，避免服务端读取浏览器状态。
    queueMicrotask(() => { if (alive) refresh(); });
    const listener = (event: StorageEvent) => { if (event.key === publicationKey(user.id) || event.key === null) refresh(); };
    window.addEventListener("storage", listener);
    return () => { alive = false; window.removeEventListener("storage", listener); };
  }, [refresh, user.id]);
  React.useEffect(() => {
    const controller = new AbortController();
    void fetch(assetPath("/legacy/thirdparty-catalog.json"), { signal: controller.signal }).then(async r => {
      if (!r.ok) throw new Error("catalog");
      const value = decodeCatalog(await r.json());
      if (!value) throw new Error("catalog");
      setCatalog(value); setHistoryError(null);
    }).catch(() => { if (!controller.signal.aborted) setHistoryError("历史账号目录暂时无法读取。已有本机资料仍保留，请刷新页面重试。"); });
    return () => controller.abort();
  }, [catalogVersion]);
  React.useEffect(() => {
    if (!dirty) return;
    const leave = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  const requestLeave = React.useCallback((action: () => void) => {
    if (dirty) { setPending(() => action); return false; }
    setEditor(null); action(); return true;
  }, [dirty]);
  const openAccount = (account?: ManagedAccount, history?: HistoricalAccount) => {
    if (!loaded || loadError) return;
    requestLeave(() => {
    const value = account ? { ...account } : { ...emptyAccount(), uid: history?.uid ?? "", name: history?.name ?? "", supplier: history?.suppliers.join("、") ?? "" };
    setNotice(null);
    setEditor({ kind: "account", id: account?.id, sourceAccountId: history?.id, originPath: pathname, baseRevision: data.revision, initial: JSON.stringify(value), value });
    });
  };
  const openSchedule = (schedule?: PublicationSchedule, defaults?: Partial<ScheduleInput>) => {
    if (!loaded || loadError) return;
    requestLeave(() => {
    const value: ScheduleInput = schedule ? { ...schedule } : { accountId: "", title: "", date: shanghaiNow().date, time: "18:00", content: "", review: "pending", notes: "", status: "planned", ...defaults };
    setNotice(null);
    setEditor({ kind: "schedule", id: schedule?.id, originPath: pathname, baseRevision: data.revision, initial: JSON.stringify(value), value });
    });
  };
  const commit = async (next: PublicationStore, revision: string | null): Promise<SaveResult> => {
    if (busy.current) return { ok: false, error: "正在保存，请稍候。" };
    busy.current = true;
    const result = await writePublication(user.id, revision, next);
    busy.current = false;
    if (result.ok && result.data) { setData(result.data); setLoadError(null); setNotice("已保存到本机 · 当前演示身份"); }
    else if (!result.ok) refresh();
    return result;
  };
  const saveEditor = async (): Promise<SaveResult> => {
    if (!editor || !loaded) return { ok: false, error: "资料尚未就绪。" };
    if (loadError) return { ok: false, error: loadError };
    const now = new Date().toISOString();
    let next: PublicationStore;
    if (editor.kind === "account") {
      const fields = validateAccount(editor.value, data, editor.id);
      if (Object.keys(fields).length) return { ok: false, error: "请检查标出的账号资料。", fields };
      const uid = normalizeUid(editor.value.uid);
      // 目录尚未可用时不能分配独立ID，以免恢复目录后同UID变成两个账号。
      if (!catalog) return { ok: false, error: "历史账号目录尚未就绪，请刷新后再入库。草稿保留。" };
      const sourceById = catalog.accounts.find(a => a.id === editor.sourceAccountId);
      const sourceByUid = catalog.accounts.find(a => a.uid === uid);
      if (sourceById && ((sourceByUid && sourceByUid.id !== sourceById.id) || (sourceById.uid && sourceById.uid !== uid)))
        return { ok: false, error: "此 UID 与所补充的历史账号不一致，或已关联另一个历史账号。", fields: { uid: "请核实历史账号的 UID，不能合并两个账号。" } };
      const source = sourceById ?? sourceByUid;
      const id = editor.id ?? (source ? `snapshot:${source.id}` : `local:${crypto.randomUUID()}`);
      const old = data.accounts.find(a => a.id === id);
      if (old && !editor.id) return { ok: false, error: "此账号已有管理资料，请编辑已有记录。" };
      const account: ManagedAccount = { ...editor.value, uid, name: editor.value.name.trim(), id, createdAt: old?.createdAt ?? now, updatedAt: now };
      next = { ...data, accounts: [...data.accounts.filter(a => a.id !== id), account] };
    } else {
      const fields = validateSchedule(editor.value, data, accounts, editor.id);
      if (Object.keys(fields).length) return { ok: false, error: "请检查标出的排期内容。", fields };
      const old = data.schedules.find(s => s.id === editor.id);
      const schedule: PublicationSchedule = { ...editor.value, title: editor.value.title.trim(), id: editor.id ?? `schedule:${crypto.randomUUID()}`, createdAt: old?.createdAt ?? now, updatedAt: now };
      next = { ...data, schedules: [...data.schedules.filter(s => s.id !== schedule.id), schedule] };
    }
    const result = await commit(next, editor.baseRevision);
    if (result.ok) setEditor(null);
    return result;
  };
  const setScheduleStatus = async (item: PublicationSchedule, status: ScheduleInput["status"]): Promise<SaveResult> => {
    if (loadError) return { ok: false, error: loadError };
    // Modal may have stayed open while another tab updated the same schedule.
    const current = data.schedules.find(s => s.id === item.id);
    if (!current || current.updatedAt !== item.updatedAt) return { ok: false, error: "此排期已更新，请关闭确认框后重试。" };
    const changed = { ...current, status, updatedAt: new Date().toISOString() };
    // Cancelling/withdrawing must remain possible even if the linked account is unavailable.
    // Restoring re-enters the active schedule and must pass all availability/conflict checks.
    const fields = status === "planned" ? validateSchedule(changed, data, accounts, item.id) : {};
    if (Object.keys(fields).length) return { ok: false, error: Object.values(fields)[0] ?? "排期资料校验未通过。", fields };
    const result = await commit({ ...data, schedules: data.schedules.map(s => s.id === item.id ? changed : s) }, data.revision);
    if (result.ok) setNotice(status === "withdrawn" ? "计划已撤下。可在状态筛选“已撤下”中查看或恢复。" : status === "cancelled" ? "计划已取消，记录保留，可恢复或继续撤下。" : "计划已恢复，重新显示在计划列表与日历中。");
    return result;
  };
  return <Context.Provider value={{ data, accounts, loaded, loadError, historyError, editor, setEditor, notice, openAccount, openSchedule, closeEditor: () => requestLeave(() => setEditor(null)), saveEditor, setScheduleStatus, requestLeave, refresh }}>
    {editor && pathname !== editor.originPath && <div className="fixed right-4 bottom-4 z-(--z-toast) max-w-[calc(100%-2rem)] rounded-card border border-control bg-surface p-3 shadow-overlay" role="status">
      <p className="mb-2 text-body">三方号还有未保存的{editor.kind === "account" ? "账号资料" : "排期"}。</p>
      <Button onClick={() => router.push(editor.originPath)}>返回继续编辑</Button>
    </div>}
    {children}
    <Dialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader><DialogTitle>三方号资料还没有保存</DialogTitle><DialogDescription>继续编辑可保留草稿；放弃只会丢弃本次修改，已保存的资料不受影响。</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="danger" onClick={() => { const action = pending; setPending(null); setEditor(null); action?.(); }}>放弃更改</Button><Button variant="primary" autoFocus onClick={() => { setPending(null); if (editor && pathname !== editor.originPath) router.push(editor.originPath); }}>继续编辑</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </Context.Provider>;
}
export function usePublication(): PublicationContext {
  const ctx = React.useContext(Context);
  if (!ctx) throw new Error("usePublication requires PublicationProvider");
  return ctx;
}
