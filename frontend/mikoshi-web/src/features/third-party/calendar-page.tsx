"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";

import { PageHeader, Panel, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

import { addCalendarDays, calendarDayLabel, calendarMonthDays, parseCalendarDate, shanghaiToday, shiftCalendarMonth } from "./calendar-dates";
import { ACCOUNT_STATUSES, GROUPS, matchesScheduleStatus, SCHEDULE_STATUSES, type AccountRef, type PublicationSchedule } from "./model";
import { usePublication } from "./publication-provider";
import { PublicationNotice, ScheduleActions, ScheduleEditor, ScheduleStatusBadge, scheduleSelectClass } from "./schedule-editor";

export function CalendarPage() {
  const { data, accounts, loaded, loadError, openSchedule } = usePublication();
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [clock, setClock] = React.useState<Date | null>(null);
  const dayButtons = React.useRef(new Map<string, HTMLButtonElement>());
  // A client clock prevents server timezone/hydration differences and refreshes the today marker.
  React.useEffect(() => {
    const update = () => setClock(new Date());
    update(); const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const today = clock ? shanghaiToday(clock) : "";
  const selected = selectedDate || today;
  const days = selected ? calendarMonthDays(selected) : [];
  const month = selected.slice(0, 7);
  const keyword = query.trim().toLocaleLowerCase();
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const visible = data.schedules.filter((item) => {
    const account = accountMap.get(item.accountId);
    if (!matchesScheduleStatus(item, status)) return false;
    if (group === "unassigned" && account?.group) return false;
    if (group && group !== "unassigned" && account?.group !== group) return false;
    return !keyword || `${account?.name ?? ""} ${account?.uid ?? ""}`.toLocaleLowerCase().includes(keyword);
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.id.localeCompare(b.id));
  const byDate = new Map<string, PublicationSchedule[]>();
  for (const item of visible) byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);
  const selectedItems = byDate.get(selected) ?? [];
  const selectedItem = selectedItems.find((item) => item.id === selectedId) ?? selectedItems[0];
  const filtered = !!(query || group || status);

  function chooseDay(date: string, focus = false) {
    setSelectedDate(date); setSelectedId(null);
    if (focus) requestAnimationFrame(() => dayButtons.current.get(date)?.focus());
  }

  function dayKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, date: string) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: string | null = null;
    const offset = offsets[event.key];
    if (offset !== undefined) next = addCalendarDays(date, offset);
    if (event.key === "Home") next = addCalendarDays(date, -((parseCalendarDate(date).getUTCDay() + 6) % 7));
    if (event.key === "End") next = addCalendarDays(date, 6 - ((parseCalendarDate(date).getUTCDay() + 6) % 7));
    if (event.key === "PageUp") next = shiftCalendarMonth(date, -1);
    if (event.key === "PageDown") next = shiftCalendarMonth(date, 1);
    if (next && next >= "2000-01-01" && next <= "2100-12-31") { event.preventDefault(); chooseDay(next, true); }
  }

  return <div className="@container min-w-0">
    <PageHeader eyebrow="Publishing calendar" title="发布日历" description="按天安排 B站内容，查看账号与历史作品。所有排期仅保存到本机，不会自动发布。"
      meta={<><Badge tone="info">B站</Badge><Badge tone="neutral">上海时间 · UTC+8</Badge></>}
      actions={<Button variant="primary" disabled={!loaded || !!loadError || !today} onClick={() => openSchedule(undefined, { date: selected })}><Plus aria-hidden />新增排期</Button>} />
    <PublicationNotice />
    {loaded && today && <>
      <Panel aria-label="日历筛选" className="mb-4 p-4">
        <div className="grid min-w-0 gap-3 @min-[42rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-1.5"><Label htmlFor="calendar-account-filter">账号搜索</Label><Input id="calendar-account-filter" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="昵称或 B站 UID" /></div>
          <div className="min-w-0 space-y-1.5"><Label htmlFor="calendar-group-filter">账号归属</Label><select id="calendar-group-filter" value={group} onChange={(event) => setGroup(event.target.value)} className={scheduleSelectClass}><option value="">全部归属</option>{GROUPS.map((item) => <option key={item}>{item}</option>)}<option value="unassigned">未标归属</option></select></div>
          <div className="min-w-0 space-y-1.5"><Label htmlFor="calendar-status-filter">排期状态</Label><select id="calendar-status-filter" value={status} onChange={(event) => setStatus(event.target.value)} className={scheduleSelectClass}><option value="">未撤下的计划</option>{Object.entries(SCHEDULE_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <Button className="self-end" disabled={!filtered} onClick={() => { setQuery(""); setGroup(""); setStatus(""); }}>清除筛选</Button>
        </div>
      </Panel>
      <div className="grid min-w-0 items-start gap-4 @min-[64rem]:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="min-w-0 p-3 sm:p-4" aria-label="月份日历">
          <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
            <SectionTitle><CalendarDays aria-hidden className="size-4 shrink-0" />{Number(month.slice(0, 4))} 年 {Number(month.slice(5))} 月</SectionTitle>
            <div className="flex flex-wrap items-center gap-1">
              <Button size="icon" aria-label="上个月" disabled={month <= "2000-01"} onClick={() => chooseDay(shiftCalendarMonth(selected, -1))}><ChevronLeft aria-hidden /></Button>
              <Button onClick={() => chooseDay(today)}>今天</Button>
              <Button size="icon" aria-label="下个月" disabled={month >= "2100-12"} onClick={() => chooseDay(shiftCalendarMonth(selected, 1))}><ChevronRight aria-hidden /></Button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-fg-secondary"><span>蓝色：已计划</span><span>灰色：已取消或已撤下</span><span>撤下记录仅在“已撤下”筛选中显示</span></div>
          <p className="sr-only">使用方向键按天移动，Home 和 End 切到周首周末，PageUp 和 PageDown 切月。</p>
          <div className="grid min-w-0 grid-cols-7" role="group" aria-label={`${month} 日历`}>
            {["一", "二", "三", "四", "五", "六", "日"].map((day) => <div key={day} aria-hidden className="border-b border-line bg-subtle py-2 text-center text-caption text-fg-secondary">{day}</div>)}
            {days.map((date) => {
              const items = byDate.get(date) ?? [];
              const planned = items.filter((item) => item.status === "planned").length;
              const cancelled = items.filter((item) => item.status === "cancelled").length;
              const withdrawn = items.filter((item) => item.status === "withdrawn").length;
              const outside = !date.startsWith(month);
              return <button key={date} type="button" ref={(element) => { if (element) dayButtons.current.set(date, element); else dayButtons.current.delete(date); }}
                data-calendar-day={date} aria-label={`${calendarDayLabel(date)}，${planned} 条已计划，${cancelled} 条已取消${withdrawn ? `，${withdrawn} 条已撤下` : ""}${date === today ? "，今天" : ""}`}
                aria-pressed={date === selected} aria-current={date === today ? "date" : undefined} tabIndex={date === selected ? 0 : -1}
                disabled={date < "2000-01-01" || date > "2100-12-31"}
                className={cn("relative flex min-h-[4.75rem] min-w-0 cursor-pointer flex-col gap-1 border-r border-b border-line p-1.5 text-left text-body transition-colors duration-(--motion-fast) hover:bg-hover @min-[38rem]:min-h-[7.5rem] @min-[38rem]:p-2 disabled:cursor-not-allowed disabled:opacity-50",
                  outside && "bg-subtle text-fg-muted", date === selected && "z-1 bg-accent-soft ring-2 ring-accent ring-inset", date !== selected && !outside && "text-fg")}
                onClick={() => chooseDay(date)} onKeyDown={(event) => dayKeyDown(event, date)}>
                <span className={cn("inline-flex min-h-6 min-w-6 self-start items-center justify-center rounded-control px-1 font-semibold tabular", date === today && "bg-accent text-on-accent")}>{Number(date.slice(-2))}</span>
                {!!items.length && <><span className="text-caption text-fg-secondary @min-[38rem]:hidden">{items.length} 条</span><span className="hidden min-w-0 space-y-1 self-stretch @min-[38rem]:block" aria-hidden>{items.slice(0, 2).map((item) => <span key={item.id} title={item.title} className={cn("block truncate rounded-control px-1 py-0.5 text-caption", item.status !== "planned" ? "bg-surface text-fg-muted" : "bg-surface text-accent")}>{item.time} {item.title}</span>)}{items.length > 2 && <span className="block text-caption text-fg-muted">另 {items.length - 2} 条</span>}</span></>}
              </button>;
            })}
          </div>
          <p className="mt-3 text-caption text-fg-muted">当前筛选：本月 {visible.filter((item) => item.date.startsWith(month)).length} 条排期。计划时间已过仅提示待核对，不代表已发布。</p>
        </Panel>
        <div className="min-w-0 space-y-4">
          <Panel className="p-4" aria-label="当天排期">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><SectionTitle>{calendarDayLabel(selected)}</SectionTitle><p className="mt-1 text-caption text-fg-muted">{selectedItems.length} 条排期 · 当前筛选</p></div><Button size="sm" disabled={!!loadError} onClick={() => openSchedule(undefined, { date: selected })}><Plus aria-hidden />添加</Button></div>
            {selectedItems.length ? <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto p-0.5">{selectedItems.map((item) => <button type="button" key={item.id} aria-pressed={item.id === selectedItem?.id} onClick={() => setSelectedId(item.id)}
              className={cn("block w-full cursor-pointer rounded-control border p-3 text-left transition-colors duration-(--motion-fast) hover:bg-hover", item.id === selectedItem?.id ? "border-accent bg-accent-soft" : "border-line bg-surface")}>
              <span className="flex min-w-0 gap-2"><span className="shrink-0 text-body font-semibold text-accent tabular">{item.time}</span><span className="min-w-0 break-anywhere text-body font-medium text-fg">{item.title}</span></span>
              <span className="mt-1 block break-anywhere text-caption text-fg-secondary">{accountMap.get(item.accountId)?.name ?? "账号资料暂不可用"}</span>
              <span className="mt-2 block"><ScheduleStatusBadge item={item} solid={item.id === selectedItem?.id} /></span>
            </button>)}</div> : <div className="py-8 text-center text-body text-fg-secondary"><p>{filtered ? "这一天没有符合筛选的排期。" : "这一天还没有发布安排。"}</p><p className="mt-1 text-caption text-fg-muted">{filtered ? "调整筛选，或选择其他日期查看。" : "点击“添加”记录第一条内容排期。"}</p></div>}
          </Panel>
          {selectedItem && <ScheduleDetail key={selectedItem.id} item={selectedItem} account={accountMap.get(selectedItem.accountId)} />}
        </div>
      </div>
    </>}
    <ScheduleEditor />
  </div>;
}

function ScheduleDetail({ item, account }: { item: PublicationSchedule; account?: AccountRef }) {
  return <Panel aria-label="排期详情" className="p-4">
    <SectionTitle>排期详情</SectionTitle>
    <h3 className="mt-3 break-anywhere text-section font-semibold text-fg">{item.title}</h3>
    <p className="mt-1 text-body text-fg-secondary tabular">{item.date} {item.time} · 上海时间</p>
    <div className="mt-3"><ScheduleStatusBadge item={item} /></div>
    <dl className="my-4 space-y-3 text-body">
      <div><dt className="text-caption text-fg-muted">内容说明</dt><dd className="mt-1 whitespace-pre-wrap break-anywhere text-fg">{item.content.trim() || "内容待补"}</dd></div>
      <div><dt className="text-caption text-fg-muted">确认状态</dt><dd className="mt-1 text-fg">{item.review === "confirmed" ? "人工确认" : "待确认"}</dd></div>
      {item.notes.trim() && <div><dt className="text-caption text-fg-muted">备注</dt><dd className="mt-1 whitespace-pre-wrap break-anywhere text-fg">{item.notes}</dd></div>}
    </dl>
    <ScheduleActions item={item} />
    <div className="mt-5 border-t border-line pt-4"><SectionTitle>账号与历史效果</SectionTitle>
      {account ? <>
        <div className="mt-3 flex flex-wrap items-center gap-2"><h3 className="break-anywhere font-semibold text-fg">{account.name}</h3><Badge tone="neutral">{account.group ?? "未标归属"}</Badge><Badge tone={account.status === "retired" ? "warning" : "neutral"}>{account.managed ? ACCOUNT_STATUSES[account.status] : "运营状态待确认"}</Badge></div>
        <p className="mt-2 text-caption text-fg-secondary">B站 UID：{account.uid ?? "原始资料未提供"}</p>
        {account.link && <a className="mt-2 inline-flex min-h-9 items-center gap-1 text-body text-accent underline-offset-4 hover:underline" href={account.link} target="_blank" rel="noopener noreferrer">打开 B站主页<ExternalLink aria-hidden className="size-3.5" /></a>}
        <p className="mt-2 break-anywhere text-caption text-fg-muted">{account.managed ? "管理资料：本机人工维护。" : "管理资料：未补充。"}{account.history ? `历史来源：B站资料快照；原供应商 ${account.history.suppliers.join("、") || "未提供"}。` : "未关联历史快照。"}</p>
        <h4 className="mt-4 text-body font-medium text-fg">最近 3 条历史作品</h4>
        {account.history?.works.length ? <ol className="mt-2 divide-y divide-line">{account.history.works.slice(0, 3).map((work) => <li key={work.id} className="py-3">
          {work.link ? <a href={work.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 break-anywhere text-body text-accent hover:underline">{work.title ?? "原始资料未提供标题"}<ExternalLink aria-hidden className="mt-1 size-3.5 shrink-0" /></a> : <p className="break-anywhere text-body text-fg">{work.title ?? "原始资料未提供标题"}</p>}
          <p className="mt-1 text-caption text-fg-muted">{work.date ?? "日期未提供"}{work.time ? ` ${work.time}` : ""}</p>
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-fg-secondary">{[["播放", work.view], ["点赞", work.like], ["评论", work.reply]].map(([label, number]) => <div key={String(label)} className="flex gap-1"><dt>{label}</dt><dd className="font-medium tabular">{typeof number === "number" ? number.toLocaleString("zh-CN") : "—"}</dd></div>)}</dl>
        </li>)}</ol> : <p className="mt-2 text-body text-fg-secondary">暂无关联的历史作品与效果数据。</p>}
        <p className="mt-2 text-caption text-fg-muted">历史快照与当前排期独立，不是本次排期的发布结果。</p>
      </> : <p className="mt-3 text-body text-fg-secondary">账号资料暂不可用，排期记录已保留。</p>}
    </div>
  </Panel>;
}
