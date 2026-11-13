import { CalendarDays, ChartNoAxesCombined, GitBranch, Layers3, Lightbulb, Network, Target, UsersRound, Wallet } from "lucide-react";

export const KOL_STUDIO_PATH = "/kol/studio";
export const KOL_STUDIO_CHANNEL = "mikoshi-kol-studio-v1";
export const KOL_STUDIO_VIEWS = [
  { id: "kols", label: "UP资料库", icon: UsersRound, aliases: ["达人资料", "量化筛选", "UP档案", "报价"], section: "选人与策划" },
  { id: "pool", label: "中选池", icon: Layers3, aliases: ["已选UP", "人选组合", "阵容"], section: "选人与策划" },
  { id: "ideas", label: "创意提词板", icon: Lightbulb, aliases: ["创意卡片", "KOL创意"], section: "选人与策划" },
  { id: "factory", label: "脑暴工厂", icon: GitBranch, aliases: ["脑暴", "创意画布", "标准件"], section: "选人与策划" },
  { id: "calendar", label: "策划排期", icon: CalendarDays, aliases: ["中选排期", "KOL策划日历", "传播节点"], section: "选人与策划" },
  { id: "overview", label: "策划总览", icon: ChartNoAxesCombined, aliases: ["KOL工作总览", "筛选概览"], section: "分析与资料" },
  { id: "relations", label: "合作关系图", icon: Network, aliases: ["共同作品", "组合建议", "关系网"], section: "分析与资料" },
  { id: "budgets", label: "预算与覆盖", icon: Wallet, aliases: ["KOL预算", "报价覆盖"], section: "分析与资料" },
  { id: "selling", label: "卖点地图", icon: Target, aliases: ["卖点覆盖", "产品卖点"], section: "分析与资料" },
] as const;

export type KolStudioView = typeof KOL_STUDIO_VIEWS[number]["id"];
export function isKolStudioView(value: unknown): value is KolStudioView {
  return typeof value === "string" && KOL_STUDIO_VIEWS.some((view) => view.id === value);
}
export function kolStudioHref(view: KolStudioView = "kols") {
  return `${KOL_STUDIO_PATH}#${view}`;
}
export function kolStudioViewFromHash(hash: string): KolStudioView | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  return isKolStudioView(value) ? value : null;
}
