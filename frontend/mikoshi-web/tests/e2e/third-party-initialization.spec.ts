import { expect, test, type Page } from "@playwright/test";
import { publicationKey } from "../../src/features/third-party/repository";
import type { PublicationStore } from "../../src/features/third-party/model";

// These scenarios use the real empty production assets. No historical route fixture.
const primary = (page: Page) => page.getByRole("navigation", { name: "主导航", exact: true });
const frame = (page: Page) => page.frameLocator('iframe[src^="/legacy/thirdparty.html"]');
const key = publicationKey("demo-u-linxu");
const pages = [["home", "发布总览"], ["pivot", "全局透视"], ["library", "账号与作品"], ["content", "内容与讨论"], ["finance", "费用与起飞"], ["review", "节点复盘"], ["sources", "数据与口径"]] as const;
const sections = {
  home: ["发布节奏与播放贡献", "供应商 × 投放类型", "内容形式分布", "供应商贡献与覆盖"],
  pivot: [], library: [],
  content: ["内容形式 × 产出效率", "标题主题 · 播放贡献", "评论立场 · 申报"],
  finance: ["合作报价分布", "报价效率与字段覆盖", "起飞投放明细"],
  review: ["节点费用", "节点播放", "内容标签 · 节点对比", "分平台汇总核对"],
  sources: ["来源与统计边界", "指标口径", "字段差异与处理记录"],
};
async function login(page: Page, route = "/third-party") {
  await page.goto(route);
  await expect(page.getByText("KOL 与三方号从入库、合作跟进和发布计划开始", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(route === "/third-party" ? "/third-party#home" : route);
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
  await page.exposeFunction("readInitializationErrors", () => ({ errors, external }));
});
test.afterEach(async ({ page }) => {
  if (page.isClosed()) return;
  expect(await page.evaluate(() => (window as typeof window & { readInitializationErrors(): Promise<{ errors: string[]; external: string[] }> }).readInitializationErrors())).toEqual({ errors: [], external: [] });
});

for (const mobileDark of [false, true]) {
  test(`all seven default third-party pages remain empty through navigation and refresh${mobileDark ? " at 320px dark" : " on desktop"}`, async ({ page, request }, testInfo) => {
    if (mobileDark) { await page.setViewportSize({ width: 320, height: 720 }); await page.emulateMedia({ colorScheme: "dark" }); }
    const catalog = await (await request.get("/legacy/thirdparty-catalog.json")).json();
    expect(catalog.accounts).toEqual([]);
    const summary = await (await request.get("/legacy/summary.json")).json();
    expect(summary.thirdParty).toMatchObject({ works: 0, accounts: 0, views: 0, knownViewRecords: 0, missingViews: 0, snapshotAt: null, range: { start: null, end: null } });
    expect(summary.kol).toMatchObject({ works: 0, creators: 0, views: 0, snapshotAt: null });
    if (!mobileDark) {
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: "登录 Mikoshi", exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("initial-login-desktop.png"), fullPage: false });
    }
    await login(page);
    await page.getByText("演示环境", { exact: true }).focus();
    await expect(page.getByRole("tooltip")).toContainText("KOL与三方号管理资料保存在本机");
    await page.keyboard.press("Escape");
    if (!mobileDark) await expect(page.getByText("本地演示环境 · 资料仅存本机", { exact: true })).toBeVisible();
    for (const [id, title] of pages) {
      await navigate(page, title);
      await expect(page).toHaveURL(`/third-party#${id}`);
      await expect(frame(page).getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
      await expect(frame(page).locator("footer")).toContainText("当前记录 0 条 · 尚无真实发布效果数据");
      // Chart ticks and preset dimensions are legitimate labels, not historical records.
      expect(await frame(page).locator("body").innerText()).not.toMatch(/NaN|Infinity|374\s*条|85\s*个|2026[./-]0[89]|申报总额/);
      for (const section of sections[id]) await expect(frame(page).getByRole("heading", { name: section, exact: true })).toBeVisible();
      await expect(frame(page).locator('[data-account-id],[data-work-id]')).toHaveCount(0);
      await expect(frame(page).getByRole("button", { name: /^导出(?:明细|节点对比)，/ })).toBeDisabled();
      if (mobileDark) await expect(frame(page).locator("html")).toHaveAttribute("data-theme", "dark");
      expect(await frame(page).locator("html").evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
      if (id === "home") {
        await expect(frame(page).locator(".zd-metrics .zd-stat strong")).toHaveText(["0", "0", "¥0", "—", "0", "—"]);
        const chart = frame(page).getByRole("img", { name: "发布节奏与播放贡献，当前范围0条作品", exact: true });
        await expect(chart).toContainText("累计播放 / 次");
        await expect(chart).toContainText("发布数 / 条");
        await expect(chart).toContainText("尚无发布记录，暂无非零走势");
        const dates = (await chart.locator("text").allTextContents()).filter(text => /^\d{2}-\d{2}/.test(text));
        expect(dates.length).toBeGreaterThan(1);
        for (const date of dates) expect(date).toMatch(/^\d{2}-\d{2}$/);
        for (const category of ["三方", "创作", "激励"]) await expect(frame(page).getByRole("button", { name: `${category}图例`, exact: true })).toHaveAttribute("aria-pressed", "true");
        await expect(frame(page).getByRole("img", { name: "作品数为空，中性底环，无占比", exact: true })).toBeVisible();
      }
      if (id === "pivot") {
        await expect(frame(page).getByLabel("纵向分组", { exact: true })).toBeVisible();
        await expect(frame(page).getByRole("columnheader", { name: "报价 CPM", exact: true })).toBeVisible();
        await expect(frame(page).locator("tfoot")).toContainText("总计 · 0 条");
      }
      if (id === "library") {
        for (const [object, kind] of [["账号贡献", "账号"], ["作品明细", "作品"]]) {
          await frame(page).getByRole("button", { name: object, exact: true }).click();
          for (const layout of ["横向表格", "卡片"]) {
            await frame(page).getByRole("button", { name: `${kind}${layout}布局`, exact: true }).click();
            const placeholders = frame(page).locator(`[data-placeholder="${kind === "账号" ? "account" : "work"}"]`);
            expect(await placeholders.count()).toBeGreaterThan(0);
            await expect(placeholders.first()).toContainText(kind === "账号" ? "账号待录入" : "作品待发布");
            await expect(placeholders.locator("a")).toHaveCount(0);
            for (const button of await placeholders.getByRole("button").all()) await expect(button).toBeDisabled();
            await expect(frame(page).locator(".zd-pagination")).toContainText("共 0 条记录");
            await expect(frame(page).getByRole("button", { name: `${kind}${layout}布局`, exact: true })).toHaveAttribute("aria-pressed", "true");
          }
        }
      }
    }
    await page.reload();
    await expect(frame(page).getByRole("heading", { name: "数据与口径", exact: true })).toBeVisible();
    await navigate(page, "发布总览");
    await expect(frame(page).locator(".zd-metrics .zd-stat strong")).toHaveText(["0", "0", "¥0", "—", "0", "—"]);
    await page.screenshot({ path: testInfo.outputPath(`initial-seven-pages-${mobileDark ? "320-dark" : "desktop"}.png`), fullPage: false });
    await primary(page).getByRole("link", { name: "KOL", exact: true }).click();
    const kol = page.frameLocator('iframe[src^="/legacy/kol.html"]');
    await expect(kol.getByRole("heading", { name: "发布效果总览", exact: true })).toBeVisible();
    expect(await kol.locator("body").innerText()).not.toMatch(/65\s*条|46\s*位|2728\.31/);
  });
}

test("zero dashboard filters, chart controls and reset change the actual empty view without inventing data", async ({ page }) => {
  await login(page);
  const workspace = frame(page);
  const expectedMonth = await page.evaluate(() => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit" }).formatToParts(new Date());
    const year = parts.find(part => part.type === "year")!.value;
    const month = parts.find(part => part.type === "month")!.value;
    return [`${year}-${month}-01`, `${year}-${month}-${new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()}`];
  });
  await expect(workspace.getByLabel("开始日期", { exact: true })).toHaveValue(expectedMonth[0]!);
  await expect(workspace.getByLabel("结束日期", { exact: true })).toHaveValue(expectedMonth[1]!);
  await workspace.getByLabel("开始日期", { exact: true }).fill("2001-01-01");
  await workspace.getByLabel("结束日期", { exact: true }).fill("2001-01-31");
  await workspace.getByLabel("供应商筛选", { exact: true }).selectOption("蘑菇");
  await workspace.getByLabel("投放类型筛选", { exact: true }).selectOption("三方");
  await workspace.getByLabel("内容形式筛选", { exact: true }).selectOption("资讯");
  await expect(workspace.getByRole("region", { name: "全局筛选", exact: true })).toContainText("2001-01-01 — 2001-01-31 · 蘑菇 · 三方 · 资讯");
  const matrix = workspace.locator("section").filter({ has: workspace.getByRole("heading", { name: "供应商 × 投放类型", exact: true }) });
  await expect(matrix.getByRole("columnheader")).toHaveText(["供应商 / 投放", "三方"]);
  await expect(matrix).not.toContainText("伏羲");
  await workspace.getByRole("button", { name: "按周", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "按周", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(workspace.locator("#page-content")).toContainText("累计播放 0 次 · 发布数量 0 条 · 按周查看");
  await workspace.getByRole("button", { name: "显示累计播放", exact: true }).click();
  const chart = workspace.getByRole("img", { name: "发布节奏与播放贡献，当前范围0条作品", exact: true });
  expect(await chart.textContent()).not.toMatch(/T\d{2}:\d{2}|\.000Z/);
  await expect(chart.locator('[data-series="view"]')).toHaveCount(0);
  await expect(chart.locator('[data-series="count"]')).toHaveCount(1);
  await workspace.getByRole("button", { name: "三方图例", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "三方图例", exact: true })).toHaveAttribute("aria-pressed", "false");
  await workspace.getByLabel("开始日期", { exact: true }).fill("2001-02-01");
  await expect(workspace.getByRole("alert")).toContainText("开始日期不能晚于结束日期");
  await expect(workspace.getByLabel("开始日期", { exact: true })).toHaveValue("2001-01-01");
  await navigate(page, "内容与讨论");
  await expect(workspace.getByLabel("供应商筛选", { exact: true })).toHaveValue("蘑菇");
  await workspace.getByRole("button", { name: "重置筛选", exact: true }).click();
  await expect(workspace.getByLabel("开始日期", { exact: true })).toHaveValue(expectedMonth[0]!);
  await expect(workspace.getByLabel("结束日期", { exact: true })).toHaveValue(expectedMonth[1]!);
  for (const label of ["供应商筛选", "投放类型筛选", "内容形式筛选"]) await expect(workspace.getByLabel(label, { exact: true })).toHaveValue("");
  await expect(workspace.getByRole("alert")).toHaveCount(0);
  await expect(workspace.locator("footer")).toContainText("当前记录 0 条");
});

test("empty library search stays literal and pivot controls alter dimensions and columns without creating records", async ({ page }) => {
  await login(page); await navigate(page, "账号与作品");
  const workspace = frame(page);
  const query = '\"><img src="/invalid-zero-search" onerror="window.zeroSearchExecuted=1">';
  await workspace.getByLabel("搜索账号、标题或BV", { exact: true }).fill(query);
  await workspace.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(workspace.getByLabel("搜索账号、标题或BV", { exact: true })).toHaveValue(query);
  await expect(workspace.locator("#page-content")).toContainText(`搜索“${query}”`);
  await expect(workspace.locator('img[src="/invalid-zero-search"]')).toHaveCount(0);
  expect(await workspace.locator("html").evaluate(() => (window as typeof window & { zeroSearchExecuted?: number }).zeroSearchExecuted)).toBeUndefined();
  await workspace.getByLabel("链接状态筛选", { exact: true }).selectOption("unknown");
  await workspace.getByLabel("排序", { exact: true }).selectOption("count");
  await expect(workspace.getByRole("status").filter({ hasText: "当前 0 个账号" })).toContainText("作品数量 · 高到低");
  await workspace.getByRole("button", { name: "账号横向表格布局", exact: true }).click();
  await expect(workspace.getByRole("columnheader", { name: "账号 / UID", exact: true })).toBeVisible();
  await navigate(page, "发布总览"); await navigate(page, "账号与作品");
  await expect(workspace.getByRole("button", { name: "账号横向表格布局", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(workspace.getByLabel("搜索账号、标题或BV", { exact: true })).toHaveValue(query);
  await workspace.getByRole("button", { name: "清除搜索", exact: true }).click();
  await expect(workspace.getByLabel("搜索账号、标题或BV", { exact: true })).toHaveValue("");
  await expect(workspace.getByLabel("搜索账号、标题或BV", { exact: true })).toBeFocused();
  await expect(workspace.locator(".zd-pagination")).toContainText("共 0 条记录");
  const search = workspace.getByLabel("搜索账号、标题或BV", { exact: true });
  await search.fill("输入法候选");
  await search.dispatchEvent("keydown", { key: "Enter", code: "Enter", isComposing: true });
  await expect(workspace.getByRole("button", { name: "清除搜索", exact: true })).toHaveCount(0);
  await expect(workspace.locator("#page-content")).not.toContainText("搜索“输入法候选”");
  await search.press("Enter");
  await expect(workspace.locator("#page-content")).toContainText("搜索“输入法候选”");
  await expect(search).toBeFocused();
  await workspace.getByRole("button", { name: "清除搜索", exact: true }).click();
  await navigate(page, "全局透视");
  await workspace.getByLabel("纵向分组", { exact: true }).selectOption("date");
  await workspace.getByLabel("横向分组", { exact: true }).selectOption("type");
  await workspace.getByRole("button", { name: "条形", exact: true }).click();
  await expect(workspace.getByRole("status").filter({ hasText: "纵向：" })).toHaveText("纵向：发布日期 · 横向：内容形式 · 条形视图 · 当前 0 行");
  await expect(workspace.getByRole("columnheader", { name: "发布日期", exact: true })).toBeVisible();
  await expect(workspace.getByRole("columnheader", { name: "内容形式 · 待分组", exact: true })).toBeVisible();
  await workspace.getByRole("checkbox", { name: "累计播放", exact: true }).uncheck();
  await expect(workspace.getByRole("columnheader", { name: "累计播放", exact: true })).toHaveCount(0);
  await workspace.getByRole("checkbox", { name: "账号数", exact: true }).check();
  await expect(workspace.getByRole("columnheader", { name: "账号数", exact: true })).toBeVisible();
  await expect(workspace.locator("tfoot")).toContainText("总计 · 0 条");
  await workspace.getByRole("button", { name: "数值", exact: true }).click();
  await expect(workspace.getByRole("status").filter({ hasText: "纵向：" })).toContainText("数值视图");
  await workspace.getByRole("button", { name: "默认布局", exact: true }).click();
  await expect(workspace.getByLabel("纵向分组", { exact: true })).toHaveValue("supplier");
  await expect(workspace.getByRole("columnheader")).toHaveText(["供应商", "作品数", "累计播放", "合作报价", "报价 CPM"]);
  for (const button of await workspace.getByRole("button", { name: /^导出/ }).all()) await expect(button).toBeDisabled();
});

test("zero charts and tables remain locally scrollable and keyboard-operable at 200 percent text spacing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page);
  const style = "html{font-size:32px!important}*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}";
  await page.addStyleTag({ content: style });
  await expect(frame(page).locator("html")).toHaveCSS("font-size", "32px");
  const embedded = page.frames().find(item => /\/legacy\/thirdparty\.html/.test(item.url()))!;
  await embedded.addStyleTag({ content: style });
  const workspace = frame(page);
  const weekly = workspace.getByRole("button", { name: "按周", exact: true });
  await weekly.focus(); await page.keyboard.press("Enter");
  await expect(weekly).toHaveAttribute("aria-pressed", "true"); await expect(weekly).toBeFocused();
  const chart = workspace.getByRole("region", { name: "发布节奏图，可横向滚动", exact: true });
  await chart.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => chart.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(await chart.evaluate(el => { const bounds = el.getBoundingClientRect(); return bounds.left >= -1 && bounds.right <= innerWidth + 1; })).toBe(true);
  expect(await workspace.locator("html").evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
  await navigate(page, "全局透视");
  const rowGroup = workspace.getByLabel("纵向分组", { exact: true });
  await rowGroup.focus(); await page.keyboard.press("Home"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(rowGroup).toBeFocused();
  const table = workspace.getByRole("region", { name: "数据明细，可横向滚动", exact: true });
  await table.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(await table.evaluate(el => { const bounds = el.getBoundingClientRect(); return bounds.left >= -1 && bounds.right <= innerWidth + 1; })).toBe(true);
  expect(await workspace.locator("html").evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("all three native pages start without history or schedules and account labels remain available", async ({ page }, testInfo) => {
  await login(page, "/third-party/accounts");
  await expect(page.getByRole("heading", { name: "从第一个账号开始", exact: true })).toBeVisible();
  await expect(page.getByText("共 0 个账号 · 每页 10 条", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("initial-accounts-desktop.png"), fullPage: false });
  await page.getByRole("button", { name: "历史账号目录", exact: true }).click();
  await expect(page.getByText("共 0 个账号 · 每页 10 条", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "新增账号", exact: true }).click();
  const account = page.getByRole("dialog", { name: "账号入库", exact: true });
  await expect(account.getByLabel("归属标签").locator("option")).toHaveText(["蘑菇", "伏羲", "其他"]);
  await account.getByRole("button", { name: "取消", exact: true }).click();
  await navigate(page, "发布计划"); await expect(page.getByRole("heading", { name: "还没有发布排期", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("initial-plans-desktop.png"), fullPage: false });
  await page.getByRole("button", { name: "新增排期", exact: true }).click();
  const schedule = page.getByRole("dialog", { name: "新增发布排期", exact: true });
  await expect(schedule.getByLabel(/^发布账号/).locator("option")).toHaveCount(1);
  await expect(schedule).toContainText("没有匹配账号"); await schedule.getByRole("button", { name: "取消", exact: true }).click();
  await navigate(page, "发布日历"); await expect(page.locator("[data-calendar-day]")).toHaveCount(42);
  await expect(page.getByText("这一天还没有发布安排。", { exact: true })).toBeVisible();
  await expect(page.locator('section[aria-label="排期详情"]')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  await page.screenshot({ path: testInfo.outputPath("initial-calendar-desktop.png"), fullPage: false });
  await page.reload(); await expect(page.getByText("这一天还没有发布安排。", { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
});

test("new generation ignores and preserves old publication and legacy bytes while new intake and plans survive reload", async ({ page }) => {
  const oldAccount = { id: "local:old", uid: "111223344", name: "旧代次不会展示的账号", group: "蘑菇", status: "active", supplier: "旧供应商", manager: "旧负责人", phone: "", settlement: "", category: "", persona: "", notes: "旧管理资料", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  const old = { schema: 1, revision: "old-generation", accounts: [oldAccount], schedules: [{ id: "schedule:old", accountId: oldAccount.id, title: "旧代次不会展示的排期", date: "2026-10-19", time: "12:00", content: "", review: "pending", notes: "", status: "planned", createdAt: oldAccount.createdAt, updatedAt: oldAccount.updatedAt }] };
  const protectedBytes = {
    "mikoshi:third-party:v1:demo-u-linxu": JSON.stringify(old),
    "mikoshi:third-party:v1:demo-u-xucheng": " { old corrupt raw\n",
    "mikoshi.legacy.v1:demo-u-linxu:thirdparty:ananta-thirdparty-pivot-v1": "旧个人分析配置原串",
    "mikoshi:unrelated:sbs13": "other module remains untouched",
  };
  await page.addInitScript(values => {
    const get = Storage.prototype.getItem, readOld: string[] = [];
    if (!sessionStorage.getItem("sbs13-seeded")) { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); sessionStorage.setItem("sbs13-seeded", "1"); }
    Storage.prototype.getItem = function (target) { if (this === localStorage && Object.hasOwn(values, target)) readOld.push(target); return get.call(this, target); };
    Object.assign(window, { inspectInitializationPreservation: () => ({ readOld, raw: Object.fromEntries(Object.keys(values).map(key => [key, get.call(localStorage, key)])) }) });
  }, protectedBytes);
  const inspect = () => page.evaluate(() => (window as typeof window & { inspectInitializationPreservation(): { readOld: string[]; raw: Record<string, string> } }).inspectInitializationPreservation());
  await login(page, "/third-party/accounts"); await expect(page.getByRole("heading", { name: "从第一个账号开始", exact: true })).toBeVisible();
  await expect(page.getByText(oldAccount.name, { exact: true })).toHaveCount(0); expect(await inspect()).toEqual({ readOld: [], raw: protectedBytes });
  await page.getByRole("button", { name: "新增账号", exact: true }).click(); const account = page.getByRole("dialog", { name: "账号入库", exact: true });
  await account.getByLabel(/^B站 UID/).fill("9988776655"); await account.getByLabel(/^账号昵称/).fill("初始化后新账号"); await account.getByRole("button", { name: "保存账号", exact: true }).click(); await expect(account).toHaveCount(0);
  await page.getByRole("button", { name: "安排发布", exact: true }).click(); const schedule = page.getByRole("dialog", { name: "新增发布排期", exact: true });
  await schedule.getByLabel(/^排期标题/).fill("初始化后保留的新排期"); await schedule.getByLabel(/^计划日期/).fill("2026-11-19"); await schedule.getByLabel(/^计划时间/).fill("12:30");
  await schedule.getByRole("button", { name: "保存排期", exact: true }).click(); await expect(schedule).toHaveCount(0);
  const newRaw = await page.evaluate(key => localStorage.getItem(key), key); const saved = JSON.parse(newRaw!) as PublicationStore;
  expect(saved.accounts).toHaveLength(1); expect(saved.schedules).toHaveLength(1); expect(saved.accounts[0]?.name).toBe("初始化后新账号");
  await navigate(page, "发布计划"); await expect(page.getByRole("button", { name: "打开排期：初始化后保留的新排期", exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole("button", { name: "打开排期：初始化后保留的新排期", exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(newRaw); expect(await inspect()).toEqual({ readOld: [], raw: protectedBytes });
  await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click();
  await expect(page.getByRole("heading", { name: "还没有发布排期", exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0); expect(await inspect()).toEqual({ readOld: [], raw: protectedBytes });
});
