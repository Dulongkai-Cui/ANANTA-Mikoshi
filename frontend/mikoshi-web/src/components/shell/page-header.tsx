import * as React from "react";

import { cn } from "@/lib/cn";

/**
 * 页面层级（FE-08）：英文眉题 → 标题与状态 → 常用动作。
 * 版式沿用“无限大B站数据系统”：蓝色英文眉题 + 27px 标题 + 12px 说明。
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0 max-w-3xl flex-[1_1_20rem]">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-title font-semibold tracking-[0.02em] text-fg break-anywhere">{title}</h1>
        {description && <p className="mt-1.5 text-caption text-fg-secondary">{description}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 md:mt-3">{actions}</div>}
    </header>
  );
}

/** 卡片内区块标题：左侧 3px 蓝色短标（原系统 .panel-title .tiny-mark） */
export function SectionTitle({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn("flex items-center gap-2 text-section font-semibold text-fg", className)}>
      <span aria-hidden className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent" />
      {children}
    </h2>
  );
}

/** 原系统的白色面板 */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("min-w-0 rounded-card bg-surface shadow-card", className)} {...props} />;
}
