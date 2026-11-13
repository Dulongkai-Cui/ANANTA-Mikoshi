"use client";
import * as React from "react";
import { Plus, Bell, Settings2, Download, Upload, Eye, X } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { addCalendarDays, shanghaiToday } from "@/lib/calendar-dates";
import { filterTasks, linesFor, reminders, type WorkbenchStore } from "./model";
import { appendBackup, BACKUP_FORMAT, csv, download, parseBackup, taskRows } from "./data-exchange";
import { WorkbenchEditor } from "./editors";
import { useWorkbench } from "./workbench-provider";
import { Overview } from "./overview";
import { Tasks } from "./tasks";
import { Timeline } from "./timeline";
import { People } from "./people";
import { KolOverview } from "./kol-overview";
import "./workbench.css";
const META = { overview: ["我的工作台", "MY WORKSPACE", "项目总览、团队分工与关键节点。"], tasks: ["任务看板", "PROJECT TASKS", "把目标拆成任务，清楚每一项的负责人和下一步。"], timeline: ["项目时间轴", "PROJECT TIMELINE", "一起看清任务周期、营销发布与重要交付。"], people: ["人员进度", "TEAM PROGRESS", "看清任务分工、手工进度和临近的交付。"], kol: ["KOL 协作概览", "CREATOR COLLABORATION", "在项目中查看合作推进，回到 KOL 模块统一管理。"] } as const;
export function WorkbenchPage({ view = "overview" }: { view?: keyof typeof META }) {
  const w = useWorkbench(), [title, eyebrow, description] = META[view], [showReminders, setShowReminders] = React.useState(false), [transfer, setTransfer] = React.useState(false), [incoming, setIncoming] = React.useState<{ data: WorkbenchStore; revision: string | null } | null>(null), [issue, setIssue] = React.useState<string | null>(null);
  const file = React.useRef<HTMLInputElement>(null), importing = React.useRef(false), list = reminders(w.data), today = shanghaiToday();
  const disabled = !w.loaded || Boolean(w.error) || w.preview || w.saving;
  const exportCSV = () => {
    const events = view === "timeline" && w.ui.timeline === "events";
    const tasks = filterTasks(w.data, w.ui.filter).filter(t => view !== "timeline" || t.start < addCalendarDays(w.ui.start, w.ui.days) && t.end >= w.ui.start);
    const rows = events ? [["节点", "事件线", "日期", "说明"], ...w.data.events.filter(e => e.date >= w.ui.start && e.date < addCalendarDays(w.ui.start, w.ui.days)).map(e => [e.title, linesFor(w.data).find(l => l.id === e.lineId)?.title ?? "", e.date, e.description])] : taskRows(view === "overview" || view === "people" ? w.data.tasks : tasks);
    download(csv(rows), `Mikoshi-${events ? "项目节点" : "项目任务"}-${today}.csv`, "text/csv;charset=utf-8");
  };
  const chooseFile = async (f?: File) => { setIssue(null); if (!f || disabled) return; try { if (f.size > 2000000) throw new Error("备份不得超过2MB。"); const revision = w.live.revision; const data = parseBackup(await f.text()); setIncoming({ data, revision }); } catch (e) { setIssue(e instanceof Error ? e.message : "文件读取失败。"); } };
  const importData = async () => { if (!incoming || importing.current) return; importing.current = true; try { const r = await w.commit(appendBackup(w.live, incoming.data), incoming.revision, "追加导入", `${incoming.data.tasks.length}项任务、${incoming.data.events.length}个节点`); if (r.ok) { setIncoming(null); setTransfer(false); } else setIssue(r.error); } finally { importing.current = false; } };
  return <div className="wb"><PageHeader title={title} eyebrow={eyebrow} description={description} actions={<><Button disabled={!w.loaded || Boolean(w.error)} aria-label={`工作提醒 ${list.length}项`} onClick={() => setShowReminders(true)}><Bell />提醒{list.length ? ` ${list.length}` : ""}</Button><Button disabled={disabled} onClick={() => w.open("settings")}><Settings2 />项目设置</Button><Button variant="primary" disabled={disabled} onClick={() => view === "timeline" && w.ui.timeline === "events" ? w.open("event") : w.open("task")}><Plus />{view === "timeline" && w.ui.timeline === "events" ? "新增节点" : "新增任务"}</Button></>} />
    <div className="wb-context"><span><i />本机工作区 · 当前演示身份</span><div><Button size="sm" disabled={!w.loaded || Boolean(w.error)} onClick={w.togglePreview}>{w.preview ? <X /> : <Eye />}{w.preview ? "退出示例" : "查看只读示例"}</Button><Button size="sm" disabled={disabled} onClick={() => { setIssue(null); setTransfer(true); }}><Download />数据备份与导出</Button></div></div>
    {w.preview && <div className="wb-demo" role="status"><b>只读示例</b> · 用于预览布局与操作方式；这些任务不会保存，也不会混入 KOL 资料。</div>}
    {w.notice && <div role="status" className="wb-notice">{w.notice}</div>}
    {!w.loaded ? <div role="status" className="wb-panel wb-empty-row">正在读取项目工作区…</div> : w.error ? <div role="alert" className="wb-error">{w.error}<Button onClick={w.refresh}>重新读取</Button></div> : view === "overview" ? <Overview /> : view === "tasks" ? <Tasks /> : view === "timeline" ? <Timeline /> : view === "people" ? <People /> : <KolOverview />}
    <WorkbenchEditor />
    <Dialog open={showReminders} onOpenChange={setShowReminders}><DialogContent className="wb-dialog"><DialogHeader><DialogTitle>工作提醒 · {list.length} 项</DialogTitle><DialogDescription>任务截止：逾期与未来7天；未完成任务节点：逾期与未来3天；项目节点：前后3天。仅在本机展示。</DialogDescription></DialogHeader><div className="wb-list">{list.map((r, i) => <button key={`${r.id}-${i}`} disabled={w.preview} className="wb-list-row" onClick={() => { setShowReminders(false); w.open(r.kind, r.id); }}><div><b>{r.title}</b><small>{r.detail}</small></div><time className={r.date < today ? "wb-danger" : ""}>{r.date}</time></button>)}{!list.length && <p className="wb-empty-row">当前没有临近节点或逾期任务。</p>}</div></DialogContent></Dialog>
    <Dialog open={transfer} onOpenChange={o => { if (!w.saving) { setTransfer(o); if (!o) setIncoming(null); } }}><DialogContent className="wb-dialog" showCloseButton={!w.saving} onEscapeKeyDown={e => { if (w.saving) e.preventDefault(); }} onPointerDownOutside={e => { if (w.saving) e.preventDefault(); }}><DialogHeader><DialogTitle>{incoming ? "确认追加导入" : "数据备份与导出"}</DialogTitle><DialogDescription>{incoming ? "导入会新建记录，不覆盖现有任务与项目设置；相同备份重复导入会产生多份任务。" : "只处理当前身份的项目工作台。KOL 资料仍由 KOL 模块维护。"}</DialogDescription></DialogHeader>{issue && <p className="wb-error" role="alert">{issue}</p>}{incoming ? <><div className="wb-import-summary"><p><b>{incoming.data.tasks.length}</b> 项任务</p><p><b>{incoming.data.lines.length}</b> 条事件线</p><p><b>{incoming.data.events.length}</b> 个项目节点</p></div><DialogFooter><Button disabled={w.saving} onClick={() => { setIncoming(null); setIssue(null); }}>取消导入</Button><Button pending={w.saving} variant="primary" onClick={() => void importData()}>确认追加</Button></DialogFooter></> : <div className="wb-transfer"><Button disabled={view === "kol"} onClick={exportCSV}><Download />导出当前视图 CSV</Button><p>看板按当前筛选导出；时间轴按当前日期范围导出；总览与人员页导出全部任务。KOL 请在原模块导出。</p><Button onClick={() => download(JSON.stringify({ format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), data: w.live }, null, 2), `Mikoshi-工作台备份-${today}.json`, "application/json")}><Download />下载完整 JSON 备份</Button><Button onClick={() => file.current?.click()}><Upload />选择工作台备份追加导入</Button><input ref={file} type="file" accept=".json,application/json" hidden aria-label="选择工作台JSON备份" onChange={e => { void chooseFile(e.target.files?.[0]); e.target.value = ""; }} /><p>仅支持 Mikoshi 工作台备份，最大2MB、单次300条记录。原始 PM HTML 的备份需另做字段映射，不直接导入。</p></div>}</DialogContent></Dialog>
  </div>;
}
