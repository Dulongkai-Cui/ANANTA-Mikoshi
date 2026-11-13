import type { LucideIcon } from "lucide-react";
import { assetPath } from "@/lib/asset-path";
import { ArrowLeftRight, Database, Grid2x2, Layers, Receipt, Table2, UsersRound } from "lucide-react";

/**
 * 原“无限大B站数据系统”的两个工作台（KOL / 三方号）。
 * 页面、数据与统计口径都来自原文件，由 scripts/sync-legacy.mjs 生成到 public/legacy/。
 * 这里只登记外壳需要的导航信息；页面 id 必须与原页面内部的 id 一致。
 */
export type LegacyModuleId = "kol" | "thirdparty";

export interface LegacyPage {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface LegacyModule {
  id: LegacyModuleId;
  /** 对应的 Mikoshi 路由 */
  path: "/kol" | "/third-party";
  label: string;
  description: string;
  /** 原系统登记的快照说明 */
  snapshot: string;
  src: string;
  pages: readonly LegacyPage[];
}

export const LEGACY_MODULES: Record<LegacyModuleId, LegacyModule> = {
  kol: {
    id: "kol",
    path: "/kol",
    label: "KOL",
    description: "合作达人 · 发布效果与内容分析",
    snapshot: "尚无业务数据",
    src: assetPath("/legacy/kol.html"),
    pages: [
      { id: "home", label: "发布效果总览", icon: Grid2x2 },
      { id: "overview", label: "全局透视", icon: Table2 },
    ],
  },
  thirdparty: {
    id: "thirdparty",
    path: "/third-party",
    label: "三方号",
    description: "供应商协作 · 三方 / 创作 / 激励",
    snapshot: "尚无业务数据",
    src: assetPath("/legacy/thirdparty.html"),
    pages: [
      { id: "home", label: "发布总览", icon: Grid2x2 },
      { id: "pivot", label: "全局透视", icon: Table2 },
      { id: "library", label: "账号与作品", icon: UsersRound },
      { id: "content", label: "内容与讨论", icon: Layers },
      { id: "finance", label: "费用与起飞", icon: Receipt },
      { id: "review", label: "节点复盘", icon: ArrowLeftRight },
      { id: "sources", label: "数据与口径", icon: Database },
    ],
  },
};

export function legacyModuleForPath(pathname: string): LegacyModule | undefined {
  return Object.values(LEGACY_MODULES).find((m) => m.path === pathname);
}

export function isLegacyPage(module: LegacyModule, page: unknown): page is string {
  return typeof page === "string" && module.pages.some((p) => p.id === page);
}

/** 首页“数据快照”读取的汇总（由同步脚本从原数据计算，字段内写明口径） */
export interface LegacySummary {
  generatedAt?: string;
  schemaVersion?: number;
  sourceHash?: string;
  kol: { snapshotAt: string | null; works: number; creators: number; views: number; knownViewRecords: number; missingViews: number; basis: string; snapshotLabel: string };
  thirdParty: {
    snapshotAt: string | null;
    range: { start: string | null; end: string | null };
    works: number;
    accounts: number;
    views: number;
    knownViewRecords: number;
    missingViews: number;
    basis: string;
    snapshotLabel: string;
  };
}
