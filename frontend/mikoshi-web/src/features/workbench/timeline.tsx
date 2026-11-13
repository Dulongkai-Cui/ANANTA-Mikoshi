"use client";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCalendarDays, shanghaiToday } from "@/lib/calendar-dates";
import { daysBetween, filterTasks, linesFor, validDate, type ProjectEvent } from "./model";
import { useWorkbench } from "./workbench-provider";
import { Filters, Panel, StatusBadge } from "./shared-ui";

export function eventLanes(events: ProjectEvent[], start: string, days: number) {
  const ends: number[] = [];
  return events.filter(e => e.date >= start && e.date < addCalendarDays(start, days)).sort((a, b) => a.date.localeCompare(b.date)).map(e => {
    const day = daysBetween(e.date, start);
    let lane = ends.findIndex(end => end < day); if (lane < 0) lane = ends.length;
    ends[lane] = day + 4; return { event: e, day, lane };
  });
}
export function Timeline() {
  const w = useWorkbench(), { start, days, timeline } = w.ui;
  const end = addCalendarDays(start, days - 1), today = shanghaiToday(), dates = Array.from({ length: days }, (_, i) => addCalendarDays(start, i));
  const setStart = (d: string) => { if (validDate(d) && validDate(addCalendarDays(d, days - 1))) w.setUI(u => ({ ...u, start: d })); };
  const tasks = filterTasks(w.data, w.ui.filter).filter(t => t.start <= end && t.end >= start);
  const disabled = w.preview || w.saving;
  const axis = <div className="wb-axis" style={{ gridTemplateColumns: `repeat(${days}, 2.75rem)` }}>{dates.map(d => <span key={d} className={d === today ? "wb-today" : ""}><small>{d.slice(5, 7)}月</small>{d.slice(8)}</span>)}</div>;
  return <>
    <div className="wb-toolbar"><div className="wb-switch" aria-label="时间轴视图"><Button aria-pressed={timeline === "tasks"} onClick={() => w.setUI(u => ({ ...u, timeline: "tasks" }))}>任务甘特</Button><Button aria-pressed={timeline === "events"} onClick={() => w.setUI(u => ({ ...u, timeline: "events" }))}>项目关键节点</Button></div><div className="wb-toolbar"><Button size="icon" aria-label="前移14天" onClick={() => setStart(addCalendarDays(start, -14))}><ChevronLeft /></Button><Button onClick={() => setStart(addCalendarDays(today, -3))}>今天</Button><Button size="icon" aria-label="后移14天" onClick={() => setStart(addCalendarDays(start, 14))}><ChevronRight /></Button><label className="wb-inline-label">起始日<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label><select aria-label="时间轴天数" value={days} onChange={e => { const n = +e.target.value; if (validDate(addCalendarDays(start, n - 1))) w.setUI(u => ({ ...u, days: n })); }}>{[30, 45, 60, 90].map(n => <option key={n} value={n}>{n} 天</option>)}</select></div></div>
    {timeline === "tasks" && <Filters />}
    <Panel title={timeline === "tasks" ? "任务时间轴" : "项目关键节点"} sub={`${start} — ${end} · 可横向滚动查看完整日期`} actions={timeline === "events" ? <Button disabled={disabled} onClick={() => w.open("line")}><Plus />新增事件线</Button> : undefined}>
      <div className="wb-timeline-scroll" tabIndex={0} aria-label="时间轴，可横向滚动">
        <div className="wb-timeline" style={{ width: `${13.75 + days * 2.75}rem` }}><div className="wb-timeline-row"><div className="wb-row-label wb-axis-label">{timeline === "tasks" ? "任务 / 负责人" : "事件线 / 关键日期"}</div>{axis}</div>
          {timeline === "tasks" ? (tasks.length ? tasks : [null]).map(t => {
            const left = t ? Math.max(0, daysBetween(t.start, start)) : 0, right = t ? Math.min(days - 1, daysBetween(t.end, start)) : 0;
            return <div className="wb-timeline-row" key={t?.id ?? "empty"}><div className="wb-row-label">{t ? <><button disabled={disabled} onClick={() => w.open("task", t.id)}>{t.title}</button><small>{t.owner} · {t.module}</small><StatusBadge value={t.status} /></> : <><b>任务排期</b><small>0 项任务 · 新增后展示进度</small></>}</div><div className="wb-time-track" style={{ width: `${days * 2.75}rem` }}>{t && <><button disabled={disabled} className={`wb-task-bar wb-bar-${t.status}`} style={{ left: `${left * 2.75}rem`, width: `calc(${(right - left + 1) * 2.75}rem - 6px)` }} onClick={() => w.open("task", t.id)} title={`${t.title} · ${t.start} — ${t.end} · ${t.progress}%`}><i style={{ width: `${t.progress}%` }} /><span>{t.progress}% · {t.title}</span></button>{t.nodes.filter(n => n.date >= start && n.date <= end).map((n, i) => <button key={i} className={`wb-node ${n.done ? "wb-node-done" : ""}`} style={{ left: `${daysBetween(n.date, start) * 2.75 + .875}rem` }} aria-label={`任务节点 ${n.title} ${n.date} ${n.done ? "已完成" : "待完成"}`} title={n.title} disabled={disabled} onClick={() => w.open("task", t.id)}>◆</button>)}</>}</div></div>;
          }) : linesFor(w.data).map(line => {
            const items = eventLanes(w.data.events.filter(e => e.lineId === line.id), start, days), height = `${Math.max(7, (Math.max(0, ...items.map(i => i.lane)) + 1) * 3.375 + 2.25)}rem`;
            return <div className="wb-timeline-row" key={line.id}><div className="wb-row-label"><button disabled={disabled} onClick={() => w.open("line", line.id)}>{line.title}</button><small>{line.description || "项目关键日期"}</small><Button size="sm" disabled={disabled} onClick={() => w.open("event", undefined, { lineId: line.id, date: start })}><Plus />添加节点</Button></div><div className="wb-time-track" style={{ width: `${days * 2.75}rem`, height }}><div className="wb-date-cells">{dates.map(d => <button key={d} disabled={disabled} aria-label={`在${line.title} ${d}新增节点`} title={`${d} · 点击新增节点`} onClick={() => w.open("event", undefined, { lineId: line.id, date: d })} />)}</div>{items.map(({ event: e, day, lane }) => <button key={e.id} disabled={disabled} className="wb-event" style={{ left: `calc(${day * 2.75}rem + 2px)`, top: `${1 + lane * 3.375}rem`, width: `calc(${Math.min(12.75, (days - day) * 2.75)}rem - 4px)` }} onClick={() => w.open("event", e.id)} title={`${e.date} · ${e.title}`}><span>◆ {e.date.slice(5)}</span><b>{e.title}</b></button>)}</div></div>;
          })}
        </div>
      </div>
      <p className="wb-footnote">{timeline === "tasks" ? "条形长度表示起止日期，填充表示手工进度；菱形表示任务节点。点击任务或节点即可编辑。" : "点击日期空格添加节点，点击事件线名称编辑；同一天的节点分层排列。"}</p>
    </Panel>
  </>;
}

