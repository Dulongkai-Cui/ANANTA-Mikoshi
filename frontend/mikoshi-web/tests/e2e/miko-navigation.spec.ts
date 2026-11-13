import { expect, test, type Page } from "@playwright/test";

const primary = (page: Page) => page.getByRole("navigation", { name: "主导航", exact: true });
const secondary = (page: Page) => page.getByRole("navigation", { name: "当前业务页面", exact: true });

async function signIn(page: Page) {
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true })).toBeVisible();
}

for (const entry of ["/creative/vpc", "/vpc"]) {
  test(`anonymous ${entry} resolves to the canonical creative VPC page and preserves refresh and Back`, async ({ page }) => {
    await page.goto(entry);
    await expect(page.getByRole("heading", { level: 1, name: "登录 Mikoshi", exact: true })).toBeVisible();
    await signIn(page);
    await expect(page).toHaveURL("/creative/vpc");
    await expect(page.getByRole("heading", { level: 1, name: "VPC虚拟社区", exact: true })).toBeVisible();
    await expect(primary(page).getByRole("link", { name: "创意管理", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(primary(page).getByRole("link", { name: "VPC虚拟社区", exact: true })).toHaveCount(0);
    await expect(secondary(page).getByRole("link")).toHaveText(["创意总览", "VPC虚拟社区"]);
    await expect(secondary(page).getByRole("link", { name: "VPC虚拟社区", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(/结果不代表真实反馈/)).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL("/creative/vpc");
    await expect(page.getByRole("heading", { level: 1, name: "VPC虚拟社区", exact: true })).toBeVisible();
    await secondary(page).getByRole("link", { name: "创意总览", exact: true }).click();
    await expect(page).toHaveURL("/creative");
    await page.goBack();
    await expect(page).toHaveURL("/creative/vpc");
    await expect(secondary(page).getByRole("link", { name: "VPC虚拟社区", exact: true })).toHaveAttribute("aria-current", "page");
  });
}

test("VPC search explains creative ownership and the retired business page is neither searchable nor runnable", async ({ page }) => {
  await page.goto("/login"); await signIn(page);
  const search = page.getByRole("button", { name: "搜索页面", exact: true });
  await search.click();
  const input = page.getByRole("combobox", { name: "搜索页面", exact: true });
  await input.fill("VPC");
  const result = page.getByRole("option").filter({ hasText: "VPC虚拟社区" });
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("创意管理");
  await input.press("Enter");
  await expect(page).toHaveURL("/creative/vpc");
  await expect(primary(page).getByRole("link", { name: "创意管理", exact: true })).toHaveAttribute("aria-current", "page");
  await search.click(); await input.fill("整体业务中台");
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(page.getByText(/没有名为“整体业务中台”的页面/)).toBeVisible();
  await page.keyboard.press("Escape");
  const response = await page.goto("/business");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "没有找到这个页面", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "整体业务中台", exact: true })).toHaveCount(0);
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const logo = page.getByRole("main").getByRole("img", { name: "MIKOSHI", exact: true });
    await expect(logo).toBeVisible();
    const image = await logo.boundingBox();
    const status = await page.getByRole("main").getByText("404", { exact: true }).boundingBox();
    expect(image!.y + image!.height, `${width}px 404 logo must not overlap the error status`).toBeLessThan(status!.y);
    expect(image!.width / image!.height).toBeCloseTo(1, 2);
  }
});

test("creative VPC stays accessible in collapsed sidebar and mobile drawer", async ({ page }) => {
  await page.goto("/creative/vpc"); await signIn(page);
  await page.getByRole("button", { name: "收起侧栏", exact: true }).click();
  await expect(secondary(page).getByRole("link")).toHaveCount(2);
  await secondary(page).getByRole("link", { name: "创意总览", exact: true }).click();
  await expect(page).toHaveURL("/creative");
  await secondary(page).getByRole("link", { name: "VPC虚拟社区", exact: true }).click();
  await expect(page).toHaveURL("/creative/vpc");
  await page.setViewportSize({ width: 320, height: 640 });
  const trigger = page.getByRole("button", { name: "打开导航", exact: true });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "导航", exact: true });
  await expect(drawer.getByRole("link", { name: "VPC虚拟社区", exact: true })).toHaveAttribute("aria-current", "page");
  await drawer.getByRole("link", { name: "创意总览", exact: true }).click();
  await expect(page).toHaveURL("/creative");
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const kind of ["valid", "corrupt"] as const) {
  test(`marketing workbench never reads or rewrites ${kind} stored layouts across reload, navigation and identity change`, async ({ page }, testInfo) => {
    const rawA = kind === "valid" ? '{ "schemaVersion":1, "userId":"demo-u-linxu", "revision":7, "widgets":[] }\n' : '{broken-layout-A\n';
    const rawB = kind === "valid" ? '{"schemaVersion":1,"userId":"demo-u-xucheng","revision":2,"widgets":[]}' : '  damaged layout B : [  ';
    const seeds = { "mikoshi.dashboard.v1.demo-u-linxu": rawA, "mikoshi.dashboard.v1.demo-u-xucheng": rawB };
    await page.addInitScript((values) => {
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
      if (!sessionStorage.getItem("sbs10-layout-seeded")) {
        for (const [key, raw] of Object.entries(values)) set.call(localStorage, key, raw);
        sessionStorage.setItem("sbs10-layout-seeded", "true");
      }
      const calls: Array<{ method: string; key: string }> = [];
      const watch = (storage: Storage, method: string, key: string) => { if (storage === localStorage && key.startsWith("mikoshi.dashboard.")) calls.push({ method, key }); };
      Storage.prototype.getItem = function (key) { watch(this, "get", key); return get.call(this, key); };
      Storage.prototype.setItem = function (key, value) { watch(this, "set", key); return set.call(this, key, value); };
      Storage.prototype.removeItem = function (key) { watch(this, "remove", key); return remove.call(this, key); };
      Storage.prototype.clear = function () { if (this === localStorage) calls.push({ method: "clear", key: "*" }); return clear.call(this); };
      Object.assign(window, { readLayoutPreservationEvidence: () => ({ calls: [...calls], values: Object.fromEntries(Object.keys(values).map((key) => [key, get.call(localStorage, key)])) }) });
    }, seeds);
    const checkPreservation = async (stage: string) => {
      const evidence = await page.evaluate(() => (window as typeof window & { readLayoutPreservationEvidence(): { calls: unknown[]; values: Record<string, string | null> } }).readLayoutPreservationEvidence());
      await testInfo.attach(`layout-${stage}`, { body: JSON.stringify(evidence), contentType: "application/json" });
      expect(evidence.calls, "Retired dashboard must not read, write, remove or clear layout storage").toEqual([]);
      expect(evidence.values).toEqual(seeds);
    };
    await page.goto("/login"); await signIn(page);
    await expect(page).toHaveURL("/dashboard");
    const main = page.getByRole("main");
    await expect(main.locator("h1")).toHaveText("我的工作台");
    await expect(main.locator("h1")).toBeVisible();
    await expect(main.getByRole("heading", { name: "任务状态分布", exact: true })).toBeVisible();
    await expect(main.locator("[data-widget]")).toHaveCount(0);
    await checkPreservation("initial");
    await page.reload(); await expect(primary(page)).toBeVisible(); await checkPreservation("refresh");
    for (const [label, route, title] of [["MIKO", "/miko", "你好，我是 MIKO"], ["创意管理", "/creative", "创意管理"], ["我的工作台", "/dashboard", "我的工作台"]] as const) {
      await primary(page).getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(route);
      await expect(main.locator("h1")).toHaveText(title);
      await checkPreservation(label);
    }
    await page.getByRole("button", { name: "账户菜单：林序（演示身份）", exact: true }).click();
    await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click();
    await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）", exact: true })).toBeVisible();
    await checkPreservation("second-identity");
    await expect(main.getByRole("heading", { name: "任务状态分布", exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "个人", exact: true }).getByRole("link", { name: "个人设置", exact: true }).click();
    await expect(page).toHaveURL("/settings"); await checkPreservation("settings");
  });
}

test("MIKO is an honest disabled preview with no conversation, agent execution or network activity", async ({ page }, testInfo) => {
  const businessRequests: string[] = [], sockets: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (/^https?:/.test(url.protocol) && (url.hostname !== "127.0.0.1" || request.method() !== "GET" || /^\/api(?:\/|$)/.test(url.pathname))) businessRequests.push(`${request.method()} ${request.url()}`);
  });
  page.on("websocket", (socket) => sockets.push(socket.url()));
  await page.goto("/miko"); await signIn(page);
  await expect(page).toHaveURL("/miko");
  const main = page.getByRole("main");
  await expect(main.getByText("功能预览", { exact: true })).toBeVisible();
  await expect(main.getByText(/尚未接入/).first()).toBeVisible();
  const input = main.getByRole("textbox");
  await expect(input).toHaveCount(1); await expect(input).toBeDisabled();
  await expect(main.getByRole("button", { name: /发送/ })).toBeDisabled();
  await expect(main.locator('[role="log"],iframe,[data-message-role="assistant"]')).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  const subsequent: string[] = [];
  page.on("request", (request) => subsequent.push(request.url()));
  await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  expect(subsequent).toEqual([]);
  await testInfo.attach("miko-network", { body: JSON.stringify({ businessRequests, sockets, subsequent }), contentType: "application/json" });
  expect(businessRequests).toEqual([]); expect(sockets).toEqual([]);
});

