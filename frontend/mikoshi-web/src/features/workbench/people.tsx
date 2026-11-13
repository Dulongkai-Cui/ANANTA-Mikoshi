"use client";
import { Button } from "@/components/ui/button";
import { membersFor, taskStats, isLate } from "./model";
import { useWorkbench } from "./workbench-provider";
import { Avatar, Panel, Progress, StatusBadge } from "./shared-ui";
export function People() {
  const w = useWorkbench(), members = membersFor(w.data);
  return <><div className="wb-toolbar"><p className="wb-muted">按任务负责人汇总；成员名单用于项目分工，不代表系统登录权限。</p><Button disabled={w.preview} onClick={() => w.open("settings")}>维护项目成员</Button></div><div className="wb-people-grid">{(members.length ? members : [""]).map(name => {
    const tasks = w.data.tasks.filter(t => t.owner === name), s = taskStats(tasks), progress = tasks.length ? Math.round(tasks.reduce((n, t) => n + t.progress, 0) / tasks.length) : 0;
    return <Panel key={name} title={name || "项目成员"} sub={`${tasks.length} 项任务 · ${s.late} 项逾期`} actions={<Avatar name={name} />}><div className="wb-person-body"><div className="wb-person-stats"><span><b>{s.counts.doing}</b>进行中</span><span><b>{s.counts.done}</b>已完成</span><span><b>{s.counts.blocked}</b>阻塞</span></div><div className="wb-progress-caption"><span>平均手工进度</span><b>{tasks.length ? `${progress}%` : "—"}</b></div><Progress value={progress} /><div className="wb-list">{tasks.filter(t => t.status !== "done").sort((a, b) => a.end.localeCompare(b.end)).slice(0, 5).map(t => <button className="wb-list-row" key={t.id} disabled={w.preview} onClick={() => w.open("task", t.id)}><div><b>{t.title}</b><small className={isLate(t) ? "wb-danger" : ""}>{t.end} 截止</small></div><StatusBadge value={t.status} /></button>)}{!tasks.some(t => t.status !== "done") && <div className="wb-list-row wb-placeholder"><span>待交付任务</span><b>0</b></div>}</div><Button disabled={w.preview || !name} onClick={() => w.open("task", undefined, { owner: name })}>为此成员新增任务</Button></div></Panel>;
  })}</div></>;
}
