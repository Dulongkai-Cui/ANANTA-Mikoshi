import { expect, test, type Page } from "@playwright/test";

const USER_A = "demo-u-linxu";

const routes = [
  ["/miko", "MIKO"],
  ["/dashboard", "我的工作台"],
  ["/third-party", "三方号"],
  ["/kol", "KOL"],
  ["/collaborations", "联动管理"],
  ["/creative", "创意管理"],
  ["/creative/vpc", "VPC虚拟社区"],
  ["/settings", "个人设置"],
] as const;

// Legacy home pages may carry the explicit #home fragment so a browser Back
// operation can distinguish them from remembered nested workspace pages.
const routePattern = (path: string) => new RegExp(`${path}${path === "/kol" || path === "/third-party" ? "(?:#home)?" : ""}$`);

async function signIn(page: Page, identity = "林序") {
  await page.getByRole("button", { name: `填入演示账号：${identity}` }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("button", { name: `账户菜单：${identity}（演示身份）` })).toBeVisible();
}

async function enter(page: Page, path = "/dashboard", identity = "林序") {
  await page.goto(path);
  await signIn(page, identity);
  await expect(page).toHaveURL(routePattern(path));
}

async function accountAction(page: Page, name: string) {
  await page.getByRole("button", { name: /^账户菜单：/ }).click();
  await page.getByRole("menuitem", { name }).click();
}

// Each test has a new browser context: fixtures and fault injection cannot leak into another test.
test.beforeEach(async ({ page }) => {
  const uncaught: string[] = [];
  page.on("pageerror", (error) => uncaught.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|Minified React error/i.test(message.text())) uncaught.push(message.text());
  });
  await page.exposeFunction("reportUncaughtForTest", () => uncaught);
});

test.afterEach(async ({ page }, testInfo) => {
  if (page.isClosed()) return;
  const errors = await page.evaluate(async () => {
    const scope = window as typeof window & { reportUncaughtForTest?: () => Promise<string[]> };
    return scope.reportUncaughtForTest?.() ?? [];
  }).catch(() => [] as string[]);
  if (errors.length) await testInfo.attach("browser-runtime-errors", { body: JSON.stringify(errors), contentType: "application/json" });
  expect(errors, "No uncaught browser or React hydration errors").toEqual([]);
});

test("login validates fields, retains wrong credentials, and supports password visibility", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByText("请输入邮箱", { exact: true })).toBeVisible();
  await expect(page.getByLabel("邮箱", { exact: true })).toBeFocused();
  await page.getByLabel("邮箱", { exact: true }).fill("bad");
  await page.getByLabel("密码", { exact: true }).fill("wrong-example");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByText(/邮箱格式不正确/)).toBeVisible();
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  await page.getByLabel("密码", { exact: true }).fill("wrong-example");
  await page.getByRole("button", { name: "显示密码" }).click();
  await expect(page.getByLabel("密码", { exact: true })).toHaveAttribute("type", "text");
  await page.getByLabel("密码", { exact: true }).press("Enter");
  await expect(page.getByText("邮箱或密码不正确", { exact: true })).toBeVisible();
  await expect(page.getByLabel("密码", { exact: true })).toHaveValue("wrong-example");
  await expect(page).toHaveURL(/\/login$/);
});

test("pending login retains focus and creates one non-sensitive session", async ({ page }) => {
  await page.addInitScript(() => {
    window.__MIKOSHI_DEMO_FAULTS__ = { signInDelayMs: 700 };
    const scope = window as typeof window & { sessionWrites?: number };
    scope.sessionWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === sessionStorage && key === "mikoshi.session") scope.sessionWrites! += 1;
      return original.call(this, key, value);
    };
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  const submit = page.locator('button[type="submit"]');
  await submit.click();
  await expect(submit).toHaveAttribute("aria-busy", "true");
  await expect(submit).toBeFocused();
  await submit.press("Enter");
  await submit.press("Enter");
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => (window as typeof window & { sessionWrites?: number }).sessionWrites)).toBe(1);
  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem("mikoshi.session")!));
  expect(session).toEqual({ version: 1, userId: USER_A, mode: "demo" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "我的工作台", exact: true })).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
});

for (const [path, title] of routes) {
  test(`anonymous deep link returns to ${path}, refresh and navigation work`, async ({ page }) => {
    await enter(page, path);
    const heading = page.getByRole("heading", { level: 1, name: path === "/miko" ? "你好，我是 MIKO" : title, exact: true });
    if (path === "/dashboard") await expect(heading).toBeVisible();
    else await expect(heading).toBeVisible();
    // Contextual overviews legitimately share hrefs with their top-level route.
    // Assert the current item in its own navigation layer.
    const routeNavigation = page.getByRole("navigation", { name: path === "/settings" ? "个人" : "主导航", exact: true });
    await expect(routeNavigation.locator(`a[href="${path === "/creative/vpc" ? "/creative" : path}"][aria-current="page"]`)).toHaveCount(1);
    await page.reload();
    if (path === "/dashboard") await expect(heading).toBeVisible();
    else await expect(heading).toBeVisible();
    if (path !== "/dashboard") {
      await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: "我的工作台", exact: true }).click();
      if (path === "/creative/vpc") {
        await routeNavigation.getByRole("link", { name: "创意管理", exact: true }).click();
        await page.getByRole("navigation", { name: "当前业务页面", exact: true }).getByRole("link", { name: title, exact: true }).click();
      } else await routeNavigation.getByRole("link", { name: title, exact: true }).click();
      await expect(page).toHaveURL(routePattern(path));
    }
  });
}

for (const target of ["https://example.invalid", "//example.invalid", "%2Fbusiness", "/not-registered", "/business"]) {
  test(`rejects unsafe returnTo ${target}`, async ({ page }) => {
    await page.goto(`/login?returnTo=${encodeURIComponent(target)}`);
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
}

test("logout clears session and history cannot restore authenticated UI", async ({ page }) => {
  await enter(page);
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: "KOL", exact: true }).click();
  await expect(page).toHaveURL(routePattern("/kol"));
  await accountAction(page, "退出登录");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem("mikoshi.session"))).toBeNull();
  await page.goBack();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(0);
});

test("blocked session removal reports unsuccessful logout and preserves the current identity", async ({ page }) => {
  await enter(page);
  await page.evaluate(() => {
    const original = Storage.prototype.removeItem;
    (window as typeof window & { restoreRemovals?: () => void }).restoreRemovals = () => { Storage.prototype.removeItem = original; };
    Storage.prototype.removeItem = function (key) {
      if (this === sessionStorage) throw new DOMException("Blocked in browser test", "SecurityError");
      return original.call(this, key);
    };
  });
  await accountAction(page, "退出登录");
  await expect(page.getByText(/退出未完成：浏览器无法清除本地会话/)).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: "账户菜单：林序（演示身份）" })).toBeVisible();
  await page.evaluate(() => (window as typeof window & { restoreRemovals?: () => void }).restoreRemovals?.());
  await accountAction(page, "退出登录");
  await expect(page).toHaveURL(/\/login$/);
});

test("session write failure cannot silently log in", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === sessionStorage) throw new DOMException("Blocked in browser test", "SecurityError");
      return original.call(this, key, value);
    };
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "填入演示账号：许澄" }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByText("本地会话无法建立", { exact: true })).toBeVisible();
  await expect(page.getByLabel("邮箱", { exact: true })).toHaveValue("xucheng@mikoshi-demo.invalid");
  await expect(page).toHaveURL(/\/login$/);
});

test("corrupted session is explained without rendering protected content", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("mikoshi.session", "{broken"));
  await page.goto("/miko");
  await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible();
  await expect(page.getByText(/本地演示会话已失效或数据损坏/)).toBeVisible();
});

test("identity switch has an exclusive pending state with no competing logout action", async ({ page }) => {
  await enter(page);
  await page.evaluate(() => { window.__MIKOSHI_DEMO_FAULTS__ = { signInDelayMs: 900 }; });
  await accountAction(page, "切换为演示身份「许澄」");
  await expect(page.getByRole("button", { name: "账户菜单：林序（演示身份）" })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "退出登录" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）" })).toBeVisible();
});

test("mobile drawer account menu remains above its overlay and permits settings and logout", async ({ page }) => {
  await enter(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "打开导航" }).click();
  await accountAction(page, "个人设置");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("dialog", { name: "导航", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "打开导航" }).click();
  await accountAction(page, "退出登录");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("search scrolls the keyboard-selected option into view in a short viewport", async ({ page }) => {
  await enter(page);
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.getByRole("button", { name: "搜索页面", exact: true }).click();
  await page.getByRole("combobox", { name: "搜索页面" }).press("End");
  const selected = page.getByRole("option", { selected: true });
  await expect(selected).toContainText("个人设置");
  await expect.poll(() => selected.evaluate((option) => {
    const viewport = option.parentElement?.parentElement;
    if (!viewport) return false;
    const bounds = viewport.getBoundingClientRect();
    const rect = option.getBoundingClientRect();
    return rect.top >= bounds.top && rect.bottom <= bounds.bottom + 1;
  })).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);
});

test("search supports Chinese composition, keyboard navigation, no-result, focus return and repeated close", async ({ page }) => {
  await enter(page);
  const trigger = page.getByRole("button", { name: "搜索页面", exact: true });
  await trigger.click();
  const input = page.getByRole("combobox", { name: "搜索页面" });
  await input.fill("联动");
  await input.dispatchEvent("compositionstart", { data: "联动" });
  await input.dispatchEvent("keydown", { key: "Enter", code: "Enter", isComposing: true, keyCode: 229 });
  await expect(page.getByRole("dialog", { name: "搜索页面" })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  await input.dispatchEvent("compositionend", { data: "联动" });
  await input.press("Enter");
  await expect(page).toHaveURL(/\/collaborations$/);
  await trigger.focus();
  await page.keyboard.press("Control+k");
  await input.fill("并不存在的页面");
  await expect(page.getByText(/没有名为“并不存在的页面”的页面/)).toBeVisible();
  await input.press("Escape");
  await expect(trigger).toBeFocused();
  for (let i = 0; i < 3; i += 1) {
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await trigger.click();
  await input.fill("");
  await input.press("End");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.locator('[data-slot="overlay"]')).toHaveCount(0);
});

test("theme and motion preferences persist while system reduced motion cannot be overridden", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await enter(page, "/settings");
  await page.getByRole("radio", { name: "深色", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("switch").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await page.reload();
  await expect(page.getByRole("radio", { name: "深色", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: "深色", exact: true }).press("ArrowRight");
  await expect(page.getByRole("radio", { name: "跟随系统", exact: true })).toBeFocused();
  await page.getByRole("switch").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("switch")).toBeDisabled();
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
});

test("preference write failure applies locally and announces session-only persistence", async ({ page }) => {
  await enter(page, "/settings");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage) throw new DOMException("Blocked in browser test", "SecurityError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("radio", { name: "深色", exact: true }).click();
  await expect(page.getByText("设置仅在本次会话有效", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("status").filter({ hasText: "主题已设为深色" })).toContainText("仅本次会话有效");
});

test("sidebar collapse, mobile drawer and 404 recovery are operable", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "收起侧栏" }).click();
  await expect(page.getByRole("button", { name: "展开侧栏" })).toBeVisible();
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: "三方号", exact: true }).click();
  await expect(page).toHaveURL(routePattern("/third-party"));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("演示环境", { exact: true }).first()).toBeVisible();
  const open = page.getByRole("button", { name: "打开导航" });
  await open.click();
  const drawer = page.getByRole("dialog", { name: "导航", exact: true });
  await expect(drawer.getByRole("navigation", { name: "当前业务页面", exact: true }).getByRole("link")).toHaveCount(10);
  await expect(drawer.getByRole("list", { name: "三方号页面", exact: true }).getByRole("link")).toHaveCount(7);
  await drawer.getByRole("link", { name: "账号与作品", exact: true }).click();
  await expect(page).toHaveURL(/\/third-party#library$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: "创意管理", exact: true }).click();
  await expect(page).toHaveURL(/\/creative$/);
  await open.click();
  await expect(drawer.getByRole("navigation", { name: "当前业务页面", exact: true }).getByRole("link", { name: "VPC虚拟社区", exact: true })).toHaveAttribute("href", "/creative/vpc");
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
  await page.goto("/not-a-page");
  await expect(page.getByRole("heading", { name: "没有找到这个页面" })).toBeVisible();
  await page.getByRole("link", { name: "返回我的工作台" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

