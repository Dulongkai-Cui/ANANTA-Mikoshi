"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { PageHeader, Panel } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GROUPS, matchesScheduleStatus, SCHEDULE_STATUSES } from "./model";
import { usePublication } from "./publication-provider";
import { PublicationNotice, ScheduleActions, ScheduleEditor, ScheduleStatusBadge, scheduleSelectClass } from "./schedule-editor";

export function PlansPage() {
  const { data, accounts, loaded, loadError, openSchedule } = usePublication();
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const keyword = query.trim().toLocaleLowerCase();
  const filtered = data.schedules.filter((item) => {
    const account = accountMap.get(item.accountId);
    if (!matchesScheduleStatus(item, status)) return false;
    if (group === "unassigned" && account?.group) return false;
    if (group && group !== "unassigned" && account?.group !== group) return false;
    return !keyword || `${item.title} ${item.content} ${account?.name ?? ""} ${account?.uid ?? ""}`.toLocaleLowerCase().includes(keyword);
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.id.localeCompare(b.id));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * 20, current * 20);
  const anyFilter = !!(query || group || status);

  return <div className="@container min-w-0">
    <PageHeader eyebrow="Publishing plans" title="发布计划" description="管理 B站的具体发布安排，与发布日历同步。仅保存到本机，不会自动投递或生成发布结果。"
      meta={<><Badge tone="info">B站</Badge><Badge tone="neutral">上海时间 · UTC+8</Badge></>}
      actions={<Button variant="primary" disabled={!loaded || !!loadError} onClick={() => openSchedule()}><Plus aria-hidden />新增排期</Button>} />
    <PublicationNotice />
    {loaded && <>
      <Panel aria-label="发布计划筛选" className="mb-4 p-4">
        <div className="grid min-w-0 gap-3 @min-[42rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-1.5"><Label htmlFor="plan-search">搜索排期与账号</Label><Input id="plan-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="标题、内容、账号或 UID" /></div>
          <div className="min-w-0 space-y-1.5"><Label htmlFor="plan-group-filter">账号归属</Label><select id="plan-group-filter" value={group} onChange={(event) => { setGroup(event.target.value); setPage(1); }} className={scheduleSelectClass}><option value="">全部归属</option>{GROUPS.map((item) => <option key={item}>{item}</option>)}<option value="unassigned">未标归属</option></select></div>
          <div className="min-w-0 space-y-1.5"><Label htmlFor="plan-status-filter">排期状态</Label><select id="plan-status-filter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={scheduleSelectClass}><option value="">未撤下的计划</option>{Object.entries(SCHEDULE_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <Button className="self-end" disabled={!anyFilter} onClick={() => { setQuery(""); setGroup(""); setStatus(""); setPage(1); }}>清除筛选</Button>
        </div>
      </Panel>
      <Panel aria-label="发布排期列表" className="overflow-hidden">
        <div className="flex flex-wrap justify-between gap-2 border-b border-line px-4 py-3"><p className="text-body font-medium text-fg">{filtered.length} 条排期</p><p className="text-caption text-fg-muted">按计划日期升序 · 不含实际发布回执</p></div>
        {rows.length ? <div role="region" aria-label="排期表格，可横向滚动" tabIndex={0} className="overflow-x-auto p-0.5">
          <table className="w-full min-w-[56rem] border-collapse text-left text-body">
            <thead className="bg-subtle text-caption text-fg-secondary"><tr>{["计划时间（上海）", "排期标题 / 内容", "发布账号", "归属", "状态", "确认状态", "操作"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap border-b border-line px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{rows.map((item) => {
              const account = accountMap.get(item.accountId);
              return <tr key={item.id} data-schedule-id={item.id} className="align-top hover:bg-hover">
                <td className="whitespace-nowrap px-4 py-3 text-fg-secondary tabular"><span className="block font-medium text-fg">{item.date}</span>{item.time}</td>
                <td className="min-w-[13rem] max-w-[24rem] px-4 py-3"><button type="button" className="cursor-pointer break-anywhere text-left font-medium text-accent underline-offset-2 hover:underline" aria-label={`打开排期：${item.title}`} onClick={() => openSchedule(item)}>{item.title}</button><p className="mt-1 line-clamp-2 break-anywhere text-caption text-fg-muted">{item.content.trim() || "内容待补"}</p></td>
                <td className="min-w-[9rem] max-w-[16rem] break-anywhere px-4 py-3"><p className="text-fg">{account?.name ?? "账号资料暂不可用"}</p><p className="mt-1 text-caption text-fg-muted">B站 · UID {account?.uid ?? "未提供"}</p></td>
                <td className="px-4 py-3 text-fg-secondary">{account?.group ?? "未标归属"}</td>
                <td className="min-w-[9rem] px-4 py-3"><ScheduleStatusBadge item={item} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-fg-secondary">{item.review === "confirmed" ? "人工确认" : "待确认"}</td>
                <td className="min-w-[11rem] px-4 py-3"><ScheduleActions item={item} /></td>
              </tr>;
            })}</tbody>
          </table>
        </div> : <div className="px-4 py-12 text-center"><h2 className="text-section font-medium text-fg">{anyFilter ? "没有符合筛选的排期" : "还没有发布排期"}</h2><p className="mt-2 text-body text-fg-secondary">{anyFilter ? "调整搜索或清除筛选，查看其他记录。" : "点击“新增排期”，选择账号并安排第一条内容。"}</p></div>}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-4 py-3 text-body text-fg-secondary"><span>每页 20 条 · 第 {current} / {pages} 页</span><Button size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>上一页</Button><Button size="sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>下一页</Button></div>
      </Panel>
    </>}
    <ScheduleEditor />
  </div>;
}
