"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Archive, CalendarClock, RotateCcw, SquarePen, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

import { isOverdue, SCHEDULE_STATUSES, type Editor, type FieldErrors, type PublicationSchedule, type ScheduleInput } from "./model";
import { usePublication } from "./publication-provider";

export const scheduleSelectClass = "min-h-9 w-full min-w-0 rounded-control border border-control bg-surface px-3 py-1.5 text-body text-fg max-sm:min-h-11";
const textAreaClass = "w-full min-w-0 resize-y rounded-control border border-control bg-surface px-3 py-2 text-body text-fg aria-invalid:border-danger";

export function ScheduleStatusBadge({ item, solid = false }: { item: PublicationSchedule; solid?: boolean }) {
  return <span className="flex flex-wrap items-center gap-1.5">
    <Badge className={solid ? "bg-surface" : undefined} tone={item.status === "planned" ? "info" : "neutral"}>{SCHEDULE_STATUSES[item.status]}</Badge>
    {isOverdue(item) && <Badge className={solid ? "bg-surface" : undefined} tone="warning">逾期待核对</Badge>}
    {!item.content.trim() && item.status === "planned" && <Badge className={solid ? "bg-surface" : undefined} tone="warning">内容待补</Badge>}
  </span>;
}

export function PublicationNotice() {
  const { loaded, loadError, historyError, notice, refresh } = usePublication();
  return <div className="mb-4 space-y-2">
    {!loaded && <p role="status" className="rounded-control bg-subtle px-3 py-2 text-body text-fg-secondary">正在读取本机资料…</p>}
    {loadError && <div role="alert" className="rounded-control border border-danger/40 bg-danger-soft p-3 text-body text-danger">
      <p>{loadError}</p><Button className="mt-2" onClick={refresh}>重新读取</Button>
    </div>}
    {historyError && <div role="alert" className="rounded-control border border-warning/40 bg-warning-soft p-3 text-body text-warning">
      <p>{historyError}</p><Button className="mt-2" onClick={refresh}>重试历史资料</Button>
    </div>}
    {notice && <p role="status" className="rounded-control bg-accent-soft px-3 py-2 text-body text-accent">{notice}</p>}
  </div>;
}

/** The provider owns identity, revision checking and persistence; this component owns confirmations. */
export function ScheduleActions({ item, className, inEditor = false, disabled = false }: { item: PublicationSchedule; className?: string; inEditor?: boolean; disabled?: boolean }) {
  const { accounts, openSchedule, setScheduleStatus, setEditor } = usePublication();
  const [confirmation, setConfirmation] = React.useState<{ item: PublicationSchedule; target: ScheduleInput["status"] } | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const errorRef = React.useRef<HTMLParagraphElement>(null);
  const busy = React.useRef(false);
  const account = accounts.find((entry) => entry.id === item.accountId);
  const inactive = item.status !== "planned";
  const restoreDisabled = !account || account.status === "retired";

  async function changeStatus() {
    if (busy.current || !confirmation) return;
    busy.current = true; setPending(true); setError(null);
    // Preserve the version the person confirmed, even if a storage event updates the list meanwhile.
    const result = await setScheduleStatus(confirmation.item, confirmation.target);
    busy.current = false; setPending(false);
    if (result.ok) { setConfirmation(null); if (inEditor) setEditor(null); }
    else { setError(result.error); requestAnimationFrame(() => errorRef.current?.focus()); }
  }

  return <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
    {!inEditor && <Button type="button" size="sm" onClick={() => openSchedule(item)} aria-label={`编辑排期：${item.title}`}><SquarePen aria-hidden />编辑</Button>}
    <Button type="button" size="sm" variant={inactive ? "secondary" : "ghost"} disabled={disabled || (inactive && restoreDisabled)}
      title={inactive && restoreDisabled ? "账号已停用或不可用，不能恢复排期" : undefined}
      aria-label={`${inactive ? "恢复" : "取消"}排期：${item.title}`}
      onClick={() => { setError(null); setConfirmation({ item, target: inactive ? "planned" : "cancelled" }); }}>
      {inactive ? <RotateCcw aria-hidden /> : <X aria-hidden />}{inactive ? "恢复计划" : "取消计划"}
    </Button>
    {item.status !== "withdrawn" && <Button type="button" size="sm" variant="danger" disabled={disabled} aria-label={`撤下计划：${item.title}`} onClick={() => { setError(null); setConfirmation({ item, target: "withdrawn" }); }}><Archive aria-hidden />撤下计划</Button>}
    <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !pending) setConfirmation(null); }}>
      <DialogContent showCloseButton={!pending} onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>{confirmation?.target === "planned" ? "恢复这条排期？" : confirmation?.target === "withdrawn" ? "撤下这条计划？" : "取消这条排期？"}</DialogTitle>
          <DialogDescription>“{confirmation?.item.title}” · {confirmation?.item.date} {confirmation?.item.time}（上海时间）。{confirmation?.target === "planned" ? "恢复后将重新计入发布计划；系统会检查账号状态和时间冲突。" : confirmation?.target === "withdrawn" ? "这条记录将从默认计划列表和日历中移走，可通过“已撤下”筛选查看和恢复。不会撤回任何已发布的外站内容。" : "只取消这条计划，记录仍显示并可恢复。如需从默认列表与日历移走，请选择撤下计划。"}{inEditor ? "本窗口尚未保存的修改不会保存。" : ""}</DialogDescription>
        </DialogHeader>
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="break-anywhere rounded-control bg-danger-soft p-3 text-body text-danger">{error}</p>}
        <DialogFooter><Button type="button" disabled={pending} onClick={() => setConfirmation(null)}>返回</Button><Button type="button" variant={confirmation?.target === "planned" ? "primary" : "danger"} pending={pending} onClick={changeStatus}>{confirmation?.target === "planned" ? "确认恢复" : confirmation?.target === "withdrawn" ? "确认撤下计划" : "确认取消排期"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

export function ScheduleEditor() {
  const { editor } = usePublication();
  const pathname = usePathname();
  if (editor?.kind !== "schedule" || editor.originPath !== pathname) return null;
  return <ScheduleEditorForm key={`${editor.id ?? "new"}:${editor.initial}`} editor={editor} />;
}

function ScheduleEditorForm({ editor }: { editor: Extract<Editor, { kind: "schedule" }> }) {
  const { data, accounts, setEditor, closeEditor, saveEditor, loadError } = usePublication();
  const [fields, setFields] = React.useState<FieldErrors>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [accountQuery, setAccountQuery] = React.useState("");
  const busy = React.useRef(false);
  const summary = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const value = editor.value;
  // Freeze the record version from when editing began, including nested confirmations.
  const [savedItem] = React.useState(() => data.schedules.find(item => item.id === editor.id));
  const selectable = accounts.filter((account) => account.id === value.accountId ||
    `${account.name} ${account.uid ?? ""} ${account.group ?? ""}`.toLocaleLowerCase().includes(accountQuery.trim().toLocaleLowerCase()));
  const update = <K extends keyof ScheduleInput>(key: K, next: ScheduleInput[K]) => {
    setEditor((current) => current?.kind === "schedule" ? { ...current, value: { ...current.value, [key]: next } } : current);
    setFields((current) => { const next = { ...current }; delete next[key]; return next; });
  };
  const fieldProps = (key: string) => ({ id: `${id}-${key}`, "aria-invalid": !!fields[key], "aria-describedby": fields[key] ? `${id}-${key}-error` : undefined });
  const fieldError = (key: string) => fields[key] ? <p id={`${id}-${key}-error`} className="mt-1 text-caption text-danger">{fields[key]}</p> : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null); setFields({});
    const result = await saveEditor();
    busy.current = false; setPending(false);
    if (!result.ok) {
      setFields(result.fields ?? {}); setError(result.error);
      requestAnimationFrame(() => summary.current?.focus());
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !pending) closeEditor(); }}>
    <DialogContent className="max-w-2xl" showCloseButton={!pending}
      onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
      <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarClock aria-hidden className="size-5 shrink-0 text-accent" />{editor.id ? "编辑发布排期" : "新增发布排期"}</DialogTitle>
        <DialogDescription>保存到本机；用于记录 B站发布安排，不会自动发布。时间统一为 Asia/Shanghai。</DialogDescription>
      </DialogHeader>
      <form noValidate onSubmit={submit} className="min-w-0 space-y-4">
        {error && <div ref={summary} tabIndex={-1} role="alert" className="rounded-control bg-danger-soft p-3 text-body text-danger">
          <p>{error}</p>{Object.entries(fields).length > 0 && <ul className="mt-1 list-disc pl-4">{Object.entries(fields).map(([key, message]) => <li key={key}><a href={`#${id}-${key}`} onClick={(event) => { event.preventDefault(); document.getElementById(`${id}-${key}`)?.focus(); }} className="underline underline-offset-2">{message}</a></li>)}</ul>}
        </div>}
        {value.status !== "planned" && <p className="rounded-control bg-subtle p-3 text-body text-fg-secondary">这条排期{SCHEDULE_STATUSES[value.status]}。编辑并保存不会恢复，请使用“恢复计划”。</p>}
        {savedItem && <div className="space-y-2 rounded-control border border-line bg-subtle p-3"><p className="text-caption text-fg-secondary">已保存计划的操作</p><ScheduleActions item={savedItem} inEditor disabled={pending || !!loadError} /></div>}
        <fieldset disabled={pending} className="min-w-0 space-y-4">
          <div className="space-y-2"><Label htmlFor={`${id}-accountQuery`}>筛选账号</Label><Input id={`${id}-accountQuery`} value={accountQuery} onChange={(event) => setAccountQuery(event.target.value)} placeholder="按昵称、UID 或归属查找" />
            <Label htmlFor={`${id}-accountId`}>发布账号 <span className="text-danger">*</span></Label>
            <select {...fieldProps("accountId")} className={scheduleSelectClass} value={value.accountId} onChange={(event) => update("accountId", event.target.value)} required>
              <option value="">请选择 B站账号</option>{selectable.map((account) => <option key={account.id} value={account.id} disabled={account.status === "retired" && account.id !== value.accountId}>{account.name} · {account.group ?? "未标归属"}{account.status === "retired" ? " · 已停用" : ""}</option>)}
            </select>{fieldError("accountId")}
            {!selectable.length && <p className="text-caption text-fg-secondary">没有匹配账号，请调整筛选词，或先到账号入库添加。</p>}
          </div>
          <div className="space-y-2"><Label htmlFor={`${id}-title`}>排期标题 <span className="text-danger">*</span></Label><Input {...fieldProps("title")} required maxLength={160} value={value.title} onChange={(event) => update("title", event.target.value)} placeholder="例如：本周角色短片" />{fieldError("title")}</div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2"><Label htmlFor={`${id}-date`}>计划日期 <span className="text-danger">*</span></Label><Input {...fieldProps("date")} type="date" min="2000-01-01" max="2100-12-31" required value={value.date} onChange={(event) => update("date", event.target.value)} />{fieldError("date")}</div>
            <div className="min-w-0 space-y-2"><Label htmlFor={`${id}-time`}>计划时间 <span className="text-danger">*</span></Label><Input {...fieldProps("time")} type="time" required value={value.time} onChange={(event) => update("time", event.target.value)} />{fieldError("time")}</div>
          </div>
          <div className="space-y-2"><Label htmlFor={`${id}-content`}>内容说明 <span className="font-normal text-fg-muted">选填</span></Label><textarea {...fieldProps("content")} rows={3} maxLength={4000} className={textAreaClass} value={value.content} onChange={(event) => update("content", event.target.value)} placeholder="记录内容要点或待准备事项；留空会显示“内容待补”" />{fieldError("content")}</div>
          <div className="space-y-2"><Label htmlFor={`${id}-review`}>确认状态</Label><select {...fieldProps("review")} className={scheduleSelectClass} value={value.review} onChange={(event) => update("review", event.target.value as ScheduleInput["review"])}><option value="pending">待确认</option><option value="confirmed">人工确认</option></select>{fieldError("review")}<p className="text-caption text-fg-muted">只记录人工确认，不代表已通过平台审核或实际发布。</p></div>
          <div className="space-y-2"><Label htmlFor={`${id}-notes`}>备注 <span className="font-normal text-fg-muted">选填</span></Label><textarea {...fieldProps("notes")} rows={2} maxLength={2000} className={textAreaClass} value={value.notes} onChange={(event) => update("notes", event.target.value)} />{fieldError("notes")}</div>
        </fieldset>
        <DialogFooter><Button type="button" disabled={pending} onClick={closeEditor}>取消</Button><Button type="submit" variant="primary" pending={pending} disabled={!!loadError}>保存排期</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
