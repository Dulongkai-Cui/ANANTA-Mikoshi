/** SBS-0010 targeted evidence: MIKO, blank dashboard and nested VPC. */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRenderedPage } from "./render-metrics.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const evidence = path.resolve(root, "../../SBS/evidence/SBS-0010");
const runId = `visual-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const directory = path.join(evidence, runId);
await mkdir(directory, { recursive: true });
const base = process.env.MIKOSHI_URL ?? "http://127.0.0.1:3108";
const origin = new URL(base).origin;
const repairOnly = process.argv.includes("--repair-only");
const notFoundOnly = process.argv.includes("--not-found-only");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) throw new Error("Local verification only");
const browser = await chromium.launch();
const report = { runId, base, browser: browser.version(), startedAt: new Date().toISOString(), runMode: notFoundOnly ? "not-found-only" : repairOnly ? "repair-only" : "full",
  scope: `${notFoundOnly ? "One 404 layout screenshot" : repairOnly ? "7 targeted repair screenshots" : "18 targeted screenshots"} of changed SBS-0010 routes/navigation. HTML contrast excludes disabled controls, SVG text and image pixels; screenshots require visual review. Historical workspace content is covered by retained functional regression, not recaptured here.`,
  captures: [], scenarios: [], pageErrors: [], consoleErrors: [], expectedConsoleErrors: [], externalRequests: [] };
const save = () => writeFile(path.join(directory, "results.json"), JSON.stringify(report, null, 2));
const spacing = "html { font-size:32px!important } * { line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important } p { margin-bottom:2em!important }";
const primary = (page) => page.getByRole("navigation", { name: "主导航", exact: true });

async function session(width, height, colorScheme = "light", authenticated = true) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, locale: "zh-CN", timezoneId: "Asia/Shanghai", deviceScaleFactor: 1 });
  const page = await context.newPage(); page.setDefaultTimeout(20_000);
  page.on("pageerror", (error) => report.pageErrors.push({ url: page.url(), message: error.message }));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const entry = { url: page.url(), text: message.text(), location: message.location() };
    if (notFoundOnly && message.location().url === base + "/business" && /Failed to load resource: the server responded with a status of 404/.test(message.text())) report.expectedConsoleErrors.push(entry);
    else report.consoleErrors.push(entry);
  });
  page.on("request", (request) => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) report.externalRequests.push({ url: request.url(), page: page.url() }); });
  if (!authenticated) return { page, context };
  await page.goto(base + "/login");
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(base + "/dashboard");
  await expect(primary(page)).toBeVisible();
  return { page, context };
}

async function visit(page, route, enlarged = false) {
  await page.goto(base + route);
  if (route === "/dashboard") await expect(page.getByRole("main").locator("h1")).toHaveClass(/sr-only/);
  else await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
  if (enlarged) await page.addStyleTag({ content: spacing });
  await page.waitForTimeout(300);
}

async function focusLastPrimary(page, targetIndex = 5) {
  const links = primary(page).getByRole("link");
  await expect(links).toHaveCount(6);
  await links.first().focus();
  for (let index = 1; index <= targetIndex; index++) await page.keyboard.press("Tab");
  await expect(links.nth(targetIndex)).toBeFocused();
  await expect.poll(() => links.nth(targetIndex).evaluate((element) => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    const halo = style.outlineStyle === "none" ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const viewport = { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const paint = getComputedStyle(parent), box = parent.getBoundingClientRect();
      if (paint.overflowY !== "visible") { viewport.top = Math.max(viewport.top, box.top); viewport.bottom = Math.min(viewport.bottom, box.bottom); }
      if (paint.overflowX !== "visible") { viewport.left = Math.max(viewport.left, box.left); viewport.right = Math.min(viewport.right, box.right); }
    }
    return rect.top - halo >= viewport.top - 1 && rect.bottom + halo <= viewport.bottom + 1 && rect.left - halo >= viewport.left - 1 && rect.right + halo <= viewport.right + 1;
  }), "Focused final navigation button and outline must be fully within the local scroll viewport").toBe(true);
}

async function capture(page, id) {
  await page.waitForLoadState("networkidle"); await page.evaluate(() => document.fonts.ready);
  const drawer = page.getByRole("dialog", { name: "导航", exact: true });
  if (await drawer.count()) {
    await expect.poll(() => drawer.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return Math.abs(bounds.x) < 1 && bounds.width >= 240 && bounds.right <= innerWidth + 1;
    }), "Capture the drawer only once its entrance transform has settled fully onscreen").toBe(true);
  }
  const metrics = await page.evaluate(inspectRenderedPage);
  const structure = await page.evaluate(() => ({
    mainText: document.querySelector("main")?.textContent?.trim(),
    primary: [...document.querySelectorAll('nav[aria-label="主导航"] a')].map((link) => ({ label: link.textContent, href: link.getAttribute("href"), current: link.getAttribute("aria-current"), rect: link.getBoundingClientRect().toJSON(), color: getComputedStyle(link).color, background: getComputedStyle(link).backgroundColor, border: getComputedStyle(link).borderColor })),
    contexts: [...document.querySelectorAll('nav[aria-label="当前业务页面"]')].filter((nav) => nav.getBoundingClientRect().width > 0).map((nav) => ({ text: nav.textContent, links: [...nav.querySelectorAll("a")].map((link) => ({ href: link.getAttribute("href"), label: link.textContent, current: link.getAttribute("aria-current") })) })),
    inputs: [...document.querySelectorAll("main input,main textarea,main button")].map((control) => ({ tag: control.tagName, disabled: control.disabled, name: control.getAttribute("aria-label") })),
  }));
  const screenshot = `${runId}/${id}.png`;
  await page.screenshot({ path: path.join(evidence, screenshot), fullPage: !id.includes("drawer") && !id.includes("focused") });
  report.captures.push({ id, screenshot, viewport: page.viewportSize(), ...metrics, structure });
  await save(); console.log(`${id}: overflow=${metrics.overflow.pass} contrast=${metrics.contrast.status}`);
}

async function scenario(name, width, height, theme, execute, authenticated = true) {
  const item = { name, status: "RUNNING" }; report.scenarios.push(item);
  let context;
  try { const state = await session(width, height, theme, authenticated); context = state.context; await execute(state.page); item.status = "PASS"; }
  catch (error) { item.status = "FAIL"; item.error = error.stack ?? String(error); console.error(name, error.message); }
  finally { await context?.close(); await save(); }
}

try {
  if (notFoundOnly) {
    await scenario("retired business route 404 layout", 1440, 900, "light", async (page) => {
      const response = await page.goto(base + "/business"); expect(response.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1, name: "没有找到这个页面", exact: true })).toBeVisible();
      await capture(page, "business-404-layout-light-1440");
    }, false);
  } else if (repairOnly) {
    await scenario("corrected login description", 1440, 900, "light", async (page) => {
      await page.goto(base + "/login"); await expect(page.getByRole("heading", { level: 1, name: "登录 Mikoshi", exact: true })).toBeVisible(); await capture(page, "login-description-light-1440");
    }, false);
    await scenario("MIKO mobile after scroll padding repair", 320, 640, "light", async (page) => {
      await visit(page, "/miko"); await capture(page, "miko-repair-light-320");
    });
    await scenario("legacy anonymous VPC redirect", 1440, 900, "light", async (page) => {
      await page.goto(base + "/vpc"); await expect(page.getByRole("heading", { level: 1, name: "登录 Mikoshi", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click(); await page.getByRole("button", { name: "登录", exact: true }).click();
      await expect(page).toHaveURL(base + "/creative/vpc"); await expect(page.getByRole("heading", { level: 1, name: "VPC虚拟社区", exact: true })).toBeVisible();
      await capture(page, "vpc-old-link-after-login-1440");
    }, false);
    for (const height of [800, 600]) await scenario(`middle navigation focus 200 percent 1280x${height}`, 1280, height, "light", async (page) => {
      await visit(page, "/miko", true); await focusLastPrimary(page, 1); await capture(page, `dashboard-link-focused-text200-spacing-1280x${height}`);
    });
    await scenario("mobile last focus", 320, 568, "light", async (page) => {
      await visit(page, "/miko"); await focusLastPrimary(page); await capture(page, "last-primary-focused-repair-320");
    });
    await scenario("settled creative VPC drawer", 390, 844, "light", async (page) => {
      await visit(page, "/creative/vpc"); await page.getByRole("button", { name: "打开导航", exact: true }).click(); await capture(page, "creative-vpc-drawer-settled-390");
    });
  } else {
  await scenario("desktop light", 1440, 900, "light", async (page) => {
    for (const route of ["/miko", "/dashboard", "/creative", "/creative/vpc"]) { await visit(page, route); await capture(page, `${route.slice(1).replaceAll("/", "-")}-light-1440`); }
  });
  await scenario("desktop dark", 1440, 900, "dark", async (page) => {
    for (const route of ["/miko", "/creative/vpc"]) { await visit(page, route); await capture(page, `${route.slice(1).replaceAll("/", "-")}-dark-1440`); }
  });
  await scenario("compact desktop", 1280, 800, "light", async (page) => {
    await visit(page, "/miko"); await capture(page, "miko-light-1280");
    await visit(page, "/creative/vpc"); await page.getByRole("button", { name: "收起侧栏", exact: true }).click(); await page.waitForTimeout(300); await capture(page, "creative-vpc-collapsed-1280");
  });
  await scenario("mobile 390", 390, 844, "light", async (page) => {
    await visit(page, "/miko"); await capture(page, "miko-light-390");
    await visit(page, "/creative/vpc"); await capture(page, "creative-vpc-light-390");
    await page.getByRole("button", { name: "打开导航", exact: true }).click(); await capture(page, "creative-vpc-drawer-390");
  });
  await scenario("mobile 320", 320, 640, "light", async (page) => {
    await visit(page, "/miko"); await capture(page, "miko-light-320");
    await visit(page, "/dashboard"); await capture(page, "dashboard-blank-light-320");
    await visit(page, "/creative/vpc"); await capture(page, "creative-vpc-light-320");
  });
  await scenario("200 percent text and spacing", 1280, 800, "light", async (page) => {
    await visit(page, "/miko", true); await capture(page, "miko-text200-spacing-1280x800");
    await visit(page, "/creative/vpc", true); await capture(page, "creative-vpc-text200-spacing-1280x800");
  });
  await scenario("200 percent short viewport", 1280, 600, "light", async (page) => {
    await visit(page, "/miko", true); await capture(page, "miko-text200-spacing-1280x600");
    await focusLastPrimary(page); await capture(page, "last-primary-focused-text200-spacing-1280x600");
  });
  }
} finally {
  await browser.close(); report.finishedAt = new Date().toISOString();
  report.summary = { captures: report.captures.length,
    scenarioFailures: report.scenarios.filter((item) => item.status !== "PASS"),
    overflowFailures: report.captures.filter((item) => !item.overflow.pass).map((item) => ({ id: item.id, overflow: item.overflow })),
    contrastFailures: report.captures.filter((item) => item.contrast.status === "FAIL").map((item) => ({ id: item.id, failures: item.contrast.failures })),
    contrastNeedsManual: report.captures.filter((item) => item.contrast.status === "NEEDS_MANUAL").map((item) => ({ id: item.id, unsupported: item.contrast.unsupported })),
    pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length, externalRequests: report.externalRequests.length };
  const fail = report.summary.scenarioFailures.length || report.summary.overflowFailures.length || report.summary.contrastFailures.length || report.summary.pageErrors || report.summary.consoleErrors || report.summary.externalRequests;
  report.status = fail ? "FAIL" : report.summary.contrastNeedsManual.length ? "NEEDS_MANUAL" : "PASS";
  await save(); await writeFile(path.join(evidence, notFoundOnly ? "visual-not-found-results.json" : repairOnly ? "visual-repair-results.json" : "visual-results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ runId, status: report.status, ...report.summary }, null, 2)); if (fail) process.exitCode = 1;
}
