"use client";

import * as React from "react";
import { Archive, CalendarClock, RotateCcw, SquarePen, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shell/page-header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { SCHEDULE_STATUSES, isOverdue, planBlocked, talentForSchedule, type Schedule, type ScheduleInput } from "./model";
import { useKol } from "./kol-provider";

export const selectClass = "min-h-9 w-full min-w-0 rounded-control border border-control bg-surface px-3 py-1.5 text-body text-fg max-sm:min-h-11";
export const numberText = (n: number | null) => n === null ? "—" : n.toLocaleString("zh-CN");
export const moneyText = (n: number | null) => n === null ? "—" : `¥${n.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
export const updateText = (value: string) => new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
export function KolNotice() {
  const { loaded, loadError, notice, refresh } = useKol();
  return <div className="mb-4 space-y-2">{!loaded && <p role="status" className="text-body text-fg-secondary">正在读取本机 KOL 资料…</p>}{loadError && <div role="alert" className="rounded-control border border-danger/40 bg-danger-soft p-3 text-body text-danger"><p>{loadError}</p><Button className="mt-2" onClick={refresh}>重新读取</Button></div>}{notice && <p role="status" className="rounded-control bg-accent-soft px-3 py-2 text-body text-accent">{notice}</p>}</div>;
}
export function MetricStrip({ items }: { items: { label: string; value: React.ReactNode; note: string }[] }) {
  return <div className="mb-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(item => <Panel key={item.label} className="p-5"><p className="text-caption text-fg-secondary">{item.label}</p><p className="mt-2 break-anywhere font-numeric text-metric font-semibold text-fg">{item.value}</p><p className="mt-1 text-caption text-fg-secondary">{item.note}</p></Panel>)}</div>;
}
export function ScheduleBadge({ item }: { item: Schedule }) {
  const { data } = useKol();
  return <span className="flex flex-wrap gap-1.5"><Badge tone={item.status === "planned" ? "info" : "neutral"}>{SCHEDULE_STATUSES[item.status]}</Badge>{isOverdue(item) && <Badge tone="warning">逾期待核对</Badge>}{item.status === "planned" && planBlocked(item, data) && <Badge tone="warning">合作或达人待核对</Badge>}</span>;
}
export function ScheduleActions({ item, inEditor = false }: { item: Schedule; inEditor?: boolean }) {
  const { data, loadError, openSchedule, setScheduleStatus, setEditor } = useKol();
  const [confirmation, setConfirmation] = React.useState<{ item: Schedule; status: ScheduleInput["status"] } | null>(null);
  const [error, setError] = React.useState<string | null>(null), [pending, setPending] = React.useState(false);
  const busy = React.useRef(false), errorRef = React.useRef<HTMLParagraphElement>(null);
  const inactive = item.status !== "planned";
  const talent = talentForSchedule(item, data), cooperation = data.collaborations.find(c => c.id === item.collaborationId);
  const restoreReasons = inactive ? [
    talent?.status === "archived" ? "达人已停用，请先启用达人后恢复计划。" : "",
    cooperation?.stage === "cancelled" ? "合作已取消，请先恢复合作后恢复计划。" : "",
    !talent || !cooperation ? "关联资料暂不可用，请先核对达人与合作后恢复计划。" : "",
  ].filter(Boolean) : [];
  const choose = (status: ScheduleInput["status"]) => { setError(null); setConfirmation({ item, status }); };
  const confirm = async () => {
    if (!confirmation || busy.current) return;
    busy.current = true; setPending(true); setError(null);
    const result = await setScheduleStatus(confirmation.item, confirmation.status);
    busy.current = false; setPending(false);
    if (result.ok) { setConfirmation(null); if (inEditor) setEditor(null); }
    else { setError(result.error); requestAnimationFrame(() => errorRef.current?.focus()); }
  };
  return <div className="flex flex-wrap gap-2">
    {!inEditor && <Button type="button" size="sm" disabled={Boolean(loadError)} aria-label={`编辑排期：${item.title}`} onClick={() => openSchedule(item)}><SquarePen aria-hidden />编辑</Button>}
    <Button type="button" size="sm" disabled={Boolean(loadError) || (inactive && planBlocked(item, data))} aria-label={`${inactive ? "恢复" : "取消"}排期：${item.title}`} onClick={() => choose(inactive ? "planned" : "cancelled")}>{inactive ? <RotateCcw aria-hidden /> : <X aria-hidden />}{inactive ? "恢复计划" : "取消计划"}</Button>
    {item.status !== "withdrawn" && <Button type="button" variant="danger" size="sm" disabled={Boolean(loadError)} aria-label={`撤下计划：${item.title}`} onClick={() => choose("withdrawn")}><Archive aria-hidden />撤下计划</Button>}
    {restoreReasons.length > 0 && <p className="basis-full break-anywhere text-caption text-fg-secondary">{restoreReasons.join(" ")}</p>}
    <Dialog open={Boolean(confirmation)} onOpenChange={open => { if (!open && !pending) setConfirmation(null); }}><DialogContent showCloseButton={!pending} onEscapeKeyDown={e => { if (pending) e.preventDefault(); }} onPointerDownOutside={e => { if (pending) e.preventDefault(); }}><DialogHeader><DialogTitle>{confirmation?.status === "planned" ? "恢复这条 KOL 排期？" : confirmation?.status === "withdrawn" ? "撤下这条 KOL 计划？" : "取消这条 KOL 排期？"}</DialogTitle><DialogDescription>{confirmation?.item.title} · {confirmation?.item.date} {confirmation?.item.time}（上海时间）。{confirmation?.status === "planned" ? "恢复时会重新检查达人、合作和时间冲突。" : confirmation?.status === "withdrawn" ? "记录保留在对应合作下，可恢复；不会撤回外站内容。" : "取消后记录保留可见，之后可以恢复或撤下。"}{inEditor ? "本窗口未保存修改会被放弃。" : ""}</DialogDescription></DialogHeader>{error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-control bg-danger-soft p-3 text-body text-danger">{error}</p>}<DialogFooter><Button type="button" disabled={pending} onClick={() => setConfirmation(null)}>返回</Button><Button type="button" variant={confirmation?.status === "planned" ? "primary" : "danger"} pending={pending} onClick={confirm}>{confirmation?.status === "planned" ? "确认恢复" : confirmation?.status === "withdrawn" ? "确认撤下计划" : "确认取消排期"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
export function TableFrame({ title, headers, children, className }: { title: string; headers: string[]; children: React.ReactNode; className?: string }) {
  return <div role="region" aria-label={`${title}，可横向滚动`} tabIndex={0} className="min-w-0 overflow-x-auto"><table className={cn("w-full min-w-[1050px] text-left text-body", className)}><thead className="bg-subtle text-caption text-fg-secondary"><tr>{headers.map(h => <th scope="col" key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{children}</tbody></table></div>;
}
export function Pagination({ total, page, size, onPage }: { total: number; page: number; size: number; onPage(value: number): void }) {
  const count = Math.max(1, Math.ceil(total / size));
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-caption text-fg-secondary"><span>共 {total} 条 · 每页 {size} 条</span><div className="flex flex-wrap items-center gap-2"><Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</Button><span>{page} / {count}</span><Button size="sm" disabled={page >= count} onClick={() => onPage(page + 1)}>下一页</Button></div></div>;
}
export function SchedulePlaceholder() {
  return <div className="mt-4 rounded-control border border-dashed border-control p-4"><CalendarClock aria-hidden className="mb-3 size-6 text-fg-secondary" /><p className="font-medium text-fg">待安排发布</p><dl className="mt-3 grid grid-cols-2 gap-3 text-caption"><div><dt className="text-fg-secondary">达人 / 合作</dt><dd className="mt-1">—</dd></div><div><dt className="text-fg-secondary">计划时间</dt><dd className="mt-1">—</dd></div></dl><p className="mt-3 text-caption text-fg-secondary">选择日期后新增排期，资料会同步到发布计划。</p></div>;
}
