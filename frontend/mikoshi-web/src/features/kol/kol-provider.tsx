"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shanghaiToday } from "@/lib/calendar-dates";
import { emptyCollaboration, emptyStore, emptyTalent, normalizeIdentity, validateCollaboration, validateSchedule, validateTalent, type Collaboration, type CollaborationInput, type Editor, type KolStore, type SaveResult, type Schedule, type ScheduleInput, type Talent } from "./model";
import { kolKey, readKol, writeKol } from "./repository";

interface KolContext {
  data: KolStore; loaded: boolean; loadError: string | null; notice: string | null; editor: Editor | null;
  setEditor: React.Dispatch<React.SetStateAction<Editor | null>>;
  openTalent(item?: Talent): void; openCollaboration(item?: Collaboration, defaults?: Partial<CollaborationInput>): void;
  openSchedule(item?: Schedule, defaults?: Partial<ScheduleInput>): void;
  closeEditor(): void; saveEditor(): Promise<SaveResult>; setScheduleStatus(item: Schedule, status: ScheduleInput["status"]): Promise<SaveResult>;
  requestLeave(action: () => void): boolean; refresh(): void;
}
const Context = React.createContext<KolContext | null>(null);
export function KolProvider({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser(), pathname = usePathname(), router = useRouter();
  const [data, setData] = React.useState<KolStore>(emptyStore);
  const [loaded, setLoaded] = React.useState(false), [loadError, setLoadError] = React.useState<string | null>(null);
  const [editor, setEditor] = React.useState<Editor | null>(null), [notice, setNotice] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<(() => void) | null>(null);
  const busy = React.useRef(false);
  const dirty = editor !== null && JSON.stringify(editor.value) !== editor.initial;
  const refresh = React.useCallback(() => {
    const result = readKol(user.id);
    if (result.ok) { setData(result.data); setLoadError(null); } else setLoadError(result.error);
    setLoaded(true);
  }, [user.id]);
  React.useEffect(() => {
    let alive = true;
    queueMicrotask(() => { if (alive) refresh(); });
    const listener = (event: StorageEvent) => { if (event.key === null || event.key === kolKey(user.id)) refresh(); };
    window.addEventListener("storage", listener);
    return () => { alive = false; window.removeEventListener("storage", listener); };
  }, [refresh, user.id]);
  React.useEffect(() => {
    if (!dirty) return;
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  const requestLeave = React.useCallback((action: () => void) => {
    if (busy.current) return false;
    if (dirty) { setPending(() => action); return false; }
    setEditor(null); action(); return true;
  }, [dirty]);
  const prepare = (next: Omit<Editor, "originPath" | "baseRevision" | "initial">) => {
    if (!loaded || loadError) return;
    requestLeave(() => { setNotice(null); setEditor({ ...next, originPath: pathname, baseRevision: data.revision, initial: JSON.stringify(next.value) } as Editor); });
  };
  const openTalent = (item?: Talent) => prepare({ kind: "talent", id: item?.id, value: item ? { ...item } : emptyTalent() });
  const openCollaboration = (item?: Collaboration, defaults?: Partial<CollaborationInput>) => prepare({ kind: "collaboration", id: item?.id, value: item ? { ...item } : { ...emptyCollaboration(), ...defaults } });
  const openSchedule = (item?: Schedule, defaults?: Partial<ScheduleInput>) => prepare({ kind: "schedule", id: item?.id, value: item ? { ...item } : { collaborationId: "", title: "", date: shanghaiToday(new Date()), time: "18:00", content: "", review: "pending", status: "planned", notes: "", ...defaults } });
  const commit = async (next: KolStore, revision: string | null): Promise<SaveResult> => {
    if (busy.current) return { ok: false, error: "正在保存，请稍候。" };
    busy.current = true;
    const result = await writeKol(user.id, revision, next);
    busy.current = false;
    if (result.ok && result.data) { setData(result.data); setLoadError(null); setNotice("已保存到本机 · 当前演示身份"); }
    else if (!result.ok) refresh();
    return result;
  };
  const saveEditor = async (): Promise<SaveResult> => {
    if (!editor || !loaded) return { ok: false, error: "资料尚未就绪。" };
    if (loadError) return { ok: false, error: loadError };
    const now = new Date().toISOString();
    let next: KolStore;
    if (editor.kind === "talent") {
      const fields = validateTalent(editor.value, data, editor.id);
      if (Object.keys(fields).length) return { ok: false, error: "请检查标出的达人资料。", fields };
      const old = data.talents.find(t => t.id === editor.id);
      const item: Talent = { ...editor.value, name: editor.value.name.trim(), externalId: normalizeIdentity(editor.value.platform, editor.value.externalId), profileUrl: editor.value.profileUrl.trim(), id: editor.id ?? `talent:${crypto.randomUUID()}`, createdAt: old?.createdAt ?? now, updatedAt: now };
      next = { ...data, talents: [...data.talents.filter(t => t.id !== item.id), item] };
    } else if (editor.kind === "collaboration") {
      const fields = validateCollaboration(editor.value, data, editor.id);
      if (Object.keys(fields).length) return { ok: false, error: "请检查标出的合作资料。", fields };
      const old = data.collaborations.find(c => c.id === editor.id);
      const item: Collaboration = { ...editor.value, title: editor.value.title.trim(), id: editor.id ?? `collaboration:${crypto.randomUUID()}`, createdAt: old?.createdAt ?? now, updatedAt: now };
      next = { ...data, collaborations: [...data.collaborations.filter(c => c.id !== item.id), item] };
    } else {
      const fields = validateSchedule(editor.value, data, editor.id);
      if (Object.keys(fields).length) return { ok: false, error: "请检查标出的排期内容。", fields };
      const old = data.schedules.find(s => s.id === editor.id);
      const item: Schedule = { ...editor.value, title: editor.value.title.trim(), id: editor.id ?? `schedule:${crypto.randomUUID()}`, createdAt: old?.createdAt ?? now, updatedAt: now };
      next = { ...data, schedules: [...data.schedules.filter(s => s.id !== item.id), item] };
    }
    const result = await commit(next, editor.baseRevision);
    if (result.ok) setEditor(null);
    return result;
  };
  const setScheduleStatus = async (item: Schedule, status: ScheduleInput["status"]): Promise<SaveResult> => {
    if (loadError) return { ok: false, error: loadError };
    const current = data.schedules.find(s => s.id === item.id);
    if (!current || current.updatedAt !== item.updatedAt) return { ok: false, error: "这条排期已更新，请关闭确认框后重试。" };
    const changed = { ...current, status, updatedAt: new Date().toISOString() };
    const fields = status === "planned" ? validateSchedule(changed, data, item.id) : {};
    if (Object.keys(fields).length) return { ok: false, error: Object.values(fields)[0] ?? "排期校验未通过。", fields };
    const result = await commit({ ...data, schedules: data.schedules.map(s => s.id === item.id ? changed : s) }, data.revision);
    if (result.ok) setNotice(status === "withdrawn" ? "计划已撤下，记录保留在对应合作下，可恢复。" : status === "cancelled" ? "计划已取消，记录保留，可恢复或撤下。" : "计划已恢复，可在对应合作下继续管理。");
    return result;
  };
  return <Context.Provider value={{ data, loaded, loadError, editor, setEditor, notice, openTalent, openCollaboration, openSchedule, closeEditor: () => requestLeave(() => setEditor(null)), saveEditor, setScheduleStatus, requestLeave, refresh }}>
    {children}
    {editor && pathname !== editor.originPath && <div role="status" className="fixed right-4 bottom-4 z-(--z-toast) max-w-[calc(100%-2rem)] rounded-card border border-control bg-surface p-3 shadow-overlay"><p className="mb-2 text-body">KOL 还有未保存的资料。</p><Button onClick={() => router.push(editor.originPath)}>返回继续编辑</Button></div>}
    <Dialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null); }}><DialogContent showCloseButton={false}><DialogHeader><DialogTitle>KOL 资料还没有保存</DialogTitle><DialogDescription>继续编辑可保留草稿；放弃仅丢弃本次修改，已保存资料不受影响。</DialogDescription></DialogHeader><DialogFooter><Button variant="danger" onClick={() => { const action = pending; setPending(null); setEditor(null); action?.(); }}>放弃更改</Button><Button variant="primary" autoFocus onClick={() => { setPending(null); if (editor && pathname !== editor.originPath) router.push(editor.originPath); }}>继续编辑</Button></DialogFooter></DialogContent></Dialog>
  </Context.Provider>;
}
export function useKol(): KolContext { const ctx = React.useContext(Context); if (!ctx) throw new Error("useKol requires KolProvider"); return ctx; }
