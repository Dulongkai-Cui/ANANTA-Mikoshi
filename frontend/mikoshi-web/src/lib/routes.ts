import type { LucideIcon } from "lucide-react";
import { legacyModuleForPath, isLegacyPage } from "@/features/legacy/modules";
import { KOL_STUDIO_PATH, KOL_STUDIO_VIEWS, isKolStudioView, kolStudioHref } from "@/features/kol-studio/modules";
import {
  Handshake,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Settings,
  UsersRound,
  CalendarDays,
  CalendarClock,
  UserRoundPlus,
  KanbanSquare,
} from "lucide-react";

/**
 * 导航与页面元数据的唯一来源（SPEC §3）。
 * 顶部业务切换、页面搜索、returnTo 白名单都从这里读取，不另维护第二份。
 */
export interface AppRoute {
  path: string;
  /** 顶部业务切换与搜索显示的导航名，不改成技术组件名 */
  label: string;
  /** 页面搜索可匹配的别名 */
  aliases: readonly string[];
  icon: LucideIcon;
  group: "home" | "business" | "personal";
  /** 二级页面的所属工作区；只在侧栏与搜索中显示。 */
  parentPath?: string;
}

export const APP_ROUTES: readonly AppRoute[] = [
  { path: "/miko", label: "MIKO", aliases: ["AI", "助手", "智能助手", "对话", "miko"], icon: MessagesSquare, group: "home" },
  { path: "/dashboard", label: "我的工作台", aliases: ["首页", "工作台", "看板", "dashboard", "home"], icon: LayoutDashboard, group: "home" },
  { path: "/dashboard/tasks", label: "任务看板", aliases: ["项目任务", "任务表格", "分工", "营销项目"], icon: KanbanSquare, group: "home", parentPath: "/dashboard" },
  { path: "/dashboard/timeline", label: "项目时间轴", aliases: ["甘特", "事件线", "里程碑", "关键节点"], icon: CalendarDays, group: "home", parentPath: "/dashboard" },
  { path: "/dashboard/people", label: "人员进度", aliases: ["成员", "人员负载", "团队分工"], icon: UsersRound, group: "home", parentPath: "/dashboard" },
  { path: "/dashboard/kol", label: "KOL协作概览", aliases: ["工作台KOL", "营销达人协作"], icon: Handshake, group: "home", parentPath: "/dashboard" },
  { path: "/third-party", label: "三方号", aliases: ["三方号看板", "账号", "供应商", "发布", "third party"], icon: Megaphone, group: "business" },
  { path: "/third-party/plans", label: "发布计划", aliases: ["排期", "内容计划", "schedule"], icon: CalendarClock, group: "business", parentPath: "/third-party" },
  { path: "/third-party/calendar", label: "发布日历", aliases: ["日历", "改期", "calendar"], icon: CalendarDays, group: "business", parentPath: "/third-party" },
  { path: "/third-party/accounts", label: "账号入库", aliases: ["新账号", "蘑菇", "伏羲", "入库", "账号管理"], icon: UserRoundPlus, group: "business", parentPath: "/third-party" },
  { path: "/kol", label: "KOL", aliases: ["达人", "合作", "达人合作", "kol"], icon: UsersRound, group: "business" },
  ...KOL_STUDIO_VIEWS.map((view): AppRoute => ({ path: kolStudioHref(view.id), label: view.label, aliases: view.aliases, icon: view.icon, group: "business", parentPath: "/kol" })),
  { path: "/kol/progress", label: "合作进度", aliases: ["KOL进度", "达人进度", "阶段", "锁档", "主推", "备选"], icon: KanbanSquare, group: "business", parentPath: "/kol" },
  { path: "/settings", label: "个人设置", aliases: ["设置", "主题", "深色", "浅色", "减少动效", "偏好", "settings"], icon: Settings, group: "personal" },
] as const;

export const HOME_PATH = "/dashboard";
export const LOGIN_PATH = "/login";

const PROTECTED_PATHS: ReadonlySet<string> = new Set(APP_ROUTES.map((r) => r.path.split("#")[0] ?? r.path));

export function findRoute(pathname: string): AppRoute | undefined {
  return APP_ROUTES.find((r) => r.path === (pathname === KOL_STUDIO_PATH ? kolStudioHref() : pathname));
}

export function findWorkspaceRoute(pathname: string): AppRoute | undefined {
  const route = findRoute(pathname);
  return route?.parentPath ? findRoute(route.parentPath) : route;
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.has(pathname);
}

/**
 * 校验登录后回跳目标（SPEC §5.1）。只接受白名单内的站内绝对路径原文。
 * 拒绝：外域/协议、协议相对 `//`、反斜杠、任何百分号编码或空白/控制字符、
 * 查询、未登记片段、`/login` 本身及未登记路径。仅KOL/三方号登记子页允许片段。
 */
export function sanitizeReturnTo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > 128) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // 不解码：白名单路径本身不含 %、\、空白与控制字符，出现即视为绕过尝试。
  if (/[%\\\s\u0000-\u001f\u007f?:@]/.test(value)) return null;
  const [pathname = "", fragment, extra] = value.split("#");
  if (extra !== undefined || !PROTECTED_PATHS.has(pathname)) return null;
  if (fragment !== undefined) {
    if (pathname === KOL_STUDIO_PATH) return isKolStudioView(fragment) ? value : null;
    const legacy = legacyModuleForPath(pathname);
    if (!legacy || !isLegacyPage(legacy, fragment)) return null;
  }
  return value;
}

/** 未登录访问受保护页面时构造登录地址。 */
export function loginHrefFor(pathname: string): string {
  const target = sanitizeReturnTo(pathname);
  if (!target || target === HOME_PATH) return LOGIN_PATH;
  return `${LOGIN_PATH}?returnTo=${encodeURIComponent(target)}`;
}
