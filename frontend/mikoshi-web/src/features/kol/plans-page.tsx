"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader, Panel, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORMS, SCHEDULE_STATUSES, isOverdue, matchesStatus, talentForSchedule } from "./model";
import { useKol } from "./kol-provider";
import { KolEditors } from "./editors";
import { KolNotice, MetricStrip, Pagination, ScheduleActions, ScheduleBadge, TableFrame, selectClass } from "./shared-ui";

export function PlansPage() {
  const { data, loaded, loadError, openSchedule } = useKol();
  const [query, setQuery] = React.useState(""), [platform, setPlatform] = React.useState(""), [status, setStatus] = React.useState(""), [page, setPage] = React.useState(1);
  const keyword = query.trim().toLocaleLowerCase();
  const filtered = data.schedules.filter(s => { const t = talentForSchedule(s, data), c = data.collaborations.find(c => c.id === s.collaborationId); return matchesStatus(s, status) && (!platform || t?.platform === platform) && [s.title, t?.name, c?.title, c?.owner].join(" ").toLocaleLowerCase().includes(keyword); }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const anyFilter = Boolean(query || platform || status);
  return <>
    <PageHeader eyebrow="KOL / PUBLISHING PLANS" title="发布计划" description="把每次发布关联到达人合作，跟进内容、确认与具体时间；计划与日历同步。" meta={<><Badge className="max-w-full whitespace-normal">上海时间 · UTC+8</Badge><Badge className="max-w-full whitespace-normal">本机管理 · 不自动发布</Badge></>} actions={<Button variant="primary" disabled={!loaded || Boolean(loadError)} onClick={() => openSchedule()}><Plus aria-hidden />新增排期</Button>} />
    <KolNotice />
    <MetricStrip items={[{ label: "有效计划", value: data.schedules.filter(s => s.status === "planned").length, note: "每条排期独立保留" }, { label: "待人工确认", value: data.schedules.filter(s => s.status === "planned" && s.review === "pending").length, note: "核对内容与达人档期" }, { label: "逾期待核对", value: data.schedules.filter(s => isOverdue(s)).length, note: "到时不自动认定已发布" }, { label: "已取消 / 已撤下", value: `${data.schedules.filter(s => s.status === "cancelled").length} / ${data.schedules.filter(s => s.status === "withdrawn").length}`, note: "记录保留，可筛查和恢复" }]} />
    <Panel className="mb-4 p-4" aria-label="KOL计划筛选"><div className="flex flex-wrap gap-3"><Input aria-label="搜索KOL排期" className="min-w-0 flex-[1_1_18rem]" placeholder="搜索排期、达人、合作或负责人" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /><select aria-label="计划平台筛选" className={`${selectClass} sm:w-auto`} value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}><option value="">全部平台</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select><select aria-label="计划状态筛选" className={`${selectClass} sm:w-auto`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">未撤下的计划</option>{Object.entries(SCHEDULE_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><Button disabled={!anyFilter} onClick={() => { setQuery(""); setPlatform(""); setStatus(""); setPage(1); }}>重置</Button></div></Panel>
    <Panel className="overflow-hidden"><div className="p-5"><SectionTitle>发布安排</SectionTitle><p className="mt-1 text-caption text-fg-secondary">取消仍显示在列表与日历；撤下默认隐藏，恢复时重新检查达人、合作及撞期。</p></div><TableFrame title="KOL发布计划表" headers={["计划时间", "排期 / 合作", "达人 / 平台", "内部认领人", "状态 / 确认", "操作"]}>
      {filtered.slice((current - 1) * 10, current * 10).map(s => { const t = talentForSchedule(s, data), c = data.collaborations.find(c => c.id === s.collaborationId); return <tr key={s.id} className="hover:bg-hover"><td className="px-4 py-4 font-numeric">{s.date}<p className="mt-1 text-caption text-fg-secondary">{s.time} · 上海</p></td><td className="max-w-[20rem] px-4 py-4"><button className="break-anywhere text-left font-medium text-accent hover:underline" onClick={() => openSchedule(s)}>{s.title}</button><p className="mt-1 break-anywhere text-caption text-fg-secondary">{c?.title}</p></td><td className="max-w-[14rem] px-4 py-4 break-anywhere">{t?.name}<p className="mt-1 text-caption text-fg-secondary">{t?.platform}</p></td><td className="max-w-[12rem] px-4 py-4 break-anywhere">{c?.owner || "待认领"}</td><td className="px-4 py-4"><ScheduleBadge item={s} /><p className="mt-1 text-caption text-fg-secondary">{s.review === "confirmed" ? "人工确认" : "待确认"}</p></td><td className="px-4 py-4"><ScheduleActions item={s} /></td></tr>; })}
      {!filtered.length && <tr className="text-fg-secondary"><td className="px-4 py-7">日期 —<br />时间 —</td><td className="px-4 py-7"><p className="font-medium text-fg">{anyFilter ? "没有匹配的排期" : "发布内容待安排"}</p><p className="mt-1 text-caption">关联合作 / 标题 / 内容说明</p></td><td className="px-4 py-7">达人 / 平台待关联</td><td className="px-4 py-7">—</td><td className="px-4 py-7"><Badge>0 条计划</Badge></td><td className="px-4 py-7"><Button disabled={!loaded || Boolean(loadError)} onClick={() => openSchedule()}>安排第一条发布</Button></td></tr>}
    </TableFrame><Pagination total={filtered.length} page={current} size={10} onPage={setPage} /></Panel><KolEditors />
  </>;
}
