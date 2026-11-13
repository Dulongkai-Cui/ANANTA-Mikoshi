import { APP_ROUTES, type AppRoute } from "@/lib/routes";

/**
 * 页面搜索：只匹配本步真实页面的导航名与别名，不是业务全文检索（SPEC §5.2）。
 * 匹配不区分大小写与全/半角空白；导航名命中排在别名命中之前。
 */
export function searchPages(query: string): AppRoute[] {
  const q = normalize(query);
  if (!q) return [...APP_ROUTES];
  const scored: Array<{ route: AppRoute; score: number }> = [];
  for (const route of APP_ROUTES) {
    const label = normalize(route.label);
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (label.includes(q)) score = 1;
    else if (route.aliases.some((a) => normalize(a).startsWith(q))) score = 2;
    else if (route.aliases.some((a) => normalize(a).includes(q))) score = 3;
    if (score >= 0) scored.push({ route, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.route);
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}
