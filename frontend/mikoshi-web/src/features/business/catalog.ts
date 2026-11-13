/**
 * 当前业务页面的描述配置（唯一来源；仅当前三方号与KOL）。本步只用于导航与解释：
 * 职责、流程框架、未来管理对象与需要区分的状态。不含任何业务数据，
 * 精确数据口径与审批规则仍待后续研究（SPEC §3）。
 */

export type BusinessId = "third-party" | "kol";

export interface BusinessObject {
  name: string;
  detail: string;
}

export interface BusinessBoard {
  id: BusinessId;
  path: `/${BusinessId}`;
  title: string;
  /** 一句话职责 */
  summary: string;
  /** 流程框架：说明文本，不是可点击步骤 */
  flow: readonly [string, string, string, string];
  /** 将来在本板块管理的对象 */
  objects: readonly BusinessObject[];
  /** 页面必须让人一眼分清的状态（DESIGN_STANDARD §6） */
  distinctions: readonly string[];
  /** 业务性质提醒，例如 VPC 的模拟属性 */
  nature?: { label: string; detail: string };
  /** 首页“业务概览”卡片中的简短说明 */
  overviewHint: string;
  /** 页头英文眉题（沿用无限大B站数据系统的版式） */
  eyebrow: string;
  /** 将来接入后展示的核心指标；当前一律显示“—”，不虚构数值 */
  kpis: readonly { label: string; hint: string }[];
  /** 工作盘点中已有的业务背景（计划/待确认口径，不是系统数据） */
  context?: { source: string; items: readonly string[] };
}

export const BUSINESS_BOARDS: readonly BusinessBoard[] = [
  {
    id: "third-party",
    path: "/third-party",
    title: "三方号",
    summary: "管理合作三方账号与供应商的内容运营：从账号归属、内容计划与审核，到排期发布和效果复盘。",
    flow: ["账号与供应商", "内容计划与审核", "排期发布", "数据回收与复盘"],
    objects: [
      { name: "三方账号", detail: "平台、归属供应商、运营周期与负责人" },
      { name: "供应商", detail: "合作范围、对接人与结算口径" },
      { name: "内容计划", detail: "选题、内容版本与审核意见" },
      { name: "发布记录", detail: "排期、实际发布时间与平台回执" },
      { name: "效果数据", detail: "数据来源、统计口径与更新时间" },
    ],
    distinctions: ["草稿、已审核、已提交与平台确认发布是四个不同状态", "目标 KPI 与真实回收结果分开展示"],
    overviewHint: "账号、内容审核与发布回执",
    eyebrow: "THIRD-PARTY CONTENT",
    kpis: [
      { label: "发布作品", hint: "按作品去重" },
      { label: "累计播放", hint: "作品累计值" },
      { label: "合作报价", hint: "已填报价" },
      { label: "报价 CPM", hint: "报价 ÷ 播放 × 1000" },
    ],
  },
  {
    id: "kol",
    path: "/kol",
    title: "KOL",
    summary: "管理达人资源与合作推进：从资料与报价，到沟通推进、交付物确认与效果回收。",
    flow: ["资源与合作", "沟通推进", "内容交付", "效果回收"],
    objects: [
      { name: "达人资料", detail: "平台、内容领域与历史合作" },
      { name: "合作单", detail: "报价口径、档期与付款节点" },
      { name: "交付物", detail: "脚本、成片、发布链接与确认记录" },
      { name: "复盘", detail: "效果数据、评价与是否继续合作" },
    ],
    distinctions: ["意向与已签约、报价与结算分开记录", "档期是否锁定用文字标明，不只靠颜色"],
    overviewHint: "达人合作、档期与交付确认",
    eyebrow: "KOL INSIGHT",
    kpis: [
      { label: "发布数量", hint: "B站去重作品" },
      { label: "累计播放", hint: "公开数据累计" },
      { label: "CPM", hint: "合作 + 起飞" },
      { label: "整体互动率", hint: "互动 ÷ 播放" },
    ],
  },
] as const;

export function getBoard(id: BusinessId): BusinessBoard {
  const board = BUSINESS_BOARDS.find((b) => b.id === id);
  if (!board) throw new Error(`unknown board ${id}`);
  return board;
}
