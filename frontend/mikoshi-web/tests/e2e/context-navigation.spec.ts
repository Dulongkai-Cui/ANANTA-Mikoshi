import { expect, test, type Page } from "@playwright/test";

const workspaces = [
  ["/miko", "MIKO"], ["/dashboard", "我的工作台"], ["/third-party", "三方号"], ["/kol", "KOL"],
  ["/collaborations", "联动管理"], ["/creative", "创意管理"],
] as const;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "我的工作台", exact: true })).toBeVisible();
}

const top = (page: Page) => page.getByRole("navigation", { name: "主导航", exact: true });
const context = (page: Page) => page.getByRole("complementary", { name: "侧栏", exact: true }).getByRole("navigation", { name: "当前业务页面", exact: true });

test("six primary workspaces follow the current order while VPC belongs only to the creative context", async ({ page }) => {
  await login(page);
  await expect(top(page).getByRole("link")).toHaveText(workspaces.map(([, label]) => label));
  await expect(page.locator("header").getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(1);
  await expect(page.getByRole("complementary", { name: "侧栏" }).getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(0);
  for (const [route, label] of workspaces) {
    await top(page).getByRole("link", { name: label, exact: true }).click();
    const heading = page.getByRole("heading", { name: route === "/miko" ? "你好，我是 MIKO" : label, level: 1, exact: true });
    if (route === "/dashboard") await expect(heading).toBeVisible();
    else await expect(heading).toBeVisible();
    await expect(top(page).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(top(page).getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    const links = context(page).getByRole("link");
    const legacy = route === "/kol" || route === "/third-party";
    await expect(links).toHaveCount(route === "/third-party" ? 10 : route === "/kol" ? 11 : route === "/creative" ? 2 : route === "/dashboard" ? 5 : 1);
    for (const href of await links.evaluateAll((items) => items.map((item) => item.getAttribute("href")))) {
      expect(href).toMatch(new RegExp(`^${route}${route === "/dashboard" ? "(?:/(?:tasks|timeline|people|kol))?" : route === "/creative" ? "(?:/vpc)?" : route === "/third-party" ? "(?:/(?:accounts|plans|calendar))?" : route === "/kol" ? "(?:/(?:accounts|progress|plans|calendar))?" : ""}(?:#[-a-z]+)?$`));
    }
    if (route === "/creative") await expect(links).toHaveText(["创意总览", "VPC虚拟社区"]);
    else if (route === "/dashboard") await expect(links).toHaveText(["工作台总览", "任务看板", "项目时间轴", "人员进度", "KOL协作概览"]); else if (!legacy) await expect(links).toHaveText([route === "/miko" ? "AI入口" : "业务总览"]);
  }
  await page.getByRole("navigation", { name: "个人", exact: true }).getByRole("link", { name: "个人设置", exact: true }).click();
  await expect(top(page).locator('[aria-current="page"]')).toHaveCount(0);
  await expect(context(page).getByRole("link", { name: "外观与偏好", exact: true })).toHaveAttribute("href", "/settings");
});

for (const [route, label, workspaceId, lastPage] of [["/kol", "KOL", "kol", "quality"], ["/third-party", "三方号", "thirdparty", "sources"]] as const) {
  test(`${label} collapsed context keeps all seven icon links usable and retains active page through top navigation and Back`, async ({ page }) => {
    await login(page);
    await top(page).getByRole("link", { name: label, exact: true }).click();
    await page.getByRole("button", { name: "收起侧栏", exact: true }).click();
    const links = context(page).getByRole("list", { name: `${label}页面`, exact: true }).getByRole("link");
    await expect(links).toHaveCount(7);
    for (let index = 0; index < 7; index++) {
      const link = links.nth(index);
      await expect(link).toHaveAttribute("aria-label", /.+/);
      const href = await link.getAttribute("href");
      await link.click();
      await expect(page).toHaveURL(href!);
      await expect(link).toHaveAttribute("aria-current", "true");
    }
    await expect(page).toHaveURL(`${route}#${lastPage}`);
    const iframe = page.frameLocator(`iframe[src^="/legacy/${workspaceId}.html"]`);
    await expect(iframe.getByRole("heading", { level: 1, name: "数据与口径", exact: true })).toBeVisible();
    // Clicking the already-active primary area must not reset its selected page.
    await top(page).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(`${route}#${lastPage}`);
    await top(page).getByRole("link", { name: "创意管理", exact: true }).click();
    await expect(context(page).getByRole("link")).toHaveCount(2);
    await top(page).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(`${route}#${lastPage}`);
    await expect(iframe.getByRole("heading", { level: 1, name: "数据与口径", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL("/creative");
    await page.goBack();
    await expect(page).toHaveURL(`${route}#${lastPage}`);
  });
}

for (const width of [320, 390]) {
  test(`mobile ${width} top-level switching refreshes the drawer context and returns focus after close`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await login(page);
    const trigger = page.getByRole("button", { name: "打开导航", exact: true });
    const drawer = page.getByRole("dialog", { name: "导航", exact: true });
    for (const [route, label] of workspaces) {
      await top(page).getByRole("link", { name: label, exact: true }).click();
      const heading = page.getByRole("heading", { level: 1, name: route === "/miko" ? "你好，我是 MIKO" : label, exact: true });
      if (route === "/dashboard") await expect(heading).toBeVisible();
      else await expect(heading).toBeVisible();
      await trigger.click();
      const contextual = drawer.getByRole("navigation", { name: "当前业务页面", exact: true });
      const links = contextual.getByRole("link");
      const legacy = route === "/kol" || route === "/third-party";
      await expect(links).toHaveCount(route === "/third-party" ? 10 : route === "/kol" ? 11 : route === "/creative" ? 2 : route === "/dashboard" ? 5 : 1);
      await expect(drawer.getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(0);
      for (const item of await links.evaluateAll((items) => items.map((item) => ({ href: item.getAttribute("href"), height: item.getBoundingClientRect().height })))) {
        expect(item.href).toMatch(new RegExp(`^${route}${route === "/dashboard" ? "(?:/(?:tasks|timeline|people|kol))?" : route === "/creative" ? "(?:/vpc)?" : route === "/third-party" ? "(?:/(?:accounts|plans|calendar))?" : route === "/kol" ? "(?:/(?:accounts|progress|plans|calendar))?" : ""}(?:#[-a-z]+)?$`));
        expect(item.height).toBeGreaterThanOrEqual(44);
      }
      if (legacy) {
        const historical = contextual.getByRole("list", { name: `${label}页面`, exact: true }).getByRole("link");
        await expect(historical).toHaveCount(7);
        await historical.last().click();
        await expect(page).toHaveURL(`${route}#${route === "/kol" ? "quality" : "sources"}`);
        await expect(drawer).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await trigger.click();
      }
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

