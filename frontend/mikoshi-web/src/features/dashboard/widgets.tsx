"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bot, ChevronDown, CircleAlert, Clock, Loader, PauseCircle } from "lucide-react";

import { useGuardedNavigate } from "@/components/shell/use-guarded-navigate";
import { Badge } from "@/components/ui/badge";
import type { WidgetSize, WidgetType } from "@/contracts/dashboard";
import { BUSINESS_BOARDS } from "@/features/business/catalog";
import type { LegacySummary } from "@/features/legacy/modules";
import { assetPath } from "@/lib/asset-path";
import { cn } from "@/lib/cn";
import { parseSnapshotSummary } from "./snapshot-summary";

/**
 * 卡片登记表（SPEC §6、FE-25）：尺寸、标题、数据性质、来源、接入状态与合法下钻。
 * 数据性质区分历史快照、未接入和状态示例，不虚构实时指标或 metricId。
 */
export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  sizes: readonly WidgetSize[];
  nature: "not-connected" | "sample" | "partial-snapshot";
  source: string;
  Body: React.ComponentType;
}

function InternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const { linkHandler } = useGuardedNavigate();
  return (
    <Link
      href={href}
      onClick={linkHandler(href)}
      className={cn(
        "inline-flex min-h-8 items-center gap-1 rounded-control font-medium text-accent underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

type SummaryState = { status: "loading" } | { status: "ready"; data: LegacySummary } | { status: "error" };

/** 读取同步脚本生成的快照汇总；失败时两张快照卡显示“读取失败”，不填 0 */
function useLegacySummary(): [SummaryState, () => void] {
  const [state, setState] = React.useState<SummaryState>({ status: "loading" });
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch(assetPath("/legacy/summary.json"), { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(parseSnapshotSummary)
      .then((data) => active && setState({ status: "ready", data }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);
  return [state, () => { setState({ status: "loading" }); setAttempt((n) => n + 1); }];
}

const wan = (n: number) => `${(n / 10_000).toLocaleString("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}万`;

function SnapshotFigures({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-x-3 gap-y-2">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-caption text-fg-muted">{i.label}</dt>
          <dd className="num break-anywhere text-[1.25rem] leading-7 font-medium text-fg">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BusinessOverview() {
  const [summary, retry] = useLegacySummary();
  const figures = (id: string): React.ReactNode => {
    if (id !== "kol" && id !== "third-party") return null;
    if (summary.status === "loading") return <p className="mt-2 text-caption text-fg-muted">正在读取快照…</p>;
    if (summary.status === "error") return <p className="mt-2 text-caption text-danger">快照汇总读取失败</p>;
    const d = summary.data;
    return id === "kol" ? (
      <SnapshotFigures
        items={[
          { label: "B站作品", value: String(d.kol.works) },
          { label: "发布达人", value: String(d.kol.creators) },
          { label: "B站播放", value: wan(d.kol.views) },
        ]}
      />
    ) : (
      <SnapshotFigures
        items={[
          { label: "作品", value: String(d.thirdParty.works) },
          { label: "账号", value: String(d.thirdParty.accounts) },
          { label: "已知累计播放", value: wan(d.thirdParty.views) },
        ]}
      />
    );
  };

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2.5 @[19rem]:grid-cols-2 @3xl:grid-cols-3">
        {BUSINESS_BOARDS.map((b) => {
          const legacy = b.id === "kol" || b.id === "third-party";
          return (
            <li key={b.id} className="flex min-w-0 flex-col gap-1 rounded-[10px] bg-canvas px-3 py-3 @md:px-4 @md:py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <InternalLink href={b.path} className="min-h-6 text-fg hover:text-accent [&_svg]:text-fg-muted">
                  {b.title}
                </InternalLink>
                {legacy ? (
                  <span className="rounded-[4px] bg-accent-soft px-1.5 py-px text-caption text-accent">历史快照</span>
                ) : (
                  <span className="rounded-[4px] bg-subtle px-1.5 py-px text-caption text-fg-muted">未接入</span>
                )}
              </div>
              <p className="text-caption text-fg-secondary">{b.overviewHint}</p>
              {legacy ? (
                figures(b.id)
              ) : (
                <p className="num mt-1 text-section font-semibold text-fg-muted @md:mt-2 @md:text-metric">
                  <span aria-hidden>—</span>
                  <span className="sr-only">数值未知，数据源未接入</span>
                </p>
              )}
              {legacy && summary.status === "ready" && (() => {
                const data = b.id === "kol" ? summary.data.kol : summary.data.thirdParty;
                return (
                  <details className="mt-2 text-caption text-fg-muted">
                    <summary className="cursor-pointer rounded-control py-1.5 text-fg-secondary">快照时间与口径</summary>
                    <p className="mt-1 break-anywhere">{data.snapshotLabel}</p>
                    <p className="mt-1 break-anywhere">{b.id === "kol" ? "B站快照截至" : "源文件生成时间（非统一采集时间）"}：{data.snapshotAt ?? "来源未提供"}</p>
                    {b.id === "third-party" && <p className="mt-1 break-anywhere">记录发布范围：{summary.data.thirdParty.range.start ?? "未知"} 至 {summary.data.thirdParty.range.end ?? "未知"}</p>}
                    <p className="mt-1 break-anywhere">{data.basis}</p>
                    <p className="mt-1">播放数据覆盖 {data.knownViewRecords}/{data.works} 条，缺失 {data.missingViews} 条；缺项不计为零。</p>
                  </details>
                );
              })()}
            </li>
          );
        })}
      </ul>
      {summary.status === "error" && (
        <p className="mt-3 text-caption text-danger" role="status">
          快照汇总暂时不可用，可进入板块查看原始页面。
          <button type="button" onClick={retry} className="ml-1 min-h-11 rounded-control px-2 font-medium underline sm:min-h-8">重新读取快照</button>
        </p>
      )}
      <p className="mt-3 text-caption text-fg-muted">
        KOL、三方号来自原“无限大B站数据系统”的历史快照，不会自动刷新。采集时间与发布范围不同，详见各卡片口径；“—”表示数据源尚未接入、数值未知，不等于 0。
      </p>
    </div>
  );
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-1 rounded-[8px] bg-canvas px-4 py-5">
      <p className="font-medium text-fg">{title}</p>
      <p className="text-fg-secondary">{body}</p>
      {href && <InternalLink href={href} className="mt-2">
        {cta}
      </InternalLink>}
    </div>
  );
}

function MyTodos() {
  return (
    <EmptyState
      title="尚未接入任务数据"
      body="待办数据接入前，这里不显示任何事项。"
    />
  );
}

function RecentWork() {
  return (
    <EmptyState
      title="尚未接入业务动态"
      body="接入后会显示你参与的任务与发布进展。"
      href="/dashboard/tasks"
      cta="查看任务看板"
    />
  );
}

/** 固定合成示例，只演示状态如何显示；时间为固定样例 */
const AGENT_SAMPLES = [
  {
    id: "sample-1",
    name: "示例 Agent · 资料整理",
    state: "等待人工确认",
    tone: "warning" as const,
    icon: PauseCircle,
    detail: "等待负责人确认要整理的资料范围；等待期间不消耗资源。",
    time: "示例时间 10:20",
  },
  {
    id: "sample-2",
    name: "示例 Agent · 排期核对",
    state: "运行中",
    tone: "info" as const,
    icon: Loader,
    detail: "当前阶段：核对排期冲突。没有可靠总量时不显示百分比。",
    time: "示例时间 10:05",
  },
  {
    id: "sample-3",
    name: "示例 Agent · 素材归档",
    state: "失败",
    tone: "danger" as const,
    icon: CircleAlert,
    detail: "原因：目标目录无写入权限。下一步：由负责人检查权限后重试。",
    time: "示例时间 09:48",
  },
];

function AgentActivity() {
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  return (
    <div>
      <ul className="flex flex-col divide-y divide-line/70">
        {AGENT_SAMPLES.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.id} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 @lg:flex-row @lg:items-center @lg:gap-4">
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <Bot className="size-4 shrink-0 text-fg-muted" aria-hidden />
                <span className="min-w-0 truncate font-medium text-fg">{s.name}</span>
              </span>
              <span className="flex items-center gap-3 pl-6.5 @lg:pl-0">
                <Badge tone={s.tone}>
                  <Icon aria-hidden />
                  {s.state}
                </Badge>
                <span className="tabular inline-flex items-center gap-1 text-caption text-fg-muted">
                  <Clock className="size-3" aria-hidden />
                  {s.time}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex min-h-8 items-center gap-1 rounded-control font-medium text-accent"
      >
        {open ? "收起示例说明" : "这些示例说明了什么"}
        <ChevronDown
          className={cn("size-4 transition-transform duration-(--motion-normal) ease-(--ease-move) reduce-motion:transition-none", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div id={panelId} hidden={!open} className="mt-2 rounded-[8px] bg-canvas px-3.5 py-3 text-fg-secondary">
        <p>
          以上三条是固定的合成示例，只用来说明工作 Agent 的状态会如何显示：等待人工、运行中、失败分别给出原因与下一步。
          系统目前没有常驻运行的 Agent，这里也不能启动或停止任何 Agent。
        </p>
        <p className="mt-2">工作 Agent 是执行任务的系统身份，与 VPC 虚拟社区中的模拟角色不同。</p>
      </div>
    </div>
  );
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  "business-overview": {
    type: "business-overview",
    title: "业务概览",
    description: "业务页面的数据状态",
    sizes: ["standard", "wide"],
    nature: "partial-snapshot",
    source: "KOL / 三方号历史快照；其他板块未接入",
    Body: BusinessOverview,
  },
  "my-todos": {
    type: "my-todos",
    title: "我的待办",
    description: "需要你处理的事项",
    sizes: ["standard", "wide"],
    nature: "not-connected",
    source: "任务数据（未接入）",
    Body: MyTodos,
  },
  "recent-work": {
    type: "recent-work",
    title: "近期工作",
    description: "你最近参与的业务动态",
    sizes: ["standard", "wide"],
    nature: "not-connected",
    source: "业务动态（未接入）",
    Body: RecentWork,
  },
  "agent-activity": {
    type: "agent-activity",
    title: "Agent动态",
    description: "工作 Agent 的状态显示方式",
    sizes: ["standard", "wide"],
    nature: "sample",
    source: "固定合成示例",
    Body: AgentActivity,
  },
};
