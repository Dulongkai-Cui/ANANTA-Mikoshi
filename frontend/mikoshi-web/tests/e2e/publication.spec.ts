import { expect, test, type Locator, type Page } from "@playwright/test";
import type { PublicationStore } from "../../src/features/third-party/model";
import { publicationKey } from "../../src/features/third-party/repository";
import { installHistoricalSnapshot, readBrowserCatalog } from "./fixtures/historical-snapshot";

const keyA = publicationKey("demo-u-linxu");
const keyB = publicationKey("demo-u-xucheng");
const primary = (page: Page) => page.getByRole("navigation", { name: "主导航", exact: true });
const side = (page: Page) => page.getByRole("navigation", { name: "当前业务页面", exact: true });
const accountDialog = (page: Page) => page.getByRole("dialog", { name: /^(账号入库|编辑账号资料)$/ });
const scheduleDialog = (page: Page) => page.getByRole("dialog", { name: /^(新增发布排期|编辑发布排期)$/ });
const leaveDialog = (page: Page) => page.getByRole("dialog", { name: "三方号资料还没有保存", exact: true });
const accountRow = (page: Page, name: string) => page.getByRole("row").filter({ has: page.getByRole("button", { name, exact: true }) });
const planRow = (page: Page, title: string) => page.getByRole("row").filter({ has: page.getByRole("button", { name: `取消排期：${title}`, exact: true }) });
const localRaw = (page: Page, key = keyA) => page.evaluate(key => localStorage.getItem(key), key);
const localData = async (page: Page) => JSON.parse((await localRaw(page))!) as PublicationStore;
const nextMonthEnd = () => {
  const now = new Date(), date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0));
  return date.toISOString().slice(0, 10);
};
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

async function signIn(page: Page, route = "/third-party/accounts") {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "登录 Mikoshi", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(route);
  await expect(primary(page)).toBeVisible();
  if (page.viewportSize()!.width >= 768) await expect(page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true })).toBeVisible();
}

async function go(page: Page, route: "accounts" | "plans" | "calendar") {
  const label = { accounts: "账号入库", plans: "发布计划", calendar: "发布日历" }[route];
  if (page.viewportSize()!.width < 768) await page.getByRole("button", { name: "打开导航", exact: true }).click();
  await side(page).getByRole("link", { name: label, exact: true }).click();
  await expect(page).toHaveURL(`/third-party/${route}`);
  await expect(page.getByRole("heading", { level: 1, name: label, exact: true })).toBeVisible();
}

async function createAccount(page: Page, name = "测试发布账号", uid = "9876543210123", group = "伏羲") {
  await page.getByRole("button", { name: "新增账号", exact: true }).click();
  const dialog = accountDialog(page);
  await dialog.getByLabel(/^B站 UID/).fill(uid);
  await dialog.getByLabel(/^账号昵称/).fill(name);
  await dialog.getByLabel("归属标签", { exact: true }).selectOption(group);
  await dialog.getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(accountRow(page, name)).toBeVisible();
  return name;
}

async function fillSchedule(dialog: Locator, title: string, date: string, time: string) {
  await dialog.getByLabel(/^排期标题/).fill(title);
  await dialog.getByLabel(/^计划日期/).fill(date);
  await dialog.getByLabel(/^计划时间/).fill(time);
}
async function saveSchedule(page: Page) {
  await scheduleDialog(page).getByRole("button", { name: "保存排期", exact: true }).click();
  await expect(scheduleDialog(page)).toHaveCount(0);
}
async function planForAccount(page: Page, name: string, title: string, date: string, time: string) {
  await accountRow(page, name).getByRole("button", { name: "安排发布", exact: true }).click();
  await expect(scheduleDialog(page).getByLabel(/^发布账号/).locator("option:checked")).toContainText(name);
  await fillSchedule(scheduleDialog(page), title, date, time); await saveSchedule(page);
}
async function showMonth(page: Page, date: string) {
  const target = Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7));
  const grid = page.locator('[role="group"][aria-label$=" 日历"]');
  for (let tries = 0; tries < 36; tries++) {
    const current = (await grid.getAttribute("aria-label"))!.slice(0, 7);
    const value = Number(current.slice(0, 4)) * 12 + Number(current.slice(5));
    if (value === target) return;
    await page.getByRole("button", { name: value < target ? "下个月" : "上个月", exact: true }).click();
  }
  throw new Error("Test date unexpectedly more than 36 months from calendar");
}
async function discard(page: Page) {
  await page.getByRole("dialog").last().getByRole("button", { name: "取消", exact: true }).click();
  if (await leaveDialog(page).count()) await leaveDialog(page).getByRole("button", { name: "放弃更改", exact: true }).click();
  await expect(accountDialog(page)).toHaveCount(0); await expect(scheduleDialog(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [], external: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== "127.0.0.1") external.push(request.url()); });
  await page.exposeFunction("publicationTestErrors", () => ({ errors, external }));
});
test.afterEach(async ({ page }, testInfo) => {
  if (page.isClosed()) return;
  const result = await page.evaluate(() => (window as typeof window & { publicationTestErrors(): Promise<{ errors: string[]; external: string[] }> }).publicationTestErrors());
  await testInfo.attach("publication-runtime", { body: JSON.stringify(result), contentType: "application/json" });
  expect(result.errors).toEqual([]); expect(result.external).toEqual([]);
});

for (const [route, label] of [["accounts", "账号入库"], ["plans", "发布计划"], ["calendar", "发布日历"]] as const) {
  test(`publication ${route} supports anonymous return, parent selection, search, refresh and Back`, async ({ page }) => {
    await signIn(page, `/third-party/${route}`);
    await expect(page.getByRole("heading", { name: label, level: 1, exact: true })).toBeVisible();
    await expect(primary(page).getByRole("link")).toHaveCount(6);
    await expect(primary(page).getByRole("link", { name: "三方号", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(side(page).getByRole("link")).toHaveCount(10);
    await expect(side(page).getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await page.reload(); await expect(page.getByRole("heading", { name: label, level: 1, exact: true })).toBeVisible();
    await primary(page).getByRole("link", { name: "MIKO", exact: true }).click();
    await expect(page).toHaveURL("/miko"); await page.goBack(); await expect(page).toHaveURL(`/third-party/${route}`);
    await page.getByRole("button", { name: "搜索页面", exact: true }).click();
    const input = page.getByRole("combobox", { name: "搜索页面", exact: true }); await input.fill(label);
    await expect(page.getByRole("option").filter({ hasText: label })).toHaveCount(route === "accounts" ? 1 : 2);
    // KOL now shares plan/calendar labels; search shows each option's actual parent.
    await expect(page.getByRole("option").filter({ hasText: label }).filter({ hasText: "三方号" })).toHaveCount(1);
    await input.press("Enter");
    await expect(page).toHaveURL(`/third-party/${route}`);
  });
}

test("UID account intake validates, persists all management fields and keeps normalized identity unique", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "新增账号", exact: true }).click(); const dialog = accountDialog(page);
  await dialog.getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(dialog.getByLabel(/^B站 UID/)).toHaveAttribute("aria-invalid", "true"); await expect(dialog.getByLabel(/^B站 UID/)).toBeFocused();
  await dialog.getByLabel(/^B站 UID/).fill("0009876543210123"); await dialog.getByLabel(/^账号昵称/).fill("伏羲新号");
  await dialog.getByLabel("归属标签", { exact: true }).selectOption("伏羲");
  for (const [label, value] of [["供应商", "独立供应商"], ["供应商管理人员", "负责人甲"], ["手机号", "测试联系方式"], ["结算方式", "按月核对"], ["账号类型", "攻略"], ["账号人设", "探索向"], ["备注", "本地管理备注"]] as const) await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByRole("button", { name: "保存账号", exact: true }).click(); await expect(dialog).toHaveCount(0);
  const row = accountRow(page, "伏羲新号"); await expect(row).toContainText("UID 9876543210123"); await expect(row).toContainText("伏羲");
  await expect(row.getByRole("link", { name: "B站主页", exact: true })).toHaveAttribute("href", "https://space.bilibili.com/9876543210123");
  await page.reload(); await expect(row).toBeVisible(); await row.getByRole("button", { name: "编辑资料", exact: true }).click();
  await expect(accountDialog(page).getByLabel(/^B站 UID/)).toHaveAttribute("readonly", "");
  await expect(accountDialog(page).getByLabel("结算方式", { exact: true })).toHaveValue("按月核对");
  await expect(accountDialog(page).getByLabel("手机号", { exact: true })).toHaveValue("测试联系方式");
  await accountDialog(page).getByLabel("账号状态", { exact: true }).selectOption("attention");
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click(); await expect(row).toContainText("待整改");
  await page.getByLabel("筛选归属标签", { exact: true }).selectOption("蘑菇"); await expect(row).toHaveCount(0);
  await page.getByLabel("筛选归属标签", { exact: true }).selectOption("伏羲"); await expect(row).toBeVisible();
  await page.getByRole("button", { name: "新增账号", exact: true }).click();
  await accountDialog(page).getByLabel(/^B站 UID/).fill("0009876543210123"); await accountDialog(page).getByLabel(/^账号昵称/).fill("重复账号");
  const raw = await localRaw(page);
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(accountDialog(page).getByText(/此 UID 已入库/)).toBeVisible(); expect(await localRaw(page)).toBe(raw);
  await discard(page); expect((await localData(page)).accounts).toHaveLength(1);
});

test("a newly opened intake form does not inherit validation errors from a previous cancelled session", async ({ page }) => {
  await signIn(page); await page.getByRole("button", { name: "新增账号", exact: true }).click();
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(accountDialog(page).getByRole("alert")).toContainText("请检查标出的账号资料");
  await expect(accountDialog(page).getByLabel(/^B站 UID/)).toHaveAttribute("aria-invalid", "true");
  await accountDialog(page).getByRole("button", { name: "取消", exact: true }).click(); await expect(accountDialog(page)).toHaveCount(0);
  await page.getByRole("button", { name: "新增账号", exact: true }).click();
  await expect(accountDialog(page).getByRole("alert")).toHaveCount(0);
  await expect(accountDialog(page).locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(accountDialog(page).getByLabel(/^B站 UID/)).toHaveValue("");
  await accountDialog(page).getByRole("button", { name: "取消", exact: true }).click(); expect(await localRaw(page)).toBeNull();
});

test("malformed catalog is visibly rejected while local records remain readable, and retry restores real history", async ({ page }) => {
  const catalog = await installHistoricalSnapshot(page);
  const source = catalog.accounts.find(a => a.uid)!;
  await signIn(page); await createAccount(page, "目录失败时仍保留"); const raw = await localRaw(page);
  const pattern = "**/legacy/thirdparty-catalog.json";
  await page.route(pattern, route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ schema: 1, sourceHash: catalog.sourceHash, accounts: [{ id: "broken", name: "缺必需字段的目录", works: [] }] }) }));
  await page.reload(); await expect(page.getByRole("main").getByRole("alert")).toContainText("历史账号目录暂时无法读取");
  await expect(accountRow(page, "目录失败时仍保留")).toBeVisible(); expect(await localRaw(page)).toBe(raw);
  await page.unroute(pattern); await page.getByRole("button", { name: "重试历史资料", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "历史账号目录暂时无法读取" })).toHaveCount(0);
  await page.getByRole("button", { name: "历史账号目录", exact: true }).click(); await page.getByLabel("搜索账号资料", { exact: true }).fill(source.uid!);
  await expect(accountRow(page, source.name)).toBeVisible(); expect(await localRaw(page)).toBe(raw);
});

test("new account immediately schedules two independent same-day items and calendar reflects cross-month edit, cancel and restore", async ({ page }) => {
  await signIn(page); const name = await createAccount(page), date = nextMonthEnd(), moved = addDays(date, 1);
  await planForAccount(page, name, "月末上午内容", date, "09:00");
  await planForAccount(page, name, "月末下午内容", date, "18:00");
  const original = await localData(page); expect(original.schedules).toHaveLength(2);
  await go(page, "plans"); await expect(planRow(page, "月末上午内容")).toContainText("内容待补");
  await planRow(page, "月末上午内容").getByRole("button", { name: "编辑排期：月末上午内容", exact: true }).last().click();
  await scheduleDialog(page).getByLabel(/^计划日期/).fill(moved); await scheduleDialog(page).getByLabel(/^计划时间/).fill("10:00"); await saveSchedule(page);
  await expect(planRow(page, "月末上午内容")).toContainText(moved);
  await planRow(page, "月末下午内容").getByRole("button", { name: "取消排期：月末下午内容", exact: true }).click();
  const beforeCancel = await localRaw(page);
  await page.getByRole("dialog", { name: "取消这条排期？", exact: true }).getByRole("button", { name: "返回", exact: true }).click();
  expect(await localRaw(page)).toBe(beforeCancel);
  await planRow(page, "月末下午内容").getByRole("button", { name: "取消排期：月末下午内容", exact: true }).click();
  await page.getByRole("button", { name: "确认取消排期", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "取消这条排期？", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "恢复排期：月末下午内容", exact: true })).toBeVisible();
  const cancelled = await localData(page);
  expect(cancelled.schedules.find(s => s.title === "月末下午内容")?.status).toBe("cancelled");
  expect(cancelled.schedules.find(s => s.title === "月末上午内容")).toMatchObject({ id: original.schedules[0]!.id, date: moved, status: "planned" });
  await go(page, "calendar"); await showMonth(page, date);
  await expect(page.locator(`[data-calendar-day="${date}"]`)).toHaveAttribute("aria-label", /0 条已计划，1 条已取消/);
  await page.locator(`[data-calendar-day="${date}"]`).click();
  const detail = page.locator('section[aria-label="排期详情"]'); await expect(detail).toContainText("月末下午内容");
  await expect(detail).toContainText("暂无关联的历史作品与效果数据。");
  await detail.getByRole("button", { name: "恢复排期：月末下午内容", exact: true }).click(); await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.locator(`[data-calendar-day="${date}"]`)).toHaveAttribute("aria-label", /1 条已计划，0 条已取消/);
  await page.getByLabel("账号归属", { exact: true }).selectOption("蘑菇"); await expect(page.locator('section[aria-label="当天排期"]')).toContainText("0 条排期");
  await page.getByLabel("账号归属", { exact: true }).selectOption("伏羲"); await expect(page.locator('section[aria-label="当天排期"]')).toContainText("1 条排期");
  await showMonth(page, moved); await page.locator(`[data-calendar-day="${moved}"]`).click(); await expect(detail).toContainText("月末上午内容");
  await page.reload(); await go(page, "plans");
  await expect(planRow(page, "月末上午内容")).toContainText(moved); await expect(planRow(page, "月末下午内容")).toContainText(date);
});

test("invalid dates and duplicate slots are rejected; retiring an account blocks new or restored plans", async ({ page }) => {
  await signIn(page); const name = await createAccount(page), date = nextMonthEnd();
  await planForAccount(page, name, "保留的原排期", date, "18:00");
  await accountRow(page, name).getByRole("button", { name: "安排发布", exact: true }).click();
  await fillSchedule(scheduleDialog(page), "重复档期", "1999-12-31", "18:00");
  await scheduleDialog(page).getByRole("button", { name: "保存排期", exact: true }).click();
  await expect(scheduleDialog(page).getByLabel(/^计划日期/)).toHaveAttribute("aria-invalid", "true");
  await scheduleDialog(page).getByLabel(/^计划日期/).fill(date);
  await scheduleDialog(page).getByRole("button", { name: "保存排期", exact: true }).click();
  await expect(scheduleDialog(page).getByRole("alert")).toContainText("此账号在该时刻已有排期");
  await expect(scheduleDialog(page).getByLabel(/^排期标题/)).toHaveValue("重复档期"); await discard(page);
  await accountRow(page, name).getByRole("button", { name: "编辑资料", exact: true }).click();
  await accountDialog(page).getByLabel("账号状态", { exact: true }).selectOption("retired");
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(accountRow(page, name).getByRole("button", { name: "安排发布", exact: true })).toBeDisabled();
  await go(page, "plans"); await planRow(page, "保留的原排期").getByRole("button", { name: "取消排期：保留的原排期", exact: true }).click();
  await page.getByRole("button", { name: "确认取消排期", exact: true }).click();
  await expect(page.getByRole("button", { name: "恢复排期：保留的原排期", exact: true })).toBeDisabled();
  expect((await localData(page)).schedules).toHaveLength(1);
});

test("historical accounts expose the real latest works, stay independently schedulable and preserve snapshot identity", async ({ page }) => {
  const catalog = await installHistoricalSnapshot(page);
  const source = catalog.accounts.find(a => a.uid && a.works.length === 3 && a.suppliers.includes("财义"))!; expect(source).toBeTruthy();
  await signIn(page); await page.getByRole("button", { name: "历史账号目录", exact: true }).click();
  await page.getByLabel("搜索账号资料", { exact: true }).fill(source.uid!);
  const row = accountRow(page, source.name); await expect(row).toBeVisible(); await expect(row).toContainText("财义");
  await row.getByRole("button", { name: source.name, exact: true }).click();
  const detail = page.getByRole("dialog", { name: source.name, exact: true });
  for (const work of source.works) {
    const item = detail.getByRole("listitem").filter({ hasText: work.title || work.id }); await expect(item).toHaveCount(1);
    const number = (v: number | null) => v == null ? "—" : v.toLocaleString("zh-CN");
    await expect(item).toContainText(`播放 ${number(work.view)}`); await expect(item).toContainText(`点赞 ${number(work.like)}`); await expect(item).toContainText(`评论 ${number(work.reply)}`);
  }
  await detail.getByRole("button", { name: "关闭", exact: true }).click();
  await planForAccount(page, source.name, "历史账号计划", nextMonthEnd(), "16:00");
  expect((await localData(page)).accounts).toHaveLength(0);
  expect((await localData(page)).schedules[0]?.accountId).toBe(`snapshot:${source.id}`);
  await row.getByRole("button", { name: "补充入库", exact: true }).click();
  await expect(accountDialog(page).getByLabel(/^B站 UID/)).toHaveValue(source.uid!);
  await accountDialog(page).getByLabel("归属标签", { exact: true }).selectOption("伏羲");
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(accountDialog(page)).toHaveCount(0);
  expect((await localData(page)).accounts[0]?.id).toBe(`snapshot:${source.id}`);
  await go(page, "calendar"); await showMonth(page, nextMonthEnd()); await page.locator(`[data-calendar-day="${nextMonthEnd()}"]`).click();
  const scheduleDetail = page.locator('section[aria-label="排期详情"]');
  await expect(scheduleDetail).toContainText(`原供应商 ${source.suppliers.join("、")}`); await expect(scheduleDetail).toContainText("伏羲");
  await expect(scheduleDetail.getByRole("listitem")).toHaveCount(3);
  expect(await readBrowserCatalog(page)).toEqual(catalog);
});

test("saved accounts and plans are isolated across identity changes and reload", async ({ page }) => {
  await signIn(page); const name = await createAccount(page, "只属于林序");
  await planForAccount(page, name, "林序的发布计划", nextMonthEnd(), "12:00"); const rawA = await localRaw(page);
  await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click();
  await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click();
  await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）", exact: true })).toBeVisible();
  await expect(accountRow(page, name)).toHaveCount(0); await go(page, "plans"); await expect(page.getByText("还没有发布排期", { exact: true })).toBeVisible();
  expect(await localRaw(page, keyB)).toBeNull(); expect(await localRaw(page)).toBe(rawA);
  await page.getByRole("button", { name: "账户菜单：许澄（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "切换为演示身份「林序」", exact: true }).click();
  await expect(planRow(page, "林序的发布计划")).toBeVisible(); await page.reload(); await expect(planRow(page, "林序的发布计划")).toBeVisible(); expect(await localRaw(page)).toBe(rawA);
});

test("supplementing a historical account without UID preserves its original identity, history and previously saved plans", async ({ page }) => {
  const catalog = await installHistoricalSnapshot(page);
  const source = catalog.accounts.find(account => account.uid === null)!; expect(source).toBeTruthy();
  await signIn(page); await page.getByRole("button", { name: "历史账号目录", exact: true }).click(); await page.getByLabel("搜索账号资料", { exact: true }).fill(source.name);
  const row = accountRow(page, source.name); await expect(row).toContainText("历史 UID 缺失"); await expect(row).toContainText("待确认");
  await planForAccount(page, source.name, "补充UID前已保存的排期", nextMonthEnd(), "11:00");
  const original = (await localData(page)).schedules[0]!; expect(original.accountId).toBe(`snapshot:${source.id}`);
  await row.getByRole("button", { name: "补充入库", exact: true }).click(); await accountDialog(page).getByLabel(/^B站 UID/).fill("7771122334455");
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click(); await expect(accountDialog(page)).toHaveCount(0);
  const after = await localData(page); expect(after.accounts).toHaveLength(1); expect(after.accounts[0]).toMatchObject({ id: original.accountId, uid: "7771122334455" }); expect(after.schedules).toEqual([original]);
  await expect(row).toContainText("UID 7771122334455"); await expect(row.getByRole("link", { name: "B站主页", exact: true })).toHaveAttribute("href", "https://space.bilibili.com/7771122334455");
  await row.getByRole("button", { name: source.name, exact: true }).click();
  const detail = page.getByRole("dialog", { name: source.name, exact: true }); await expect(detail).toContainText(`历史 ${source.workCount} 条作品`);
  for (const work of source.works) await expect(detail).toContainText(work.title || work.id);
  await detail.getByRole("button", { name: "关闭", exact: true }).click(); await page.reload();
  await go(page, "plans"); await expect(planRow(page, "补充UID前已保存的排期")).toContainText("7771122334455");
  expect((await localData(page)).schedules[0]?.accountId).toBe(original.accountId);
  expect(await readBrowserCatalog(page)).toEqual(catalog);
});

test("corrupt local publication bytes remain intact and visibly disable saving", async ({ page }) => {
  const raw = " { broken-publication-cache \n";
  await page.addInitScript(({ key, raw }) => { if (!sessionStorage.getItem("publication-corrupt-seeded")) { localStorage.setItem(key, raw); sessionStorage.setItem("publication-corrupt-seeded", "1"); } }, { key: keyA, raw });
  await signIn(page); await expect(page.getByRole("main").getByRole("alert")).toContainText("原数据已保留"); await expect(page.getByRole("button", { name: "新增账号", exact: true })).toBeDisabled();
  await go(page, "plans"); await expect(page.getByRole("button", { name: "新增排期", exact: true })).toBeDisabled();
  await page.reload(); await expect(page.getByRole("main").getByRole("alert")).toContainText("原数据已保留"); expect(await localRaw(page)).toBe(raw);
});

test("denied reads show a recoverable storage error without replacing saved publication bytes", async ({ page }) => {
  await signIn(page); await createAccount(page); const raw = await localRaw(page);
  await page.addInitScript(key => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (target) { if (this === localStorage && target === key) throw new DOMException("Injected read denial", "SecurityError"); return get.call(this, target); };
    Object.assign(window, { restorePublicationReads: () => { Storage.prototype.getItem = get; } });
  }, keyA);
  await page.reload(); await expect(page.getByRole("main").getByRole("alert")).toContainText("无法读取本机资料");
  await expect(page.getByRole("button", { name: "新增账号", exact: true })).toBeDisabled();
  await page.evaluate(() => (window as typeof window & { restorePublicationReads(): void }).restorePublicationReads());
  expect(await localRaw(page)).toBe(raw);
  await page.getByRole("button", { name: "重新读取", exact: true }).click();
  await expect(accountRow(page, "测试发布账号")).toBeVisible(); await expect(page.getByRole("button", { name: "新增账号", exact: true })).toBeEnabled();
});

for (const [fault, expected] of [["QuotaExceededError", "浏览器存储空间不足"], ["SecurityError", "无法写入本机资料"]] as const) {
  test(`${fault} preserves persisted data and the visible account draft`, async ({ page }) => {
    await signIn(page); const name = await createAccount(page), raw = await localRaw(page);
    await accountRow(page, name).getByRole("button", { name: "编辑资料", exact: true }).click();
    await accountDialog(page).getByLabel(/^账号昵称/).fill("尚未保存的修改");
    await page.evaluate(({ key, fault }) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (target, value) { if (this === localStorage && target === key) throw new DOMException("Injected storage fault", fault); return set.call(this, target, value); };
      Object.assign(window, { restorePublicationWrites: () => { Storage.prototype.setItem = set; } });
    }, { key: keyA, fault });
    await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click();
    await expect(accountDialog(page).getByRole("alert")).toContainText(expected); await expect(accountDialog(page).getByLabel(/^账号昵称/)).toHaveValue("尚未保存的修改"); expect(await localRaw(page)).toBe(raw);
    await page.evaluate(() => (window as typeof window & { restorePublicationWrites(): void }).restorePublicationWrites());
    await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click(); await expect(accountDialog(page)).toHaveCount(0);
    await expect(accountRow(page, "尚未保存的修改")).toBeVisible();
  });
}

test("two browser tabs propagate updates but stale editor cannot overwrite the newer record", async ({ page, context }) => {
  await signIn(page); const name = await createAccount(page, "跨窗口原名");
  const other = await context.newPage(); await signIn(other);
  await accountRow(page, name).getByRole("button", { name: "编辑资料", exact: true }).click(); await accountDialog(page).getByLabel(/^账号昵称/).fill("旧窗口的草稿");
  await accountRow(other, name).getByRole("button", { name: "编辑资料", exact: true }).click(); await accountDialog(other).getByLabel(/^账号昵称/).fill("新窗口已保存");
  await accountDialog(other).getByRole("button", { name: "保存账号", exact: true }).click(); await expect(accountDialog(other)).toHaveCount(0);
  const winner = await localRaw(other);
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(accountDialog(page).getByRole("alert")).toContainText("其他窗口已更新资料"); await expect(accountDialog(page).getByLabel(/^账号昵称/)).toHaveValue("旧窗口的草稿");
  expect(await localRaw(page)).toBe(winner); await discard(page);
  await expect(accountRow(page, "新窗口已保存")).toBeVisible(); await other.close();
});

test("dirty close, Back, guarded navigation and refresh prompt preserve the draft until explicit discard", async ({ page }) => {
  await signIn(page); const name = await createAccount(page); await go(page, "plans");
  await page.getByRole("button", { name: "新增排期", exact: true }).click();
  await scheduleDialog(page).getByLabel(/^发布账号/).selectOption({ label: `${name} · 伏羲` });
  await scheduleDialog(page).getByLabel(/^排期标题/).fill("还没保存的草稿"); const raw = await localRaw(page);
  await scheduleDialog(page).getByRole("button", { name: "关闭", exact: true }).click(); await expect(leaveDialog(page)).toBeVisible();
  await leaveDialog(page).getByRole("button", { name: "继续编辑", exact: true }).click(); await expect(scheduleDialog(page).getByLabel(/^排期标题/)).toHaveValue("还没保存的草稿");
  await page.goBack(); await expect(page).toHaveURL("/third-party/accounts");
  await expect(page.getByRole("button", { name: "返回继续编辑", exact: true })).toBeVisible();
  await primary(page).getByRole("link", { name: "创意管理", exact: true }).click(); await expect(leaveDialog(page)).toBeVisible();
  await leaveDialog(page).getByRole("button", { name: "继续编辑", exact: true }).click(); await expect(page).toHaveURL("/third-party/plans");
  await expect(scheduleDialog(page).getByLabel(/^排期标题/)).toHaveValue("还没保存的草稿");
  // A dismissed native reload does not emit a new load event; trigger it without
  // waiting for a navigation that the user explicitly cancels.
  const prompt = page.waitForEvent("dialog");
  await page.evaluate(() => { window.setTimeout(() => window.location.reload(), 0); });
  const reloadDialog = await prompt; expect(reloadDialog.type()).toBe("beforeunload"); await reloadDialog.dismiss();
  await expect(scheduleDialog(page).getByLabel(/^排期标题/)).toHaveValue("还没保存的草稿");
  await discard(page); expect(await localRaw(page)).toBe(raw); await expect(page.getByText("还没有发布排期", { exact: true })).toBeVisible();
});

test("identity switch is guarded while a Back-preserved account draft exists", async ({ page }) => {
  await signIn(page, "/third-party/plans"); await go(page, "accounts");
  await page.getByRole("button", { name: "新增账号", exact: true }).click(); await accountDialog(page).getByLabel(/^账号昵称/).fill("只属于原身份的草稿");
  await page.goBack(); await expect(page).toHaveURL("/third-party/plans");
  await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click();
  await expect(leaveDialog(page)).toBeVisible(); await leaveDialog(page).getByRole("button", { name: "继续编辑", exact: true }).click();
  await expect(accountDialog(page).getByLabel(/^账号昵称/)).toHaveValue("只属于原身份的草稿");
  await page.goBack(); await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click();
  await leaveDialog(page).getByRole("button", { name: "放弃更改", exact: true }).click(); await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）", exact: true })).toBeVisible();
  await go(page, "accounts"); await expect(accountDialog(page)).toHaveCount(0); await expect(page.getByText("只属于原身份的草稿", { exact: true })).toHaveCount(0);
  expect(await localRaw(page)).toBeNull(); expect(await localRaw(page, keyB)).toBeNull();
});

test("logout requires explicit discard for a pending publication draft and preserves saved records", async ({ page }) => {
  await signIn(page); await createAccount(page); const raw = await localRaw(page);
  await go(page, "plans"); await page.getByRole("button", { name: "新增排期", exact: true }).click();
  await scheduleDialog(page).getByLabel(/^排期标题/).fill("退出前未保存"); await page.goBack();
  await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "退出登录", exact: true }).click();
  await leaveDialog(page).getByRole("button", { name: "继续编辑", exact: true }).click();
  await expect(scheduleDialog(page).getByLabel(/^排期标题/)).toHaveValue("退出前未保存");
  await page.goBack(); await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "退出登录", exact: true }).click();
  await leaveDialog(page).getByRole("button", { name: "放弃更改", exact: true }).click();
  await expect(page).toHaveURL("/login"); expect(await localRaw(page)).toBe(raw);
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click(); await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/dashboard"); await primary(page).getByRole("link", { name: "三方号", exact: true }).click(); await go(page, "plans");
  await expect(page.getByText("还没有发布排期", { exact: true })).toBeVisible(); expect(await localRaw(page)).toBe(raw);
});

for (const mode of ["mobile320", "dark", "text200"] as const) {
  test(`publication forms, calendar keyboard and local table scrolling remain usable in ${mode}`, async ({ page }, testInfo) => {
    await page.setViewportSize(mode === "mobile320" ? { width: 320, height: 720 } : { width: 1280, height: 800 });
    if (mode === "dark") await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page); if (mode === "text200") await page.addStyleTag({ content: "html{font-size:32px!important}*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}" });
    const name = await createAccount(page, `布局验证${mode}`); await accountRow(page, name).getByRole("button", { name: "安排发布", exact: true }).click();
    const dialog = scheduleDialog(page); await fillSchedule(dialog, "键盘安排的内容", "2026-01-01", "12:00");
    await expect(dialog).toBeVisible();
    // Measure the settled dialog, not an intermediate fade/scale frame.
    await expect.poll(() => dialog.evaluate(el => el.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
    const geometry = await dialog.evaluate(el => ({ rect: el.getBoundingClientRect().toJSON(), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, viewport: innerWidth }));
    expect(geometry.rect.left).toBeGreaterThanOrEqual(0); expect(geometry.rect.right).toBeLessThanOrEqual(geometry.viewport); expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    await page.screenshot({ path: testInfo.outputPath(`publication-editor-${mode}.png`), fullPage: false });
    await dialog.getByRole("button", { name: "保存排期", exact: true }).focus(); await page.keyboard.press("Enter"); await expect(dialog).toHaveCount(0);
    await go(page, "plans"); await expect(planRow(page, "键盘安排的内容")).toContainText("逾期待核对");
    const table = page.getByRole("region", { name: "排期表格，可横向滚动", exact: true }); await table.focus(); await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await go(page, "calendar"); const days = page.locator("[data-calendar-day]"); await expect(days).toHaveCount(42);
    // Select a real date and navigate the calendar through its documented keyboard controls.
    const selected = page.locator('[data-calendar-day][aria-pressed="true"]');
    const originalDate = await selected.getAttribute("data-calendar-day"); await selected.focus(); await page.keyboard.press("ArrowRight");
    await expect(page.locator(`[data-calendar-day="${addDays(originalDate!, 1)}"]`)).toBeFocused();
    await page.keyboard.press("Home"); const focused = page.locator("[data-calendar-day]:focus");
    await expect.poll(async () => new Date(`${await focused.getAttribute("data-calendar-day")}T00:00:00Z`).getUTCDay()).toBe(1);
    await page.getByRole("button", { name: "今天", exact: true }).click(); await expect(page.locator('[data-calendar-day][aria-current="date"]')).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    // Keyboard focus may scroll the document; reset it before a full-page overview.
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.screenshot({ path: testInfo.outputPath(`publication-calendar-${mode}.png`), fullPage: true });
    await testInfo.attach(`publication-geometry-${mode}`, { body: JSON.stringify({ geometry, calendarDays: await days.count() }), contentType: "application/json" });
  });
}

test("withdrawal removes only the chosen plan from default list, month and day while cancelled records remain visible and explicitly recoverable", async ({ page }, testInfo) => {
  await signIn(page); const name = await createAccount(page), date = nextMonthEnd();
  await planForAccount(page, name, "独立计划甲", date, "10:00"); await planForAccount(page, name, "独立计划乙", date, "15:00");
  const original = await localData(page), untouched = original.schedules.find(item => item.title === "独立计划乙")!;
  await go(page, "plans"); const before = await localRaw(page);
  await page.getByRole("button", { name: "撤下计划：独立计划甲", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "撤下这条计划？", exact: true });
  await expect(confirmation).toContainText("不会撤回任何已发布的外站内容");
  await confirmation.getByRole("button", { name: "返回", exact: true }).click(); expect(await localRaw(page)).toBe(before);
  await page.getByRole("button", { name: "撤下计划：独立计划甲", exact: true }).click();
  await confirmation.getByRole("button", { name: "确认撤下计划", exact: true }).click(); await expect(confirmation).toHaveCount(0);
  await expect(page.getByRole("button", { name: "打开排期：独立计划甲", exact: true })).toHaveCount(0); await expect(planRow(page, "独立计划乙")).toBeVisible();
  expect((await localData(page)).schedules.find(item => item.id === untouched.id)).toEqual(untouched);
  await go(page, "calendar"); await showMonth(page, date); await page.locator(`[data-calendar-day="${date}"]`).click();
  await expect(page.locator(`[data-calendar-day="${date}"]`)).toHaveAttribute("aria-label", /1 条已计划，0 条已取消/);
  const day = page.locator('section[aria-label="当天排期"]'), detail = page.locator('section[aria-label="排期详情"]');
  await expect(day).toContainText("独立计划乙"); await expect(day).not.toContainText("独立计划甲");
  await page.reload(); await showMonth(page, date); await page.locator(`[data-calendar-day="${date}"]`).click(); await expect(day).not.toContainText("独立计划甲");
  await page.getByLabel("排期状态", { exact: true }).selectOption("withdrawn"); await expect(day).toContainText("独立计划甲"); await expect(day).not.toContainText("独立计划乙");
  await expect(page.locator(`[data-calendar-day="${date}"]`)).toHaveAttribute("aria-label", /0 条已计划，0 条已取消，1 条已撤下/);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  await page.screenshot({ path: testInfo.outputPath("withdrawn-calendar-filter-desktop.png"), fullPage: true });
  await detail.getByRole("button", { name: "恢复排期：独立计划甲", exact: true }).click();
  await page.getByRole("button", { name: "确认恢复", exact: true }).click(); await expect(page.getByRole("dialog", { name: "恢复这条排期？", exact: true })).toHaveCount(0);
  await page.getByLabel("排期状态", { exact: true }).selectOption(""); await expect(day).toContainText("独立计划甲"); await expect(day).toContainText("独立计划乙");
  await day.getByRole("button").filter({ hasText: "独立计划甲" }).click();
  await detail.getByRole("button", { name: "取消排期：独立计划甲", exact: true }).click(); await page.getByRole("button", { name: "确认取消排期", exact: true }).click();
  await expect(detail).toContainText("已取消"); await expect(day).toContainText("独立计划甲");
  await detail.getByRole("button", { name: "撤下计划：独立计划甲", exact: true }).click(); await page.getByRole("button", { name: "确认撤下计划", exact: true }).click();
  await expect(day).not.toContainText("独立计划甲"); await expect(day).toContainText("独立计划乙");
  expect((await localData(page)).schedules.find(item => item.id === untouched.id)).toEqual(untouched);
  await go(page, "plans"); await page.getByLabel("排期状态", { exact: true }).selectOption("withdrawn");
  await expect(page.getByRole("button", { name: "打开排期：独立计划甲", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "恢复排期：独立计划甲", exact: true }).click(); await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "恢复这条排期？", exact: true })).toHaveCount(0);
  await page.getByLabel("排期状态", { exact: true }).selectOption(""); await expect(planRow(page, "独立计划甲")).toBeVisible(); await expect(planRow(page, "独立计划乙")).toBeVisible();
});

test("editor withdrawal explicitly discards unsaved changes while later editing a withdrawn record never implicitly restores it", async ({ page }) => {
  await signIn(page); const name = await createAccount(page); await planForAccount(page, name, "已保存的原标题", nextMonthEnd(), "10:00"); await go(page, "plans");
  await page.getByRole("button", { name: "打开排期：已保存的原标题", exact: true }).click(); const dialog = scheduleDialog(page);
  await dialog.getByLabel(/^排期标题/).fill("不应被撤下操作保存的草稿"); const before = await localRaw(page);
  await dialog.getByRole("button", { name: "撤下计划：已保存的原标题", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "撤下这条计划？", exact: true }); await expect(confirmation).toContainText("尚未保存的修改不会保存");
  await confirmation.getByRole("button", { name: "返回", exact: true }).click(); await expect(dialog.getByLabel(/^排期标题/)).toHaveValue("不应被撤下操作保存的草稿"); expect(await localRaw(page)).toBe(before);
  await dialog.getByRole("button", { name: "撤下计划：已保存的原标题", exact: true }).click(); await confirmation.getByRole("button", { name: "确认撤下计划", exact: true }).click();
  await expect(confirmation).toHaveCount(0); await expect(dialog).toHaveCount(0); expect((await localData(page)).schedules[0]).toMatchObject({ title: "已保存的原标题", status: "withdrawn" });
  await page.getByLabel("排期状态", { exact: true }).selectOption("withdrawn"); await page.getByRole("button", { name: "打开排期：已保存的原标题", exact: true }).click();
  await expect(dialog).toContainText("编辑并保存不会恢复"); await dialog.getByLabel(/^排期标题/).fill("撤下后修订标题"); await saveSchedule(page);
  expect((await localData(page)).schedules[0]).toMatchObject({ title: "撤下后修订标题", status: "withdrawn" });
  await page.getByLabel("排期状态", { exact: true }).selectOption(""); await expect(page.getByRole("heading", { name: "还没有发布排期", exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "还没有发布排期", exact: true })).toBeVisible();
});

test("withdrawn records cannot restore into a taken time slot or a retired account", async ({ page }) => {
  await signIn(page); const name = await createAccount(page), date = nextMonthEnd(); await planForAccount(page, name, "原计划", date, "10:00"); await go(page, "plans");
  await page.getByRole("button", { name: "撤下计划：原计划", exact: true }).click(); await page.getByRole("button", { name: "确认撤下计划", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "撤下这条计划？", exact: true })).toHaveCount(0);
  await go(page, "accounts"); await planForAccount(page, name, "占用相同时段的新计划", date, "10:00"); await go(page, "plans");
  await page.getByLabel("排期状态", { exact: true }).selectOption("withdrawn"); const before = await localRaw(page);
  await page.getByRole("button", { name: "恢复排期：原计划", exact: true }).click(); const confirmation = page.getByRole("dialog", { name: "恢复这条排期？", exact: true });
  await confirmation.getByRole("button", { name: "确认恢复", exact: true }).click(); await expect(confirmation.getByRole("alert")).toContainText("此账号在该时刻已有排期"); expect(await localRaw(page)).toBe(before);
  await confirmation.getByRole("button", { name: "返回", exact: true }).click(); await go(page, "accounts");
  await accountRow(page, name).getByRole("button", { name: "编辑资料", exact: true }).click(); await accountDialog(page).getByLabel("账号状态", { exact: true }).selectOption("retired");
  await accountDialog(page).getByRole("button", { name: "保存账号", exact: true }).click(); await expect(accountDialog(page)).toHaveCount(0);
  await go(page, "plans"); await page.getByLabel("排期状态", { exact: true }).selectOption("withdrawn");
  await expect(page.getByRole("button", { name: "恢复排期：原计划", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "打开排期：原计划", exact: true }).click(); await expect(scheduleDialog(page).getByRole("button", { name: "恢复排期：原计划", exact: true })).toBeDisabled();
  expect((await localData(page)).schedules.find(item => item.title === "原计划")?.status).toBe("withdrawn");
});

test("failed withdrawal keeps the saved record and confirmation until storage recovers", async ({ page }) => {
  await signIn(page); const name = await createAccount(page); await planForAccount(page, name, "写失败时保留", nextMonthEnd(), "10:00"); await go(page, "plans"); const before = await localRaw(page);
  await page.getByRole("button", { name: "撤下计划：写失败时保留", exact: true }).click();
  await page.evaluate(key => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (target, value) { if (this === localStorage && target === key) throw new DOMException("Test quota fault", "QuotaExceededError"); return set.call(this, target, value); }; Object.assign(window, { restoreWithdrawalWrites: () => { Storage.prototype.setItem = set; } }); }, keyA);
  const confirmation = page.getByRole("dialog", { name: "撤下这条计划？", exact: true }); await confirmation.getByRole("button", { name: "确认撤下计划", exact: true }).click();
  await expect(confirmation.getByRole("alert")).toContainText("浏览器存储空间不足"); expect(await localRaw(page)).toBe(before);
  await page.evaluate(() => (window as typeof window & { restoreWithdrawalWrites(): void }).restoreWithdrawalWrites());
  await confirmation.getByRole("button", { name: "确认撤下计划", exact: true }).click(); await expect(confirmation).toHaveCount(0);
  expect((await localData(page)).schedules[0]?.status).toBe("withdrawn"); await expect(page.getByRole("heading", { name: "还没有发布排期", exact: true })).toBeVisible();
});

test("stale editor withdrawal cannot overwrite another tab's saved revision and retains its draft", async ({ page, context }) => {
  await signIn(page); const name = await createAccount(page); await planForAccount(page, name, "跨标签原排期", nextMonthEnd(), "10:00"); await go(page, "plans");
  const other = await context.newPage(); await signIn(other, "/third-party/plans");
  await page.getByRole("button", { name: "打开排期：跨标签原排期", exact: true }).click(); await scheduleDialog(page).getByLabel(/^排期标题/).fill("旧标签未保存稿");
  await scheduleDialog(page).getByRole("button", { name: "撤下计划：跨标签原排期", exact: true }).click();
  await other.getByRole("button", { name: "打开排期：跨标签原排期", exact: true }).click(); await scheduleDialog(other).getByLabel(/^排期标题/).fill("另一个标签已更新"); await saveSchedule(other); const winner = await localRaw(other);
  const confirmation = page.getByRole("dialog", { name: "撤下这条计划？", exact: true }); await confirmation.getByRole("button", { name: "确认撤下计划", exact: true }).click();
  await expect(confirmation.getByRole("alert")).toContainText(/其他窗口|已更新|发生变化/); expect(await localRaw(page)).toBe(winner);
  await confirmation.getByRole("button", { name: "返回", exact: true }).click(); await expect(scheduleDialog(page).getByLabel(/^排期标题/)).toHaveValue("旧标签未保存稿");
  await discard(page); await expect(planRow(page, "另一个标签已更新")).toBeVisible(); expect((await localData(page)).schedules[0]?.status).toBe("planned"); await other.close();
});

test("320px calendar editor exposes cancel and withdraw actions without horizontal page scrolling", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 720 }); await signIn(page); const name = await createAccount(page); const date = nextMonthEnd();
  await planForAccount(page, name, "手机操作计划", date, "10:00"); await go(page, "calendar"); await showMonth(page, date); await page.locator(`[data-calendar-day="${date}"]`).click();
  const detail = page.locator('section[aria-label="排期详情"]'); await detail.getByRole("button", { name: "编辑排期：手机操作计划", exact: true }).click();
  const editor = scheduleDialog(page); await expect(editor.getByText("已保存计划的操作", { exact: true })).toBeVisible();
  await expect.poll(() => editor.evaluate(el => el.getAnimations().filter(a => a.playState === "running").length)).toBe(0);
  await editor.evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath("schedule-editor-actions-320.png"), fullPage: false });
  for (const label of ["取消排期：手机操作计划", "撤下计划：手机操作计划"]) {
    const button = editor.getByRole("button", { name: label, exact: true }); await button.focus(); await expect(button).toBeFocused();
    const box = await button.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await editor.getByRole("button", { name: "取消排期：手机操作计划", exact: true }).click(); await page.getByRole("button", { name: "确认取消排期", exact: true }).click(); await expect(page.getByRole("dialog", { name: "取消这条排期？", exact: true })).toHaveCount(0); await expect(editor).toHaveCount(0);
  await expect(detail).toContainText("已取消"); await detail.getByRole("button", { name: "编辑排期：手机操作计划", exact: true }).click();
  await editor.getByRole("button", { name: "撤下计划：手机操作计划", exact: true }).focus(); await page.keyboard.press("Enter");
  const confirmation = page.getByRole("dialog", { name: "撤下这条计划？", exact: true });
  await expect.poll(() => confirmation.evaluate(el => el.getAnimations().filter(a => a.playState === "running").length)).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("withdrawal-confirmation-320.png"), fullPage: false });
  await confirmation.getByRole("button", { name: "确认撤下计划", exact: true }).click(); await expect(confirmation).toHaveCount(0); await expect(editor).toHaveCount(0);
  await expect(page.locator('section[aria-label="当天排期"]')).not.toContainText("手机操作计划");
  await page.getByLabel("排期状态", { exact: true }).selectOption("withdrawn"); await expect(detail).toContainText("手机操作计划");
  await detail.getByRole("button", { name: "恢复排期：手机操作计划", exact: true }).click(); await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "恢复这条排期？", exact: true })).toHaveCount(0); expect((await localData(page)).schedules[0]?.status).toBe("planned");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
