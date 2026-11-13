"use client";

import * as React from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, ExternalLink, Plus, Search, UsersRound } from "lucide-react";
import { PageHeader, Panel, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACCOUNT_STATUSES, GROUPS, type AccountRef } from "./model";
import { usePublication } from "./publication-provider";
import { AccountEditor, selectClass } from "./account-editor";
import { PublicationNotice, ScheduleEditor } from "./schedule-editor";

const display = (value: number | null | undefined) => value == null ? "—" : value.toLocaleString("zh-CN");

export function AccountsPage() {
  const { data, accounts, loaded, loadError, openAccount, openSchedule } = usePublication();
  const [scope, setScope] = React.useState<"managed" | "history">("managed");
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const filtered = accounts.filter(a => (scope === "managed" ? a.managed : a.history) && (!group || a.group === group) && (!status || (a.managed && a.status === status)) && [a.name, a.uid, a.managed?.supplier, a.managed?.manager, a.managed?.category, a.history?.suppliers.join(" ")].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)), shownPage = Math.min(page, pages);
  const rows = filtered.slice((shownPage - 1) * 10, shownPage * 10);
  const detail = accounts.find(a => a.id === detailId);
  const nextFor = (a: AccountRef) => data.schedules.filter(s => s.accountId === a.id && s.status === "planned").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  return <>
    <PageHeader eyebrow="THIRD-PARTY / ACCOUNT REGISTRY" title="账号入库" description="把账号信息、归属与合作资料收齐，再安排每一次发布。" actions={<Button variant="primary" disabled={!loaded || Boolean(loadError)} onClick={() => openAccount()}><Plus aria-hidden />新增账号</Button>} />
    <PublicationNotice />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {[{ label: "已入库资料", count: data.accounts.length, note: "当前身份 · 人工维护" }, { label: "蘑菇 / 伏羲", count: `${data.accounts.filter(a => a.group === "蘑菇").length} / ${data.accounts.filter(a => a.group === "伏羲").length}`, note: "归属标签，独立于供应商名称" }, { label: "历史账号", count: accounts.filter(a => a.history).length, note: "只读快照，补充资料不改历史指标" }].map(item => <Panel key={item.label} className="p-5"><p className="text-caption text-fg-secondary">{item.label}</p><p className="mt-2 font-numeric text-[1.75rem] font-semibold text-fg">{item.count}</p><p className="mt-1 text-caption text-fg-secondary">{item.note}</p></Panel>)}
    </div>
    <Panel className="mb-5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="账号资料范围" className="flex flex-wrap gap-1 rounded-control bg-subtle p-1">{[{ id: "managed", label: "已入库账号" }, { id: "history", label: "历史账号目录" }].map(s => <Button key={s.id} aria-pressed={scope === s.id} variant={scope === s.id ? "primary" : "ghost"} onClick={() => { setScope(s.id as typeof scope); setPage(1); }}>{s.label}</Button>)}</div>
        <div className="relative min-w-0 flex-[1_1_15rem]"><Search aria-hidden className="absolute top-3 left-3 size-4 text-fg-muted" /><Input className="pl-9" aria-label="搜索账号资料" placeholder="搜索账号、UID、供应商或负责人" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></div>
        <select aria-label="筛选归属标签" className={`${selectClass} sm:w-auto`} value={group} onChange={e => { setGroup(e.target.value); setPage(1); }}><option value="">全部归属</option>{GROUPS.map(g => <option key={g}>{g}</option>)}</select>
        <select aria-label="筛选账号状态" className={`${selectClass} sm:w-auto`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">全部状态</option>{Object.entries(ACCOUNT_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      </div>
    </Panel>
    <Panel className="overflow-hidden">
      <div className="border-b border-line px-5 py-4"><SectionTitle>{scope === "managed" ? "账号管理资料" : "历史账号目录"}</SectionTitle><p className="mt-1 text-caption text-fg-secondary">{scope === "managed" ? "手机号、结算方式等资料在编辑窗口维护；发布计划与日历共用这些账号。" : "当前工作区尚未导入历史账号。清零前的账号与作品资料已单独保全。"}</p></div>
      {rows.length > 0 ? <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="账号资料表格，可横向滚动"><table className="w-full min-w-[1020px] text-left text-body">
        <thead className="bg-subtle text-caption text-fg-secondary"><tr>{["账号 / UID", "归属 / 供应商", "类型 / 人设", "管理人员", "账号状态", "最早待办排期", "操作"].map(label => <th scope="col" key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{rows.map(a => { const next = nextFor(a); return <tr key={a.id} className="hover:bg-hover">
          <td className="max-w-[13rem] px-5 py-4"><button className="text-left font-medium break-anywhere text-accent hover:underline" onClick={() => setDetailId(a.id)}>{a.name}</button><p className="mt-1 font-numeric text-caption text-fg-secondary">{a.uid ? `UID ${a.uid}` : "历史 UID 缺失"}</p>{a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-caption text-fg-secondary hover:text-accent">B站主页<ExternalLink className="size-3" aria-hidden /></a>}</td>
          <td className="px-5 py-4">{a.group ? <Badge tone="info">{a.group}</Badge> : <span className="text-fg-secondary">未标记</span>}<p className="mt-1 text-caption text-fg-secondary">{a.managed?.supplier || a.history?.suppliers.join("、") || "未填写"}</p></td>
          <td className="max-w-[12rem] px-5 py-4 break-anywhere">{a.managed?.category || "未填写"}<p className="mt-1 text-caption text-fg-secondary">{a.managed?.persona || "人设待补充"}</p></td>
          <td className="px-5 py-4">{a.managed?.manager || "未填写"}</td>
          <td className="px-5 py-4">{a.managed ? <Badge tone={a.status === "active" ? "success" : a.status === "attention" ? "warning" : "neutral"}>{ACCOUNT_STATUSES[a.status]}</Badge> : <Badge>待确认</Badge>}</td>
          <td className="px-5 py-4 font-numeric text-caption">{next ? <>{next.date}<br />{next.time} · 上海</> : "暂无计划"}</td>
          <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => openAccount(a.managed, a.history)}>{a.managed ? "编辑资料" : "补充入库"}</Button><Button size="sm" disabled={a.status === "retired" || Boolean(loadError)} onClick={() => openSchedule(undefined, { accountId: a.id })}><CalendarPlus aria-hidden />安排发布</Button></div></td>
        </tr>; })}</tbody>
      </table></div> : <div className="px-6 py-14 text-center"><UsersRound aria-hidden className="mx-auto mb-4 size-9 text-fg-muted" /><h2 className="text-section font-semibold">{query || group || status ? "没有符合筛选的账号" : "从第一个账号开始"}</h2><p className="mx-auto mt-2 max-w-lg text-body text-fg-secondary">{query || group || status ? "调整搜索词或归属、状态筛选后再试。" : "录入 UID 和昵称，标记归属；入库后就能建立发布计划。历史账号资料已单独保全，当前不会自动导入。"}</p><Button className="mt-5" onClick={() => { if (query || group || status) { setQuery(""); setGroup(""); setStatus(""); } else openAccount(); }}>{query || group || status ? "清空筛选" : "录入账号"}</Button></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3"><span className="text-caption text-fg-secondary">共 {filtered.length} 个账号 · 每页 10 条</span><div className="flex items-center gap-2"><Button size="icon" aria-label="上一页账号" disabled={shownPage <= 1} onClick={() => setPage(shownPage - 1)}><ChevronLeft aria-hidden /></Button><span className="text-caption">{shownPage} / {pages}</span><Button size="icon" aria-label="下一页账号" disabled={shownPage >= pages} onClick={() => setPage(shownPage + 1)}><ChevronRight aria-hidden /></Button></div></div>
    </Panel>
    <Dialog open={Boolean(detail)} onOpenChange={open => { if (!open) setDetailId(null); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{detail?.name}</DialogTitle><DialogDescription>账号资料与最新 3 条历史视频；历史播放是采集快照，不自动更新。</DialogDescription></DialogHeader>{detail && <>
      <div className="flex flex-wrap gap-2"><Badge tone="info">{detail.group ?? "归属待补充"}</Badge><Badge>{detail.history ? `历史 ${detail.history.workCount} 条作品` : "尚无历史作品"}</Badge></div>
      <dl className="grid grid-cols-2 gap-3 text-body"><div><dt className="text-caption text-fg-secondary">结算方式</dt><dd>{detail.managed?.settlement || "未填写"}</dd></div><div><dt className="text-caption text-fg-secondary">供应商管理人员</dt><dd>{detail.managed?.manager || "未填写"}</dd></div></dl>
      {detail.history?.works.length ? <ul className="divide-y divide-line">{detail.history.works.map(w => <li key={w.id} className="py-3"><p className="break-anywhere font-medium">{w.link ? <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{w.title || w.id}</a> : w.title || w.id}</p><p className="mt-1 text-caption text-fg-secondary">{w.date ?? "日期未知"} · 播放 {display(w.view)} · 点赞 {display(w.like)} · 评论 {display(w.reply)}</p></li>)}</ul> : <p className="rounded-control bg-subtle p-4 text-fg-secondary">暂无历史效果。排期保存不会生成播放或发布记录。</p>}
    </>}</DialogContent></Dialog>
    <AccountEditor /><ScheduleEditor />
  </>;
}
