import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { installHistoricalSnapshot } from "./fixtures/historical-snapshot";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "我的工作台", exact: true })).toBeVisible();
}

function frame(page: Page, workspaceId: "kol" | "thirdparty") {
  return page.frameLocator(`iframe[src^="/legacy/${workspaceId}.html"]`);
}

for (const [route, workspaceId, title] of [["/kol#creators", "kol", "达人与视频"], ["/third-party#library", "thirdparty", "账号与作品"]] as const) {
  test(`anonymous historical deep link preserves subpage ${route}`, async ({ page }) => {
    await installHistoricalSnapshot(page);
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "登录 Mikoshi", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "填入演示账号：林序" }).click();
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page).toHaveURL(route);
    await expect(frame(page, workspaceId).getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible({ timeout: 25_000 });
  });
}

async function openModule(page: Page, workspaceId: "kol" | "thirdparty") {
  const title = workspaceId === "kol" ? "KOL" : "三方号";
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: title, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  await expect(frame(page, workspaceId).locator(workspaceId === "kol" ? "#view" : "#page-content")).not.toBeEmpty({ timeout: 25_000 });
  await expect(page.getByText(`正在打开${title}数据工作台`, { exact: true })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.exposeFunction("readDataSystemErrors", () => errors);
});

test.afterEach(async ({ page }) => {
  if (page.isClosed()) return;
  const errors = await page.evaluate(() => (window as typeof window & { readDataSystemErrors(): Promise<string[]> }).readDataSystemErrors());
  expect(errors, "No uncaught errors in shell or historical iframe").toEqual([]);
});

test("MIKOSHI fox and secondary ANANTA brand preserve hierarchy, aspect ratio and compact layout", async ({ page }) => {
  await page.goto("/login");
  const logos = page.locator('img[src="/brand/mikoshi-fox.png"]');
  expect(await logos.count()).toBeGreaterThan(0);
  await expect(logos.first()).toHaveAttribute("src", /fox|mikoshi/i);
  expect(await logos.first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText("MIKOSHI", { exact: true }).first()).toBeVisible();
  await login(page);
  const sidebar = page.getByRole("complementary", { name: "侧栏" });
  await expect(sidebar.locator('img[src="/brand/mikoshi-fox.png"]')).toBeVisible();
  await expect(sidebar.getByText("MIKOSHI", { exact: true })).toBeVisible();
  const secondary = sidebar.getByRole("img", { name: "无限大 ANANTA", exact: true });
  await expect(secondary).toBeVisible();
  const brandGeometry = await secondary.evaluate((image) => {
    const logo = image as HTMLImageElement;
    const rect = logo.getBoundingClientRect();
    const description = logo.nextElementSibling!;
    const text = description.getBoundingClientRect();
    const parent = logo.parentElement!;
    return { width: rect.width, height: rect.height, naturalRatio: logo.naturalWidth / logo.naturalHeight,
      logoRight: rect.right, textLeft: text.left, alignment: getComputedStyle(description).textAlign,
      rowTop: parent.getBoundingClientRect().top,
      nameBottom: parent.previousElementSibling!.getBoundingClientRect().bottom };
  });
  expect(brandGeometry.width / brandGeometry.height).toBeCloseTo(brandGeometry.naturalRatio, 2);
  expect(brandGeometry.logoRight).toBeLessThanOrEqual(brandGeometry.textLeft);
  expect(brandGeometry.rowTop).toBeGreaterThan(brandGeometry.nameBottom);
  expect(brandGeometry.alignment).toBe("left");
  await page.getByRole("button", { name: "收起侧栏" }).click();
  await expect(sidebar.locator('img[src="/brand/mikoshi-fox.png"]')).toBeVisible();
  await expect(sidebar.locator('img[src="/brand/mikoshi-fox.png"]')).toHaveAttribute("alt", /Mikoshi|MIKOSHI/);
  await expect(secondary).toHaveCount(0);
  await expect(sidebar.getByText("MIKOSHI", { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "打开导航" }).click();
  await expect(page.getByRole("dialog", { name: "导航", exact: true }).getByText("MIKOSHI", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "导航", exact: true }).getByRole("img", { name: "无限大 ANANTA", exact: true })).toBeVisible();
});

for (const workspaceId of ["kol", "thirdparty"] as const) {
  const route = workspaceId === "kol" ? "/kol" : "/third-party";
  const label = workspaceId === "kol" ? "KOL" : "三方号";
  const pages: readonly (readonly [string, string])[] = workspaceId === "kol"
    ? [["overview", "全局透视"], ["creators", "达人与视频"], ["content", "内容与卖点"], ["sentiment", "评论与舆情"], ["compare", "对比与复盘"], ["quality", "数据与口径"]]
    : [["pivot", "全局透视"], ["library", "账号与作品"], ["content", "内容与讨论"], ["finance", "费用与起飞"], ["review", "节点复盘"], ["sources", "数据与口径"]];
  test(`${label} all subpages have synchronized URLs and restore on refresh and browser back`, async ({ page }) => {
    await installHistoricalSnapshot(page);
    await login(page);
    await openModule(page, workspaceId);
    const nav = page.getByRole("list", { name: `${label}页面`, exact: true });
    for (const [id, title] of pages) {
      await nav.getByRole("link", { name: title, exact: true }).click();
      await expect(page).toHaveURL(`${route}#${id}`);
      await expect(nav.getByRole("link", { name: title, exact: true })).toHaveAttribute("aria-current", "true");
      const heading = frame(page, workspaceId).locator(workspaceId === "kol" ? "#page-title" : "h1");
      await expect(heading).toContainText(title === "全局透视" && workspaceId === "kol" ? "全局透视分析" : title);
    }
    await page.reload();
    await expect(frame(page, workspaceId).getByRole("heading", { level: 1, name: "数据与口径", exact: true })).toBeVisible({ timeout: 25_000 });
    await nav.getByRole("link", { name: pages[0]![1], exact: true }).click();
    await expect(page).toHaveURL(`${route}#${pages[0]![0]}`);
    await page.goBack();
    await expect(page).toHaveURL(`${route}#${pages.at(-1)![0]}`);
    await expect(frame(page, workspaceId).getByRole("heading", { level: 1, name: "数据与口径", exact: true })).toBeVisible();
  });
}

test("KOL date filter changes scope, preserves across navigation, opens source details and exports real CSV", async ({ page }, testInfo) => {
  await installHistoricalSnapshot(page);
  await login(page);
  await openModule(page, "kol");
  const kol = frame(page, "kol");
  const fullScope = await kol.locator("#scope-count").innerText();
  await kol.getByLabel("发布日期范围", { exact: true }).selectOption("sep");
  await expect(kol.locator("#scope-count")).not.toHaveText(fullScope);
  const filteredScope = await kol.locator("#scope-count").innerText();
  await openModule(page, "thirdparty");
  await openModule(page, "kol");
  await expect(kol.getByLabel("发布日期范围", { exact: true })).toHaveValue("sep");
  await expect(kol.locator("#scope-count")).toHaveText(filteredScope);
  const download = page.waitForEvent("download");
  await kol.locator('[data-action="export"]').click();
  const csv = await download;
  const file = testInfo.outputPath("kol-filtered.csv");
  await csv.saveAs(file);
  const contents = await readFile(file, "utf8");
  expect(contents).toContain("BV");
  expect(contents).toMatch(/2026[./-]09/);
  expect(contents.split(/\r?\n/).length).toBeGreaterThan(2);
  await testInfo.attach("kol-export", { path: file, contentType: "text/csv" });
  await kol.locator("#reset-filters").click();
  await expect(kol.locator("#scope-count")).toHaveText(fullScope);
  await page.getByRole("list", { name: "KOL页面", exact: true }).getByRole("link", { name: "达人与视频", exact: true }).click();
  await kol.locator('[data-action="creator"]').filter({ visible: true }).first().click();
  await expect(kol.locator("#detail-drawer")).toBeVisible();
  await expect(kol.locator("#detail-drawer")).toContainText(/作品|播放|UID/);
  await page.keyboard.press("Escape");
  await expect(kol.locator("#detail-drawer")).not.toBeVisible();
});

test("third-party supplier filter, source detail, local export and missing-value explanation work", async ({ page }, testInfo) => {
  await installHistoricalSnapshot(page);
  await login(page);
  await openModule(page, "thirdparty");
  const third = frame(page, "thirdparty");
  await third.getByLabel("供应商筛选", { exact: true }).selectOption("蘑菇");
  await expect(third.getByLabel("供应商筛选", { exact: true })).toHaveValue("蘑菇");
  const download = page.waitForEvent("download");
  await third.locator('[data-action="export"]').click();
  const csv = await download;
  const file = testInfo.outputPath("third-party-filtered.csv");
  await csv.saveAs(file);
  const contents = await readFile(file, "utf8");
  expect(contents).toContain("蘑菇");
  expect(contents).toContain("来源");
  expect(contents.split(/\r?\n/).length).toBeGreaterThan(2);
  await testInfo.attach("third-party-export", { path: file, contentType: "text/csv" });
  await page.getByRole("list", { name: "三方号页面", exact: true }).getByRole("link", { name: "账号与作品", exact: true }).click();
  await third.getByRole("button", { name: "作品明细", exact: true }).click();
  await third.locator('[data-action="detail"]').first().click();
  await expect(third.getByRole("dialog")).toBeVisible();
  await expect(third.getByRole("dialog")).toContainText("源表记录");
  await third.getByRole("button", { name: "关闭弹窗", exact: true }).click();
  await expect(third.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("list", { name: "三方号页面", exact: true }).getByRole("link", { name: "全局透视", exact: true }).click();
  await expect(third.getByText(/— 表示缺失或无法计算/)).toBeVisible();
});

test("history workspaces lazy-load, make no automatic external requests and clear state on identity change", async ({ page }, testInfo) => {
  await installHistoricalSnapshot(page);
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== "127.0.0.1") requests.push(request.url());
  });
  await login(page);
  await expect(page.locator('iframe[src^="/legacy/"]')).toHaveCount(0);
  await openModule(page, "kol");
  await expect(page.locator('iframe[src^="/legacy/"]')).toHaveCount(1);
  await frame(page, "kol").getByLabel("发布日期范围", { exact: true }).selectOption("sep");
  await openModule(page, "thirdparty");
  await expect(page.locator('iframe[src^="/legacy/"]')).toHaveCount(2);
  await page.getByRole("button", { name: "账户菜单：林序（演示身份）" }).click();
  await page.getByRole("menuitem", { name: "切换为演示身份「许澄」", exact: true }).click();
  await expect(page.getByRole("button", { name: "账户菜单：许澄（演示身份）" })).toBeVisible();
  await openModule(page, "kol");
  await expect(frame(page, "kol").getByLabel("发布日期范围", { exact: true })).toHaveValue("all");
  await expect(frame(page, "kol").locator("#page-title")).toHaveText("发布效果总览");
  await testInfo.attach("automatic-external-requests", { body: JSON.stringify(requests), contentType: "application/json" });
  expect(requests).toEqual([]);
});

test("retained business boards and nested VPC keep distinct workflows and unknown metrics", async ({ page }) => {
  await login(page);
  const workflows = new Set<string>();
  for (const [route, label] of [["/collaborations", "联动管理"], ["/creative", "创意管理"], ["/creative/vpc", "VPC虚拟社区"]] as const) {
    if (route === "/creative/vpc") await page.getByRole("navigation", { name: "当前业务页面", exact: true }).getByRole("link", { name: label, exact: true }).click();
    else await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(route);
    await expect(page.getByRole("heading", { level: 1, name: label, exact: true })).toBeVisible();
    await expect(page.getByText("尚未接入数据", { exact: true })).toBeVisible();
    expect(await page.getByText("尚未接入，数值未知", { exact: true }).count()).toBe(4);
    workflows.add(await page.locator("main").innerText());
  }
  expect(workflows.size).toBe(3);
  await expect(page.getByText(/结果不代表真实反馈/)).toBeVisible();
});

test("shell theme and reduced motion propagate into both retained workspaces", async ({ page }) => {
  await installHistoricalSnapshot(page);
  await login(page);
  await openModule(page, "kol");
  await openModule(page, "thirdparty");
  await page.locator("nav").getByRole("link", { name: "个人设置", exact: true }).click();
  await page.getByRole("radio", { name: "深色", exact: true }).click();
  await page.getByRole("switch", { name: "减少动效", exact: true }).click();
  for (const workspaceId of ["kol", "thirdparty"] as const) {
    await openModule(page, workspaceId);
    await expect(frame(page, workspaceId).locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(frame(page, workspaceId).locator("html")).toHaveAttribute("data-motion", "reduce");
    expect(await frame(page, workspaceId).locator("body").evaluate((body) => getComputedStyle(body).backgroundColor)).not.toBe("rgb(255, 255, 255)");
  }
});

for (const [width, height, enlarged] of [[1280, 800, true], [1280, 600, true], [390, 640, false], [320, 568, false]] as const) {
test(`top navigation keeps all six links fully keyboard reachable at ${width}x${height}${enlarged ? " with 200-percent text and spacing" : ""}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height });
  await login(page);
  if (enlarged) await page.addStyleTag({ content: "html { font-size:32px!important } * { line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important } p { margin-bottom:2em!important }" });
  // Font resizing changes the rem-based sidebar width; inspect its settled
  // viewport rather than focusing midway through the 180ms width transition.
  await page.waitForTimeout(300);
  const navigation = page.getByRole("navigation", { name: "主导航", exact: true });
  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(6);
  await expect(navigation.getByRole("button", { name: "向右查看业务板块", exact: true })).toBeVisible();
  await links.first().focus();
  for (let index = 0; index < await links.count(); index++) {
    const link = links.nth(index);
    if (index) await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    const measurement = await link.evaluate((element) => ({
      text: element.textContent, link: element.getBoundingClientRect().toJSON(),
      navigation: element.closest("nav")!.getBoundingClientRect().toJSON(),
      navigationScrollHeight: element.closest("nav")!.scrollHeight,
      navigationScrollTop: element.closest("nav")!.scrollTop,
    }));
    await testInfo.attach(`top-navigation-focus-${index}`, { body: JSON.stringify(measurement), contentType: "application/json" });
    expect(measurement.link.height).toBeGreaterThanOrEqual(44);
    await expect.poll(() => link.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const focusedStyle = getComputedStyle(element);
      const halo = focusedStyle.outlineStyle === "none" ? 0 : Math.max(0, parseFloat(focusedStyle.outlineWidth) + parseFloat(focusedStyle.outlineOffset));
      const bounds = { top: rect.top - halo, bottom: rect.bottom + halo, left: rect.left - halo, right: rect.right + halo };
      const viewport = { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
      const clipping = [];
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (style.overflowY !== "visible") { viewport.top = Math.max(viewport.top, rect.top); viewport.bottom = Math.min(viewport.bottom, rect.bottom); }
        if (style.overflowX !== "visible") { viewport.left = Math.max(viewport.left, rect.left); viewport.right = Math.min(viewport.right, rect.right); }
        if (style.overflowX !== "visible" || style.overflowY !== "visible") clipping.push({ tag: parent.tagName, role: parent.getAttribute("role"), overflow: style.overflow, rect: rect.toJSON(), scrollTop: parent.scrollTop });
      }
      const inside = bounds.top >= viewport.top - 1 && bounds.bottom <= viewport.bottom + 1 && bounds.left >= viewport.left - 1 && bounds.right <= viewport.right + 1;
      return inside ? "visible" : JSON.stringify({ text: element.textContent, link: rect.toJSON(), focusOutline: { width: focusedStyle.outlineWidth, offset: focusedStyle.outlineOffset, bounds }, viewport, clipping });
    }), "Keyboard focus must bring the complete business link and its visible outline inside every actual clipping ancestor and the viewport").toBe("visible");
  }
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/creative");
});
}

test("KOL audience and clip categories preserve their original distinct colors in light and dark themes", async ({ page }, testInfo) => {
  await installHistoricalSnapshot(page);
  await page.emulateMedia({ colorScheme: "light" });
  await login(page);
  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark") {
      await page.locator("nav").getByRole("link", { name: "个人设置", exact: true }).click();
      await page.getByRole("radio", { name: "深色", exact: true }).click();
    }
    await openModule(page, "kol");
    const colors = await frame(page, "kol").locator('button[data-action="n3-audience-detail"][style*="background"],button[data-action="n4-clips-group"][style*="background"]').evaluateAll((elements) => elements.map((element) => ({
      category: element.textContent?.trim(), original: (element as HTMLElement).style.backgroundColor,
      rendered: getComputedStyle(element).backgroundColor,
    })));
    await testInfo.attach(`category-colors-${theme}`, { body: JSON.stringify(colors), contentType: "application/json" });
    expect(colors.length).toBeGreaterThan(1);
    expect(new Set(colors.map((color) => color.rendered)).size).toBeGreaterThan(1);
    for (const color of colors) expect(color.rendered, `${theme} category ${color.category} keeps its source color`).toBe(color.original);
  }
});
