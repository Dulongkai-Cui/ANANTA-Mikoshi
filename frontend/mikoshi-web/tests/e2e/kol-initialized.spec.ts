import { expect, test, type Page } from "@playwright/test";

// Default production assets, without historical fixtures or synthetic effect records.
const frame = (page: Page) => page.frameLocator('iframe[src^="/legacy/kol.html"]');
const pages = [
  ["home", "首页", "发布效果总览"], ["overview", "全局透视", "全局透视"],
  ["creators", "达人与视频", "达人与视频"], ["content", "内容与卖点", "内容与卖点"],
  ["sentiment", "评论与舆情", "评论与舆情"], ["compare", "对比与复盘", "对比与复盘"],
  ["quality", "数据与口径", "数据与口径"],
] as const;
const sections = {
  home: ["发布与表现", "费用分配与人群方向", "视频类型构成", "热门作品", "费用消耗细则", "作品播放分布", "互动构成", "节点与竞品对照", "评论内容方向"],
  overview: ["全局透视工作台"], creators: [],
  content: ["内容方向分布", "标注方式", "作品标注库"],
  sentiment: ["评论内容方向", "主题占比 × 评价方向", "评论证据库"],
  compare: ["节点对照", "竞品搜索样本", "节点数据核对", "两位达人对比", "执行复盘与下一步"],
  quality: ["数据接入状态", "需要补齐的数据", "指标字典", "来源与核验记录"],
};
async function login(page: Page) {
  await page.goto("/kol");
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/kol#home");
  await expect(frame(page).getByRole("heading", { name: "发布效果总览", exact: true, level: 1 })).toBeVisible();
}
async function navigate(page: Page, label: string) {
  if (page.viewportSize()!.width < 768) await page.getByRole("button", { name: "打开导航", exact: true }).click();
  await page.getByRole("navigation", { name: "当前业务页面", exact: true }).getByRole("link", { name: label, exact: true }).click();
  if (page.viewportSize()!.width < 768) await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(0);
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [], external: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== "127.0.0.1") external.push(request.url()); });
  await page.exposeFunction("readKolInitializationErrors", () => ({ errors, external }));
});
test.afterEach(async ({ page }) => {
  if (!page.isClosed()) expect(await page.evaluate(() => (window as typeof window & { readKolInitializationErrors(): Promise<{ errors: string[]; external: string[] }> }).readKolInitializationErrors())).toEqual({ errors: [], external: [] });
});

test("KOL default assets and seven analytical pages stay empty with complete structures", async ({ page, request }, testInfo) => {
  const summary = await (await request.get("/legacy/summary.json")).json();
  expect(summary.kol).toMatchObject({ works: 0, creators: 0, views: 0, knownViewRecords: 0, missingViews: 0, snapshotAt: null });
  expect(summary.thirdParty).toMatchObject({ works: 0, accounts: 0, views: 0, snapshotAt: null });
  const html = await (await request.get("/legacy/kol.html")).text();
  expect(html).not.toContain("const DATA=");
  expect(html).not.toContain("commentSeed");
  await login(page);
  const key = "mikoshi.legacy.v1:demo-u-linxu:kol:infinity_kol_comments_v1", original = '[{"text":"preserve-kol-old-comment"}]';
  await page.evaluate(({ key, original }) => localStorage.setItem(key, original), { key, original });
  for (const [id, label, title] of pages) {
    await navigate(page, label);
    await expect(page).toHaveURL("/kol#" + id);
    await expect(frame(page).getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    for (const section of sections[id]) await expect(frame(page).getByRole("heading", { name: section, exact: true })).toBeVisible();
    expect(await frame(page).locator("body").innerText()).not.toMatch(/NaN|Infinity|2728|2860|199\.35|原始190|科隆|TGS|preserve-kol-old-comment/);
    await expect(frame(page).locator("[data-uid],[data-bvid],a[href]")).toHaveCount(0);
    await expect(frame(page).getByRole("button", { name: "导出明细，当前没有可导出的发布记录", exact: true })).toBeDisabled();
    expect(await frame(page).locator("html").evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("kol-zero-" + id + "-desktop.png") });
  }
  await page.reload();
  await expect(frame(page).getByRole("heading", { name: "数据与口径", exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(original);
  await navigate(page, "首页");
  await expect(frame(page).locator(".zd-metrics .zd-stat strong")).toHaveText(["0", "0", "—", "¥0", "—"]);
  await expect(frame(page).locator('[data-zero-chart="trend"]')).toBeVisible();
  await expect(frame(page).getByRole("img", { name: "发布作品为空，中性底环，无占比", exact: true })).toHaveCount(1);
});

test("KOL creator/video layouts are independent; button, Enter and IME search escape text without a sandbox form", async ({ page }, testInfo) => {
  await login(page);
  await navigate(page, "达人与视频");
  for (const [label, kind] of [["视频作品 · 0", "video"], ["合作达人 · 0", "creator"]]) {
    await frame(page).getByRole("button", { name: label, exact: true }).click();
    for (const layout of ["卡片", "横向明细"]) {
      await frame(page).getByRole("button", { name: layout, exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(frame(page).getByRole("button", { name: layout, exact: true })).toHaveAttribute("aria-pressed", "true");
      const placeholders = frame(page).locator('[data-placeholder="' + kind + '"]');
      await expect(placeholders).toHaveCount(3);
      for (const button of await placeholders.getByRole("button").all()) await expect(button).toBeDisabled();
      await expect(frame(page).locator(".zd-pagination")).toContainText("共 0 条记录");
      await page.screenshot({ path: testInfo.outputPath("kol-zero-" + kind + "-" + layout + ".png") });
    }
  }
  await frame(page).getByRole("button", { name: "卡片", exact: true }).click();
  await frame(page).getByRole("button", { name: "视频作品 · 0", exact: true }).click();
  await expect(frame(page).getByRole("button", { name: "横向明细", exact: true })).toHaveAttribute("aria-pressed", "true");
  await frame(page).getByRole("button", { name: "合作达人 · 0", exact: true }).click();
  await expect(frame(page).getByRole("button", { name: "卡片", exact: true })).toHaveAttribute("aria-pressed", "true");
  const search = frame(page).getByRole("textbox", { name: "搜索达人、标题或 BV 号", exact: true });
  await search.fill('<svg onload="window.kolXss=1">');
  await search.press("Enter");
  await expect(frame(page).locator(".zd-insight")).toContainText('<svg onload="window.kolXss=1">');
  expect(await frame(page).locator("html").evaluate(() => (window as typeof window & { kolXss?: number }).kolXss)).toBeUndefined();
  await expect(frame(page).locator("form")).toHaveCount(0);
  await frame(page).getByRole("button", { name: "清除搜索", exact: true }).click();
  await search.fill("正在组合");
  await search.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(frame(page).locator(".zd-insight")).toHaveCount(0);
  await frame(page).getByRole("button", { name: "搜索", exact: true }).click();
  await expect(frame(page).locator(".zd-insight")).toContainText("正在组合");
});

test("KOL date/tier/type filters, zero series and comment filters report the actual selected view", async ({ page }) => {
  await login(page);
  await frame(page).getByLabel("开始日期", { exact: true }).fill("2026-10-05");
  await frame(page).getByLabel("结束日期", { exact: true }).fill("2026-10-26");
  await frame(page).getByLabel("达人层级", { exact: true }).selectOption("head");
  await frame(page).getByLabel("视频类型", { exact: true }).selectOption("试玩评测");
  await expect(frame(page).locator(".zd-filter-summary")).toContainText("2026-10-05 — 2026-10-26");
  await expect(frame(page).locator(".zd-filter-summary")).toContainText("头部 · ≥100万粉");
  await frame(page).getByRole("button", { name: "按周", exact: true }).click();
  const dates = (await frame(page).locator('[data-zero-chart="trend"] text').allTextContents()).filter(text => /^\d{2}-\d{2}/.test(text));
  expect(dates).toEqual(["10-05周", "10-12周", "10-19周", "10-26周"]);
  await frame(page).getByRole("button", { name: "试玩评测图例", exact: true }).click();
  await expect(frame(page).getByRole("button", { name: "试玩评测图例", exact: true })).toHaveAttribute("aria-pressed", "false");
  await frame(page).getByRole("button", { name: "累计播放", exact: true }).click();
  await expect(frame(page).locator('[data-zero-chart="trend"] [data-series="view"]')).toHaveCount(0);
  await frame(page).getByRole("button", { name: "预约新增", exact: true }).click();
  await expect(frame(page).locator(".zd-caption").filter({ hasText: "预约数据未接入，不绘制曲线" })).toHaveCount(1);
  await frame(page).getByRole("button", { name: "人群方向", exact: true }).click();
  await expect(frame(page).getByRole("columnheader", { name: "人群方向", exact: true })).toBeVisible();
  await navigate(page, "评论与舆情");
  await frame(page).getByLabel("评论讨论对象", { exact: true }).selectOption("game");
  await frame(page).getByLabel("评论倾向", { exact: true }).selectOption("negative");
  await frame(page).getByRole("textbox", { name: "搜索评论、UP主或 BV 号", exact: true }).fill("玩法");
  await frame(page).getByRole("button", { name: "搜索", exact: true }).click();
  await expect(frame(page).locator('[role="status"]').filter({ hasText: "当前筛选 0 条评论" })).toContainText("玩法");
  await expect(frame(page).getByLabel("评论倾向", { exact: true })).toHaveValue("negative");
});

test("KOL pivot changes row/column structures and protects its last selected metric", async ({ page }) => {
  await login(page);
  await navigate(page, "全局透视");
  await frame(page).getByLabel("透视行维度", { exact: true }).selectOption("creator");
  await frame(page).getByLabel("透视列维度", { exact: true }).selectOption("week");
  await expect(frame(page).getByRole("columnheader", { name: "UP 主", exact: true })).toBeVisible();
  await expect(frame(page).getByRole("columnheader", { name: "发布周 · 待分组", exact: true })).toBeVisible();
  for (const name of ["作品数", "互动率", "发布 UP 数"]) await frame(page).getByRole("checkbox", { name, exact: true }).uncheck();
  await frame(page).getByRole("checkbox", { name: "累计播放", exact: true }).click();
  await expect(frame(page).getByRole("alert")).toContainText("请至少保留一个透视指标");
  await expect(frame(page).getByRole("checkbox", { name: "累计播放", exact: true })).toBeChecked();
  await frame(page).getByRole("button", { name: "条形", exact: true }).click();
  await expect(frame(page).locator(".zd-pivot-bar")).toBeVisible();
  await expect(frame(page).locator("tfoot")).toContainText("总计 · 0 条");
  await frame(page).getByRole("button", { name: "收起组合图", exact: true }).click();
  await expect(frame(page).locator('[data-zero-chart="pivot"]')).toHaveCount(0);
  await frame(page).getByRole("button", { name: "默认搭配", exact: true }).click();
  await expect(frame(page).getByLabel("透视行维度", { exact: true })).toHaveValue("date");
  await expect(frame(page).getByLabel("透视列维度", { exact: true })).toHaveValue("metrics");
  await expect(frame(page).locator('[data-zero-chart="pivot"]')).toHaveCount(1);
});

test("KOL zero pages reflow at 320px dark and 200% text with locally scrollable readable charts", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await login(page);
  for (const [id, label, title] of pages) {
    await navigate(page, label);
    await expect(frame(page).getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
    await expect(frame(page).locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await frame(page).locator("html").evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await frame(page).locator("button,select,input:not([type=checkbox])").evaluateAll(nodes => nodes.filter(n => n.getClientRects().length).every(n => n.getBoundingClientRect().height >= 44))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("kol-zero-" + id + "-320-dark.png") });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate(page, "首页");
  await page.evaluate(() => document.documentElement.style.fontSize = "32px");
  await expect(frame(page).locator("html")).toHaveCSS("font-size", "32px");
  await expect(frame(page).locator("svg.zd-chart text").first()).toBeVisible();
  await expect.poll(async () => frame(page).locator("svg.zd-chart text").evaluateAll(nodes => nodes.every(n => {
    const matrix = (n as SVGTextElement).getScreenCTM();
    return !!matrix && parseFloat(getComputedStyle(n).fontSize) * Math.hypot(matrix.a, matrix.b) >= 23.95;
  }))).toBe(true);
  expect(await frame(page).locator("html").evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
  const scroll = frame(page).getByRole("region", { name: "发布表现图，可横向滚动", exact: true });
  await scroll.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => scroll.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath("kol-zero-home-dark-text200-chart.png") });
});
