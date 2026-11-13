"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { ErrorBoundary } from "@/components/shell/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WidgetInstance, WidgetSize } from "@/contracts/dashboard";
import { cn } from "@/lib/cn";

import { WIDGET_REGISTRY } from "./widgets";

export interface WidgetEditActions {
  disabled?: boolean;
  index: number;
  total: number;
  onMove(direction: -1 | 1): void;
  onResize(size: WidgetSize): void;
  onRemove(): void;
}

const SIZE_LABEL: Record<WidgetSize, string> = { standard: "标准", wide: "宽" };

/**
 * 首页卡片外壳。窄屏统一单列，宽卡只在 ≥1024px 时占满一行；
 * 只改变渲染，不改写已保存的宽度偏好（SPEC §6）。
 */
export function WidgetCard({ widget, edit }: { widget: WidgetInstance; edit?: WidgetEditActions }) {
  const def = WIDGET_REGISTRY[widget.type];
  const titleId = `${widget.id}-title`;
  const Body = def.Body;

  return (
    <section
      aria-labelledby={titleId}
      data-widget={widget.id}
      className={cn(
        "@container flex min-w-0 flex-col rounded-card bg-surface shadow-card",
        widget.size === "wide" && "lg:col-span-2",
        edit && "outline-2 outline-offset-0 outline-accent/35",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-section font-semibold text-fg" tabIndex={-1}>
            {def.title}
          </h2>
          <p className="mt-0.5 text-caption text-fg-muted">
            {def.description} · 来源：{def.source}
          </p>
        </div>
        {def.nature === "sample" ? (
          <Badge tone="sample">状态示例</Badge>
        ) : def.nature === "partial-snapshot" ? (
          <Badge tone="info">部分为历史快照</Badge>
        ) : (
          <Badge tone="neutral">未接入</Badge>
        )}
      </header>

      <div className="min-w-0 flex-1 px-5 pb-5">
        <ErrorBoundary area="widget" title={def.title}>
          <Body />
        </ErrorBoundary>
      </div>

      {edit && (
        <div
          role="group"
          aria-label={`${def.title}：编辑操作`}
          className="flex flex-wrap items-center gap-2 rounded-b-card border-t border-line/70 bg-canvas px-4 py-2.5"
        >
          <span className="tabular mr-1 text-caption text-fg-muted">
            第 {edit.index + 1} / {edit.total} 张
          </span>
          <Button
            size="sm"
            data-action="up"
            onClick={() => edit.onMove(-1)}
            disabled={edit.disabled || edit.index === 0}
            aria-label={`将${def.title}向前移动`}
          >
            <ArrowUp aria-hidden />
            向前
          </Button>
          <Button
            size="sm"
            data-action="down"
            onClick={() => edit.onMove(1)}
            disabled={edit.disabled || edit.index === edit.total - 1}
            aria-label={`将${def.title}向后移动`}
          >
            <ArrowDown aria-hidden />
            向后
          </Button>
          <div role="radiogroup" aria-label={`${def.title}宽度`} className="inline-flex rounded-[8px] bg-subtle p-0.5">
            {def.sizes.map((size) => {
              const checked = widget.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  disabled={edit.disabled}
                  tabIndex={checked ? 0 : -1}
                  aria-checked={checked}
                  data-action={`size-${size}`}
                  onClick={() => edit.onResize(size)}
                  onKeyDown={(event) => {
                    const delta = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
                    if (!delta) return;
                    event.preventDefault();
                    const next = def.sizes[(def.sizes.indexOf(size) + delta + def.sizes.length) % def.sizes.length];
                    if (next) edit.onResize(next);
                    const group = event.currentTarget.parentElement;
                    requestAnimationFrame(() => group?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus());
                  }}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-[5px] px-2.5 text-body font-medium sm:min-h-8 disabled:opacity-55",
                    "transition-[background-color,color,box-shadow] duration-(--motion-fast)",
                    checked ? "bg-raised text-fg shadow-card" : "text-fg-secondary hover:text-fg",
                  )}
                >
                  {SIZE_LABEL[size]}
                </button>
              );
            })}
          </div>
          <Button
            size="sm"
            variant="ghost"
            data-action="remove"
            disabled={edit.disabled}
            onClick={edit.onRemove}
            aria-label={`从首页移除${def.title}`}
            className="ml-auto text-danger hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 aria-hidden />
            移除
          </Button>
        </div>
      )}
    </section>
  );
}
