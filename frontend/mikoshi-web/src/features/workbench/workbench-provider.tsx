"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { shanghaiToday, addCalendarDays } from "@/lib/calendar-dates";
import { emptyStore, emptyTask, emptyFilter, DEFAULT_LINE, validation, type WorkbenchStore, type Kind, type Value, type Editor, type Result, type Task, type Filter } from "./model";
import { demoStore } from "./data-exchange";
import { readWorkbench, workbenchKey, writeWorkbench } from "./repository";

interface UI { filter: Filter; group: "status" | "owner"; layout: "board" | "table"; timeline: "events" | "tasks"; start: string; days: number; dueDays: number }
interface ContextValue {
  data: WorkbenchStore; live: WorkbenchStore; loaded: boolean; error: string | null; notice: string | null; preview: boolean; saving: boolean; pending: boolean;
  editor: Editor | null; setEditor: React.Dispatch<React.SetStateAction<Editor | null>>; ui: UI; setUI: React.Dispatch<React.SetStateAction<UI>>;
  open(kind: Kind, id?: string, defaults?: Partial<Value>): void; close(): void; requestLeave(action: () => void): boolean; togglePreview(): void;
  save(): Promise<Result>; remove(): Promise<Result>; updateTask(t: Task): Promise<Result>; commit(s: WorkbenchStore, revision: string | null, action: string, title: string): Promise<Result>; refresh(): void;
}
const Context = React.createContext<ContextValue | null>(null);
export function WorkbenchProvider({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser(), path = usePathname(), router = useRouter();
  const [live, setData] = React.useState(emptyStore), [loaded, setLoaded] = React.useState(false), [error, setError] = React.useState<string | null>(null), [notice, setNotice] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState(false), [saving, setSaving] = React.useState(false), [editor, setEditor] = React.useState<Editor | null>(null), [pending, setPending] = React.useState<(() => void) | null>(null);
  const busy = React.useRef(false);
  const [ui, setUI] = React.useState<UI>(() => ({ filter: emptyFilter(), group: "status", layout: "board", timeline: "events", start: addCalendarDays(shanghaiToday(), -3), days: 30, dueDays: 7 }));
  const data = React.useMemo(() => preview ? demoStore(shanghaiToday()) : live, [preview, live]);
  const dirty = editor !== null && JSON.stringify(editor.value) !== editor.initial;
  const refresh = React.useCallback(() => { const r = readWorkbench(user.id); if (r.ok && r.data) { setData(r.data); setError(null); } else if (!r.ok) setError(r.error); setLoaded(true); }, [user.id]);
  React.useEffect(() => { let alive = true; queueMicrotask(() => { if (alive) refresh(); }); const changed = (e: StorageEvent) => { if (e.key === null || e.key === workbenchKey(user.id)) refresh(); }; window.addEventListener("storage", changed); return () => { alive = false; window.removeEventListener("storage", changed); }; }, [refresh, user.id]);
  React.useEffect(() => { if (!dirty) return; const leave = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", leave); return () => window.removeEventListener("beforeunload", leave); }, [dirty]);
  const requestLeave = React.useCallback((action: () => void) => { if (busy.current) return false; if (dirty) { setPending(() => action); return false; } setEditor(null); action(); return true; }, [dirty]);
  const open = (kind: Kind, id?: string, defaults?: Partial<Value>) => {
    if (!loaded || error || preview) return;
    let value: Value;
    if (kind === "settings") value = structuredClone(live.settings);
    else if (kind === "task") value = structuredClone(live.tasks.find(t => t.id === id) ?? { ...emptyTask(), module: ui.filter.module || live.settings.modules[0] || "", owner: ui.filter.owner || live.settings.members[0] || "", ...defaults });
    else if (kind === "line") value = structuredClone(live.lines.find(l => l.id === id) ?? { title: id === DEFAULT_LINE ? "重要发布与交付" : "", description: "", ...defaults });
    else value = structuredClone(live.events.find(e => e.id === id) ?? { title: "", date: shanghaiToday(), lineId: DEFAULT_LINE, description: "", ...defaults });
    requestLeave(() => { setNotice(null); setEditor({ kind, id, value, revision: live.revision, initial: JSON.stringify(value), origin: path }); });
  };
  const commit = async (next: WorkbenchStore, revision: string | null, action: string, title: string): Promise<Result> => {
    if (preview || !loaded || error || busy.current) return { ok: false, error: error || "当前不可保存，请退出示例或等待保存完成。" };
    busy.current = true; setSaving(true);
    try {
      const s = { ...next, activities: [{ id: crypto.randomUUID(), at: new Date().toISOString(), actor: user.displayName, action, title: title.slice(0, 160) }, ...next.activities].slice(0, 40) };
      const r = await writeWorkbench(user.id, revision, s);
      if (r.ok && r.data) { setData(r.data); setNotice("已保存到本机 · 当前演示身份"); } else if (!r.ok) { setNotice(r.error); refresh(); }
      return r;
    } finally { busy.current = false; setSaving(false); }
  };
  const save = async (): Promise<Result> => {
    if (!editor) return { ok: false, error: "没有正在编辑的内容。" };
    const v = editor.value, invalid = validation(editor.kind, v, live); if (invalid) return { ok: false, error: invalid };
    const next = { ...live }, now = new Date().toISOString(), old = editor.kind === "task" ? live.tasks.find(t => t.id === editor.id) : editor.kind === "line" ? live.lines.find(t => t.id === editor.id) : live.events.find(t => t.id === editor.id);
    if (editor.kind === "settings") next.settings = structuredClone(v as WorkbenchStore["settings"]);
    else {
      const item = { ...v, id: editor.id ?? crypto.randomUUID(), createdAt: old?.createdAt ?? now, updatedAt: now };
      if (editor.kind === "task") next.tasks = [...live.tasks.filter(t => t.id !== item.id), item as Task];
      if (editor.kind === "line") next.lines = [...live.lines.filter(t => t.id !== item.id), item as WorkbenchStore["lines"][number]];
      if (editor.kind === "event") next.events = [...live.events.filter(t => t.id !== item.id), item as WorkbenchStore["events"][number]];
    }
    const r = await commit(next, editor.revision, editor.id || editor.kind === "settings" ? "更新" : "新增", "title" in v ? v.title : v.name); if (r.ok) setEditor(null); return r;
  };
  const remove = async (): Promise<Result> => {
    if (!editor?.id || editor.kind === "settings" || (editor.kind === "line" && editor.id === DEFAULT_LINE)) return { ok: false, error: "该记录不可删除。" };
    const next = { ...live };
    if (editor.kind === "task") next.tasks = live.tasks.filter(t => t.id !== editor.id);
    if (editor.kind === "event") next.events = live.events.filter(t => t.id !== editor.id);
    if (editor.kind === "line") { next.lines = live.lines.filter(t => t.id !== editor.id); next.events = live.events.map(e => e.lineId === editor.id ? { ...e, lineId: DEFAULT_LINE, updatedAt: new Date().toISOString() } : e); }
    const r = await commit(next, editor.revision, "删除", "title" in editor.value ? editor.value.title : "记录"); if (r.ok) setEditor(null); return r;
  };
  const updateTask = (t: Task) => commit({ ...live, tasks: live.tasks.map(x => x.id === t.id ? { ...t, updatedAt: new Date().toISOString() } : x) }, live.revision, "调整", t.title);
  return <Context.Provider value={{ data, live, loaded, error, notice, preview, saving, pending: pending !== null, editor, setEditor, ui, setUI, open, close: () => requestLeave(() => setEditor(null)), requestLeave, togglePreview: () => requestLeave(() => { setPreview(p => !p); setUI(u => ({ ...u, filter: emptyFilter() })); }), save, remove, updateTask, commit, refresh }}>
    {children}
    {editor && path !== editor.origin && <div role="status" className="fixed right-4 bottom-4 z-(--z-toast) max-w-[calc(100%-2rem)] rounded-card border border-control bg-surface p-3 shadow-overlay"><p>工作台还有未保存的内容。</p><Button onClick={() => router.push(editor.origin)}>返回继续编辑</Button></div>}
    <Dialog open={pending !== null} onOpenChange={o => { if (!o) setPending(null); }}><DialogContent showCloseButton={false}><DialogHeader><DialogTitle>工作台内容还没有保存</DialogTitle><DialogDescription>继续编辑会保留输入；放弃仅丢弃本次修改。</DialogDescription></DialogHeader><DialogFooter><Button variant="danger" onClick={() => { const action = pending; setPending(null); setEditor(null); action?.(); }}>放弃更改</Button><Button variant="primary" autoFocus onClick={() => { setPending(null); if (editor && path !== editor.origin) router.push(editor.origin); }}>继续编辑</Button></DialogFooter></DialogContent></Dialog>
  </Context.Provider>;
}
export function useWorkbench() { const ctx = React.useContext(Context); if (!ctx) throw new Error("WorkbenchProvider missing"); return ctx; }
