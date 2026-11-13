import { Archive } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { LEGACY_MODULES, type LegacyModuleId } from "./modules";

/**
 * 工作台路由的页头条：板块名（h1）、职责、快照性质。
 * 下方的工作台内容来自原“无限大B站数据系统”，数据为历史快照、不会自动刷新。
 */
export function LegacyHeader({ id }: { id: LegacyModuleId }) {
  const mod = LEGACY_MODULES[id];
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line bg-surface px-4 py-2.5 md:px-8">
      <h1 className="text-body font-semibold text-fg">{mod.label}</h1>
      <span className="text-caption text-fg-secondary">{mod.description}</span>
      <span className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent-soft px-2 py-0.5 text-caption font-medium text-accent"
          >
            <Archive className="size-3.5" aria-hidden />
            初始工作区
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">
          {mod.label}已初始化，历史资料已单独保全。入库与排期为管理资料，发布效果待后续接入。
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
