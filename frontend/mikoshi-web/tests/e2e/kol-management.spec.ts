import { expect, test, type Page } from "@playwright/test";
import { kolKey } from "../../src/features/kol/repository";
import type { KolStore } from "../../src/features/kol/model";
import { addCalendarDays, shanghaiToday, shiftCalendarMonth } from "../../src/lib/calendar-dates";

const keyA = kolKey("demo-u-linxu"), keyB = kolKey("demo-u-xucheng");
const today = () => shanghaiToday(new Date());
const dialog = (page: Page) => page.getByRole("dialog").first();
const data = async (page: Page): Promise<KolStore | null> => page.evaluate(key => { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }, keyA);
async function login(page: Page, path = "/kol/accounts") {
  await page.goto(path);
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(path); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
async function go(page: Page, name: string, path: string) {
  if (page.viewportSize()!.width < 768) await page.getByRole("button", { name: "打开导航", exact: true }).click();
  await page.getByRole("navigation", { name: "当前业务页面", exact: true }).getByRole("link", { name, exact: true }).click();
  await expect(page).toHaveURL(path);
}
async function talent(page: Page, name = "测试达人甲", uid = "9876543211001") {
  await page.getByRole("button", { name: "新增达人", exact: true }).click();
  await dialog(page).getByLabel(/^平台账号标识/).fill(uid);
  await dialog(page).getByLabel(/^达人昵称/).fill(name);
  await dialog(page).getByRole("button", { name: "保存达人", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
}
async function cooperation(page: Page, title = "首波主题合作") {
  await go(page, "合作进度", "/kol/progress");
  await page.getByRole("button", { name: "新建合作", exact: true }).click();
  const saved = await data(page);
  await dialog(page).getByLabel(/^合作达人/).selectOption(saved!.talents[0]!.id);
  await dialog(page).getByLabel(/^主题 \/ 合作名称/).fill(title);
  await dialog(page).getByLabel("内部认领人", { exact: true }).fill("测试负责人");
  await dialog(page).getByLabel("下一步", { exact: true }).fill("确认脚本方向");
  await dialog(page).getByRole("button", { name: "保存合作", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function plan(page: Page, title: string, date = today(), time = "18:00") {
  await page.getByRole("button", { name: "新增排期", exact: true }).click();
  const saved = await data(page);
  await dialog(page).getByLabel(/^关联合作/).selectOption(saved!.collaborations[0]!.id);
  await dialog(page).getByLabel(/^排期标题/).fill(title);
  await dialog(page).getByLabel(/^计划日期/).fill(date);
  await dialog(page).getByLabel(/^计划时间/).fill(time);
  await dialog(page).getByRole("button", { name: "保存排期", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function setup(page: Page) { await login(page); await talent(page); await cooperation(page); await go(page, "发布计划", "/kol/plans"); }
async function confirm(page: Page, text: string) { await page.getByRole("dialog").last().getByRole("button", { name: text, exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0); }
async function discard(page: Page) { await dialog(page).getByRole("button", { name: "取消", exact: true }).click(); await page.getByRole("dialog", { name: "KOL 资料还没有保存", exact: true }).getByRole("button", { name: "放弃更改", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0); }

test("KOL empty four management pages retain useful structure and do not seed data", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("columnheader", { name: "达人 / 平台身份", exact: true })).toBeVisible();
  await expect(page.getByText("达人待录入", { exact: true })).toBeVisible();
  await go(page, "合作进度", "/kol/progress");
  await expect(page.getByRole("region", { name: "合作阶段看板，可横向滚动", exact: true }).getByRole("heading", { level: 2 })).toHaveCount(9);
  await page.getByRole("button", { name: "表格", exact: true }).click(); await expect(page.getByRole("columnheader", { name: "主题 / 达人", exact: true })).toBeVisible();
  await go(page, "发布计划", "/kol/plans"); await expect(page.getByText("发布内容待安排", { exact: true })).toBeVisible();
  await go(page, "发布日历", "/kol/calendar"); await expect(page.locator("[data-calendar-day]")).toHaveCount(42);
  expect(await data(page)).toBeNull();
});

test("KOL complete talent to cooperation to two schedules calendar reschedule cancel withdraw restore", async ({ page }) => {
  await setup(page); await plan(page, "上午发布", today(), "09:00"); await plan(page, "晚间发布", today(), "20:00");
  expect((await data(page))?.schedules).toHaveLength(2);
  await go(page, "发布日历", "/kol/calendar");
  await page.getByRole("region", { name: "当天排期", exact: true }).getByRole("button").filter({ hasText: "晚间发布" }).click();
  await page.getByRole("button", { name: "编辑排期：晚间发布", exact: true }).click();
  const next = shiftCalendarMonth(today(), 1); await dialog(page).getByLabel(/^计划日期/).fill(next); await dialog(page).getByRole("button", { name: "保存排期", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "下个月", exact: true }).click();
  await page.locator(`[data-calendar-day="${next}"]`).click();
  await expect(page.getByRole("region", { name: "排期详情", exact: true })).toContainText("晚间发布");
  await page.getByRole("button", { name: "取消排期：晚间发布", exact: true }).click(); await confirm(page, "确认取消排期");
  expect((await data(page))?.schedules.find(s => s.title === "晚间发布")?.status).toBe("cancelled");
  await page.getByRole("button", { name: "恢复排期：晚间发布", exact: true }).click(); await confirm(page, "确认恢复");
  await page.getByRole("button", { name: "撤下计划：晚间发布", exact: true }).click(); await confirm(page, "确认撤下计划");
  await expect(page.getByRole("region", { name: "排期详情", exact: true })).toHaveCount(0);
  await page.getByLabel("日历状态筛选", { exact: true }).selectOption("withdrawn");
  await page.getByRole("button", { name: "恢复排期：晚间发布", exact: true }).click(); await confirm(page, "确认恢复");
  await page.getByLabel("日历状态筛选", { exact: true }).selectOption("");
  expect((await data(page))?.schedules.find(s => s.title === "晚间发布")).toMatchObject({ date: next, status: "planned" });
  await page.reload(); await expect(page.locator("[data-calendar-day]")).toHaveCount(42); expect((await data(page))?.schedules).toHaveLength(2);
});

test("KOL validates duplicate platform identity, safe links and maintains null unknown fields", async ({ page }) => {
  await login(page); await talent(page);
  await page.getByRole("button", { name: "新增达人", exact: true }).click();
  await dialog(page).getByLabel(/^平台账号标识/).fill("0009876543211001"); await dialog(page).getByLabel(/^达人昵称/).fill("重复昵称可改但ID不可重复");
  await dialog(page).getByLabel("主页链接", { exact: true }).fill("javascript:alert(1)"); await dialog(page).getByRole("button", { name: "保存达人", exact: true }).click();
  await expect(dialog(page).getByText(/这个平台账号已经入库/)).toBeVisible(); await expect(dialog(page).getByText(/请填写不含账号密码/)).toBeVisible();
  await dialog(page).getByLabel(/^平台账号标识/).fill("9876543211002"); await dialog(page).getByLabel("主页链接", { exact: true }).fill("https://space.bilibili.com/9876543211002"); await dialog(page).getByRole("button", { name: "保存达人", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await data(page))?.talents[1]).toMatchObject({ followers: null, referencePrice: null });
  await page.getByRole("button", { name: "测试达人甲", exact: true }).click(); await expect(dialog(page).getByLabel(/^平台账号标识/)).toHaveAttribute("readonly", ""); await expect(dialog(page).getByRole("combobox", { name: "平台", exact: true })).toBeDisabled();
});

test("KOL cooperation stages, lock status and multiple records stay separate", async ({ page }) => {
  await login(page); await talent(page); await cooperation(page); await cooperation(page, "第二波合作");
  await page.getByRole("button", { name: "第二波合作", exact: true }).click();
  await dialog(page).getByLabel("合作阶段", { exact: true }).selectOption("review"); await dialog(page).getByLabel("档期状态", { exact: true }).selectOption("verbal");
  await dialog(page).getByRole("button", { name: "保存合作", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "待审核", exact: true })).toContainText("第二波合作");
  await page.getByRole("button", { name: "表格", exact: true }).click(); await expect(page.getByRole("row").filter({ hasText: "第二波合作" })).toContainText("口头预留");
  const saved = await data(page); expect(saved?.collaborations).toHaveLength(2); expect(saved?.collaborations.find(c => c.title === "第二波合作")).toMatchObject({ stage: "review", booking: "verbal", quote: null });
});

test("KOL rejects active duplicate time and permits cancellation under stopped talent", async ({ page }) => {
  await setup(page); await plan(page, "既有排期", today(), "09:00");
  await page.getByRole("button", { name: "新增排期", exact: true }).click();
  await dialog(page).getByLabel(/^关联合作/).selectOption((await data(page))!.collaborations[0]!.id); await dialog(page).getByLabel(/^排期标题/).fill("撞期发布"); await dialog(page).getByLabel(/^计划日期/).fill(today()); await dialog(page).getByLabel(/^计划时间/).fill("09:00"); await dialog(page).getByRole("button", { name: "保存排期", exact: true }).click();
  await expect(dialog(page).getByText(/此达人在该时刻已有排期/)).toBeVisible(); await discard(page);
  await go(page, "KOL入库", "/kol/accounts"); await page.getByRole("button", { name: "测试达人甲", exact: true }).click(); await dialog(page).getByLabel("达人状态", { exact: true }).selectOption("archived"); await dialog(page).getByRole("button", { name: "保存达人", exact: true }).click();
  await go(page, "发布计划", "/kol/plans"); await expect(page.getByText("合作或达人待核对", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "取消排期：既有排期", exact: true }).click(); await confirm(page, "确认取消排期"); await expect(page.getByRole("button", { name: "恢复排期：既有排期", exact: true })).toBeDisabled();
  await expect(page.getByText("达人已停用，请先启用达人后恢复计划。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "撤下计划：既有排期", exact: true }).click(); await confirm(page, "确认撤下计划");
  expect((await data(page))?.schedules[0]?.status).toBe("withdrawn");
});

test("KOL cancelling cooperation retains its schedule and blocks restoration until cooperation resumes", async ({ page }) => {
  await setup(page); await plan(page, "待核对计划");
  await go(page, "合作进度", "/kol/progress"); await page.getByRole("button", { name: "首波主题合作", exact: true }).click();
  await dialog(page).getByLabel("合作阶段", { exact: true }).selectOption("cancelled"); await dialog(page).getByRole("button", { name: "保存合作", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await data(page))?.schedules[0]?.status).toBe("planned");
  await go(page, "发布计划", "/kol/plans"); await expect(page.getByText("合作或达人待核对", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "取消排期：待核对计划", exact: true }).click(); await confirm(page, "确认取消排期"); await expect(page.getByRole("button", { name: "恢复排期：待核对计划", exact: true })).toBeDisabled();
  await expect(page.getByText("合作已取消，请先恢复合作后恢复计划。", { exact: true })).toBeVisible();
  await go(page, "合作进度", "/kol/progress"); await page.getByRole("button", { name: "首波主题合作", exact: true }).click(); await dialog(page).getByLabel("合作阶段", { exact: true }).selectOption("confirming"); await dialog(page).getByRole("button", { name: "保存合作", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  await go(page, "发布计划", "/kol/plans"); await page.getByRole("button", { name: "恢复排期：待核对计划", exact: true }).click(); await confirm(page, "确认恢复"); expect((await data(page))?.schedules[0]?.status).toBe("planned");
});

test("KOL draft survives Back and closing requires explicit discard", async ({ page }) => {
  await login(page); await go(page, "合作进度", "/kol/progress"); await go(page, "KOL入库", "/kol/accounts");
  await page.getByRole("button", { name: "新增达人", exact: true }).click(); await dialog(page).getByLabel(/^达人昵称/).fill("尚未保存的达人");
  await page.goBack(); await expect(page.getByText("KOL 还有未保存的资料。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "返回继续编辑", exact: true }).click(); await expect(dialog(page).getByLabel(/^达人昵称/)).toHaveValue("尚未保存的达人");
  await dialog(page).getByRole("button", { name: "取消", exact: true }).click(); await page.getByRole("dialog", { name: "KOL 资料还没有保存", exact: true }).getByRole("button", { name: "继续编辑", exact: true }).click(); await expect(dialog(page).getByLabel(/^达人昵称/)).toHaveValue("尚未保存的达人");
  await discard(page); expect(await data(page)).toBeNull();
});

test("KOL quota error keeps the edited input and never reports a saved record", async ({ page }) => {
  await login(page); await page.getByRole("button", { name: "新增达人", exact: true }).click(); await dialog(page).getByLabel(/^达人昵称/).fill("配额测试达人"); await dialog(page).getByLabel(/^平台账号标识/).fill("9876543211010");
  await page.evaluate(() => { const previous = Storage.prototype.setItem; Storage.prototype.setItem = function (key, value) { if (key.startsWith("mikoshi:kol:")) throw new DOMException("Quota", "QuotaExceededError"); return previous.call(this, key, value); }; });
  await dialog(page).getByRole("button", { name: "保存达人", exact: true }).click(); await expect(dialog(page).getByRole("alert")).toContainText("空间不足"); await expect(dialog(page).getByLabel(/^达人昵称/)).toHaveValue("配额测试达人"); expect(await data(page)).toBeNull();
});

test("KOL corrupt store is retained and new writes are blocked", async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, "corrupt KOL original"), keyA); await login(page);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("资料损坏"); await expect(page.getByRole("button", { name: "新增达人", exact: true })).toBeDisabled(); expect(await page.evaluate(key => localStorage.getItem(key), keyA)).toBe("corrupt KOL original");
});

test("KOL cross-tab stale write preserves winner and current draft", async ({ page, context }) => {
  await login(page); await page.getByRole("button", { name: "新增达人", exact: true }).click(); await dialog(page).getByLabel(/^达人昵称/).fill("落后草稿"); await dialog(page).getByLabel(/^平台账号标识/).fill("9876543211099");
  const second = await context.newPage(); await login(second); await talent(second, "另一个窗口保存", "9876543211088");
  await dialog(page).getByRole("button", { name: "保存达人", exact: true }).click(); await expect(dialog(page).getByRole("alert")).toContainText("其他窗口已更新"); await expect(dialog(page).getByLabel(/^达人昵称/)).toHaveValue("落后草稿"); expect((await data(page))?.talents.map(t => t.name)).toEqual(["另一个窗口保存"]); await second.close();
});

test("KOL identity switching keeps local records isolated", async ({ page }) => {
  await login(page); await talent(page);
  await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click(); await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "测试达人甲", exact: true })).toHaveCount(0); expect(await page.evaluate(key => localStorage.getItem(key), keyB)).toBeNull();
  await page.getByRole("button", { name: "账户菜单：许澄（演示身份）", exact: true }).click(); await page.getByRole("menuitem", { name: "切换为演示身份「林序」", exact: true }).click(); await expect(page.getByRole("button", { name: "测试达人甲", exact: true })).toBeVisible();
});

test("KOL calendar keyboard moves dates and month without losing focus", async ({ page }) => {
  await login(page, "/kol/calendar"); const selected = page.locator(`[data-calendar-day="${today()}"]`); await selected.focus(); await page.keyboard.press("ArrowRight"); await expect(page.locator(`[data-calendar-day="${addCalendarDays(today(), 1)}"]`)).toBeFocused(); await page.keyboard.press("PageDown"); await expect(page.locator(`[data-calendar-day="${shiftCalendarMonth(addCalendarDays(today(), 1), 1)}"]`)).toBeFocused();
});

test("KOL management pages use local horizontal scrolling at 320px dark and 200 percent text", async ({ page }) => {
  await login(page); await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; document.documentElement.style.fontSize = "32px"; });
  for (const [name, path] of [["KOL入库", "/kol/accounts"], ["合作进度", "/kol/progress"], ["发布计划", "/kol/plans"], ["发布日历", "/kol/calendar"]]) {
    await go(page, name!, path!); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ root: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.root, `${path}: 320px + 200% text must keep horizontal scrolling inside table/calendar regions`).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});
