"use client";
import Link from "next/link";
import { UsersRound, Handshake, CalendarClock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuardedNavigate } from "@/components/shell/use-guarded-navigate";
import { useKol } from "@/features/kol/kol-provider";
import { STAGES, BOOKINGS, planBlocked } from "@/features/kol/model";
import { useWorkbench } from "./workbench-provider";
import { Panel, Metric } from "./shared-ui";
export function KolOverview() {
  const kol = useKol(), w = useWorkbench(), { linkHandler } = useGuardedNavigate();
  if (w.preview) return <Panel title="KOL 协作概览" sub="只读示例不混入正式资料"><div className="wb-empty-row">退出示例后，这里会读取当前演示身份已录入的达人、合作与排期。</div></Panel>;
  if (!kol.loaded) return <p role="status">正在读取 KOL 资料…</p>;
  if (kol.loadError) return <div role="alert" className="wb-error">{kol.loadError}<Button onClick={kol.refresh}>重新读取 KOL 资料</Button></div>;
  const s = kol.data;
  return <><p className="wb-source">数据来自当前身份的 KOL 工作区。任务进度与合作阶段分别维护；合作完成不等于平台已发布。</p><div className="wb-stats wb-stats-four"><Metric label="达人档案" value={s.talents.length} note="包含启用与停用档案" icon={<UsersRound />} /><Metric label="进行中合作" value={s.collaborations.filter(c => !["completed", "cancelled"].includes(c.stage)).length} note="未完成、未取消的合作" icon={<Handshake />} /><Metric label="有效排期" value={s.schedules.filter(p => p.status === "planned" && !planBlocked(p, s)).length} note="已计划，不代表已发布" icon={<CalendarClock />} /><Metric label="有阻塞的合作" value={s.collaborations.filter(c => c.blocker.trim() && !["completed", "cancelled"].includes(c.stage)).length} note="进行中合作填写的阻塞项" icon={<TriangleAlert />} /></div><Panel title="合作与交付" sub="只读汇总 · 在 KOL 模块中统一维护" actions={<Link className="wb-link" href="/kol/progress" onClick={linkHandler("/kol/progress")}>管理合作进度 →</Link>}><div className="wb-table-scroll" tabIndex={0} aria-label="KOL协作表格，可横向滚动"><table><thead><tr><th>合作 / 达人</th><th>负责人</th><th>阶段</th><th>档期</th><th>交付日期</th><th>下一步 / 阻塞</th></tr></thead><tbody>{s.collaborations.map(c => <tr key={c.id}><td><b>{c.title}</b><small>{s.talents.find(t => t.id === c.talentId)?.name ?? "档案缺失"}</small></td><td>{c.owner || "待分配"}</td><td>{STAGES[c.stage]}</td><td>{BOOKINGS[c.booking]}</td><td>{c.deadline || "未设置"}</td><td>{c.nextStep || "待补充"}{c.blocker && <small className="wb-danger">{c.blocker}</small>}</td></tr>)}{!s.collaborations.length && <tr className="wb-placeholder"><td>合作名称 / 达人</td><td>待分配</td><td>0 项合作</td><td>—</td><td>—</td><td>录入后展示下一步行动</td></tr>}</tbody></table></div><div className="wb-kol-links">{([["/kol/studio#kols","UP资料库"],["/kol/progress","合作进度"],["/kol#home","发布效果首页"],["/kol#overview","全局透视"]] as const).map(([href, label]) => <Link key={href} href={href} onClick={linkHandler(href)}>{label} →</Link>)}</div></Panel></>;
}


