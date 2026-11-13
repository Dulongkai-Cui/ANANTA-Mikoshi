import * as React from "react";
import { Database, FileText, FlaskConical, ShieldAlert } from "lucide-react";

import { PageHeader, Panel, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";

import { getBoard, type BusinessId } from "./catalog";

/**
 * 未接入数据的业务板块：沿用“无限大B站数据系统”的页面版式
 * （英文眉题 → 标题 → 指标卡 → 白色面板）。
 * 指标卡只说明接入后会展示什么，数值一律“—”；不虚构业绩，也没有假按钮。
 */
export function BusinessPage({ id }: { id: BusinessId }) {
  const board = getBoard(id);

  return (
    <div>
      <PageHeader
        eyebrow={board.eyebrow}
        title={board.title}
        description={board.summary}
        actions={
          <>
            {board.nature && (
              <Badge tone="warning">
                <FlaskConical aria-hidden />
                {board.nature.label}
              </Badge>
            )}
            <Badge tone="neutral">
              <Database aria-hidden />
              尚未接入数据
            </Badge>
          </>
        }
      />

      {board.nature && (
        <Notice tone="warning" title={`${board.nature.label}：结果不代表真实反馈`} className="mb-5">
          {board.nature.detail}
          工作 Agent 是执行任务的系统身份，与这里的虚拟角色不是同一类。
        </Notice>
      )}

      {/* 指标卡：版式同 KOL / 三方号总览，数值未接入 */}
      <section aria-labelledby={`${board.id}-kpi`} className="mb-5">
        <h2 id={`${board.id}-kpi`} className="sr-only">
          核心指标（尚未接入）
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {board.kpis.map((k) => (
            <li key={k.label} className="min-w-0 rounded-card bg-surface px-5 py-4 shadow-card">
              <p className="text-caption font-medium text-fg-secondary">{k.label}</p>
              <p className="num mt-2 text-metric font-medium text-fg-muted">
                <span aria-hidden>—</span>
                <span className="sr-only">尚未接入，数值未知</span>
              </p>
              <p className="mt-1 text-caption text-fg-muted">口径：{k.hint}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-caption text-fg-muted">“—”表示数据源尚未接入、数值未知，不等于 0。</p>
      </section>

      <Panel aria-labelledby={`${board.id}-flow`} className="mb-5 px-5 pt-5 pb-5">
        <SectionTitle id={`${board.id}-flow`}>业务流程</SectionTitle>
        <p className="mt-1 text-caption text-fg-secondary">本板块计划覆盖的工作顺序。下面是流程说明，不是可点击的步骤。</p>
        <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {board.flow.map((step, index) => (
            <li key={step} className="relative flex items-center gap-3 rounded-[10px] bg-canvas px-4 py-3.5">
              <span
                aria-hidden
                className="num inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-caption font-semibold text-accent"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="sr-only">第 {index + 1} 步：</span>
                <span className="font-medium text-fg">{step}</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel aria-labelledby={`${board.id}-objects`} className="overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <SectionTitle id={`${board.id}-objects`}>将在这里管理</SectionTitle>
            <p className="mt-1 text-caption text-fg-secondary">接入后由本板块负责的业务对象。当前没有任何记录。</p>
          </div>
          <table className="w-full border-t border-line text-left">
            <thead className="bg-canvas text-caption text-fg-muted">
              <tr>
                <th scope="col" className="w-32 px-5 py-2 font-medium">
                  对象
                </th>
                <th scope="col" className="px-5 py-2 font-medium">
                  记录内容
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {board.objects.map((o) => (
                <tr key={o.name}>
                  <th scope="row" className="px-5 py-3 align-top font-medium text-fg">
                    {o.name}
                  </th>
                  <td className="px-5 py-3 text-fg-secondary">{o.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel aria-labelledby={`${board.id}-distinct`} className="px-5 py-5">
            <SectionTitle id={`${board.id}-distinct`}>需要分清的状态</SectionTitle>
            <ul className="mt-3 flex flex-col gap-2.5">
              {board.distinctions.map((d) => (
                <li key={d} className="flex gap-2.5 text-fg">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Panel>

          {board.context && (
            <Panel aria-labelledby={`${board.id}-context`} className="px-5 py-5">
              <SectionTitle id={`${board.id}-context`}>业务背景</SectionTitle>
              <p className="mt-1 flex items-center gap-1.5 text-caption text-fg-muted">
                <FileText className="size-3.5" aria-hidden />
                {board.context.source} · 计划与待确认口径，不是系统数据
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-fg-secondary">
                {board.context.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <i aria-hidden className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-control" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <section
            aria-labelledby={`${board.id}-status`}
            className="rounded-card border border-dashed border-control/70 bg-surface px-5 py-4"
          >
            <h2 id={`${board.id}-status`} className="font-semibold text-fg">
              数据接入状态：尚未接入
            </h2>
            <p className="mt-1 text-caption text-fg-secondary">
              {board.title}还没有连接任何数据源，所以本页不显示数量、金额或进度。接入后会标明数据来源与更新时间。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
