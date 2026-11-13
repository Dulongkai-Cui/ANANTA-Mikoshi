/** SBS-0009: real production layout evidence for the changed navigation and brand. */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRenderedPage } from "./render-metrics.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const evidence = path.resolve(root, "../../SBS/evidence/SBS-0009");
const runId = `visual-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const directory = path.join(evidence, runId);
await mkdir(directory, { recursive: true });
const base = process.env.MIKOSHI_URL ?? "http://127.0.0.1:3108";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) throw new Error("Local verification only");
const origin = new URL(base).origin;
const focusOnly = process.argv.includes("--focus-only");
const report = {
  runId, startedAt: new Date().toISOString(), base, runMode: focusOnly ? "focus-only" : "full",
  scope: "SBS-0009 navigation/brand/layout. Captures are actual viewports. HTML contrast is measured separately from SVG and image pixels; historical content correctness is covered by retained E2E and SBS-0008 evidence, not re-certified by these screenshots.",
  captures: [], scenarios: [], pageErrors: [], consoleErrors: [], externalRequests: [], loadTimings: [],
};
const browser = await chromium.launch();
report.browser = browser.version();
const save = () => writeFile(path.join(directory, "results.json"), JSON.stringify(report, null, 2));
const spacing = "html { font-size:32px!important } * { line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important } p { margin-bottom:2em!important }";
const primary = (page) => page.getByRole("navigation", { name: "主导航", exact: true });

async function session(viewport = { width: 1440, height: 900 }, colorScheme = "light") {
  const context = await browser.newContext({ viewport, colorScheme, locale: "zh-CN", timezoneId: "Asia/Shanghai", deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", (error) => report.pageErrors.push({ url: page.url(), message: error.message }));
  page.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push({ url: page.url(), text: message.text() }); });
  page.on("request", (request) => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) report.externalRequests.push({ url: request.url(), page: page.url() }); });
  return { page, context };
}

async function login(page) {
  await page.goto(`${base}/login`);
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "我的工作台", exact: true })).toBeVisible();
}

async function visit(page, route, enlarged = false) {
  const started = performance.now();
  await page.goto(base + route);
  await expect(page.locator("h1")).toBeVisible();
  if (/^\/(kol|third-party)/.test(route)) {
    const id = route.startsWith("/kol") ? "kol" : "thirdparty";
    // Historical HTML includes embedded source images/data; use the existing
    // functional suite's 25s initialization budget, and require real rendering.
    await expect(page.frameLocator(`iframe[src^="/legacy/${id}.html"]`).locator(id === "kol" ? "#view" : "#page-content")).not.toBeEmpty({ timeout: 25_000 });
    await expect(page.getByText(/^正在打开.*数据工作台$/)).toHaveCount(0, { timeout: 25_000 });
    report.loadTimings.push({ route, completedInMs: Math.round(performance.now() - started), readiness: "nonempty historical content and host loading overlay removed" });
  }
  if (enlarged) {
    await page.addStyleTag({ content: spacing });
    for (const child of page.frames().filter((frame) => /\/legacy\//.test(frame.url()))) {
      await expect.poll(() => child.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
      await child.addStyleTag({ content: spacing });
    }
  }
}

async function capture(page, id) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(inspectRenderedPage);
  const frames = [];
  for (const child of page.frames().filter((frame) => /\/legacy\//.test(frame.url()))) {
    if (await (await child.frameElement()).isVisible()) frames.push(await child.evaluate(inspectRenderedPage));
  }
  const navigation = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="主导航"]');
    const list = nav?.querySelector("ul");
    const contexts = [...document.querySelectorAll('nav[aria-label="当前业务页面"]')].filter((item) => item.getBoundingClientRect().width > 0);
    return {
      primary: nav ? { rect: nav.getBoundingClientRect().toJSON(), items: [...nav.querySelectorAll("a")].map((item) => ({ text: item.textContent, href: item.getAttribute("href"), current: item.getAttribute("aria-current"), rect: item.getBoundingClientRect().toJSON() })),
        scroll: list ? { width: list.clientWidth, scrollWidth: list.scrollWidth, left: list.scrollLeft, overflow: getComputedStyle(list).overflowX } : null,
        buttons: [...nav.querySelectorAll("button")].map((button) => ({ name: button.getAttribute("aria-label"), disabled: button.disabled, rect: button.getBoundingClientRect().toJSON() })) } : null,
      contexts: contexts.map((item) => ({ label: item.textContent, links: [...item.querySelectorAll("a")].map((link) => ({ text: link.textContent, name: link.getAttribute("aria-label"), href: link.getAttribute("href"), rect: link.getBoundingClientRect().toJSON() })) })),
      images: [...document.querySelectorAll('img[src^="/brand/"]')].filter((image) => image.getBoundingClientRect().width > 0).map((image) => ({ src: image.getAttribute("src"), alt: image.alt, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, rect: image.getBoundingClientRect().toJSON() })),
      focused: document.activeElement?.outerHTML.slice(0, 500),
    };
  });
  const screenshot = `${runId}/${id}.png`;
  await page.screenshot({ path: path.join(evidence, screenshot), fullPage: false });
  report.captures.push({ id, screenshot, viewport: page.viewportSize(), ...metrics, navigation, frames });
  await save();
  console.log(`${id}: overflow=${metrics.overflow.pass} contrast=${metrics.contrast.status} frames=${frames.map((frame) => `${frame.overflow.pass}/${frame.contrast.status}`).join(",")}`);
}

async function scenario(name, execute) {
  const entry = { name, status: "RUNNING" };
  report.scenarios.push(entry);
  try { await execute(); entry.status = "PASS"; }
  catch (error) { entry.status = "FAIL"; entry.error = error.stack ?? String(error); console.error(name, error.message); }
  await save();
}

async function focusLastPrimary(page) {
  // User font-size overrides animate the rem-based sidebar width for 180ms.
  // Match the functional keyboard test: start navigation after layout settles.
  await page.waitForTimeout(300);
  const links = primary(page).getByRole("link");
  await links.first().focus();
  for (let index = 1; index < await links.count(); index++) await page.keyboard.press("Tab");
  await expect(links.last()).toBeFocused();
  await expect.poll(() => links.last().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const halo = style.outlineStyle === "none" ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const viewport = { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const parentStyle = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (parentStyle.overflowY !== "visible") { viewport.top = Math.max(viewport.top, bounds.top); viewport.bottom = Math.min(viewport.bottom, bounds.bottom); }
      if (parentStyle.overflowX !== "visible") { viewport.left = Math.max(viewport.left, bounds.left); viewport.right = Math.min(viewport.right, bounds.right); }
    }
    return rect.top - halo >= viewport.top - 1 && rect.bottom + halo <= viewport.bottom + 1 && rect.left - halo >= viewport.left - 1 && rect.right + halo <= viewport.right + 1;
  }), "Screenshot must show the whole focused link and outline inside the real scrolling viewport").toBe(true);
}

try {
  if (focusOnly) {
    for (const [width, height, enlarged] of [[320, 568, false], [390, 640, false], [1280, 800, true], [1280, 600, true]]) await scenario(`focus outline ${width}x${height}${enlarged ? " enlarged" : ""}`, async () => {
      const { page, context } = await session({ width, height });
      try {
        await login(page); await visit(page, "/dashboard", enlarged);
        await focusLastPrimary(page);
        await capture(page, `primary-focus-outline-${width}x${height}${enlarged ? "-text200-spacing" : ""}`);
      } finally { await context.close(); }
    });
    for (const width of [1440, 1280]) await scenario(`ordinary desktop ${width} after focus spacing repair`, async () => {
      const { page, context } = await session({ width, height: 900 });
      try { await login(page); await visit(page, "/kol"); await capture(page, `kol-focus-repair-light-${width}`); }
      finally { await context.close(); }
    });
  } else {
  for (const theme of ["light", "dark"]) await scenario(`desktop ${theme}`, async () => {
    const { page, context } = await session(undefined, theme);
    try {
      await visit(page, "/login"); await capture(page, `login-${theme}-1440`);
      await login(page); await capture(page, `dashboard-${theme}-1440`);
      for (const route of theme === "light" ? ["/kol", "/third-party", "/collaborations", "/creative", "/vpc", "/business", "/settings"] : ["/kol", "/third-party", "/creative"]) {
        await visit(page, route); await capture(page, `${route.slice(1)}-${theme}-1440`);
      }
      if (theme === "light") {
        await visit(page, "/kol#creators"); await capture(page, "kol-creators-light-1440");
        await page.getByRole("button", { name: "收起侧栏", exact: true }).click(); await capture(page, "kol-context-collapsed-light-1440");
      }
    } finally { await context.close(); }
  });
  await scenario("compact desktop", async () => {
    const { page, context } = await session({ width: 1280, height: 800 });
    try { await login(page); await capture(page, "dashboard-light-1280"); await visit(page, "/kol"); await capture(page, "kol-light-1280"); }
    finally { await context.close(); }
  });
  for (const width of [390, 320]) await scenario(`mobile ${width}`, async () => {
    const { page, context } = await session({ width, height: width === 390 ? 844 : 640 });
    try {
      await login(page); await capture(page, `dashboard-light-${width}`);
      await visit(page, "/kol"); await capture(page, `kol-light-${width}`);
      await page.getByRole("button", { name: "打开导航", exact: true }).click(); await capture(page, `kol-context-drawer-light-${width}`); await page.keyboard.press("Escape");
      await visit(page, "/third-party#library"); await capture(page, `third-library-light-${width}`);
      await page.getByRole("button", { name: "打开导航", exact: true }).click(); await capture(page, `third-context-drawer-light-${width}`); await page.keyboard.press("Escape");
      await visit(page, "/creative"); await capture(page, `creative-light-${width}`);
      await focusLastPrimary(page); await capture(page, `last-primary-focused-light-${width}`);
    } finally { await context.close(); }
  });
  for (const height of [800, 600]) await scenario(`200-percent text plus spacing 1280x${height}`, async () => {
    const { page, context } = await session({ width: 1280, height });
    try {
      await login(page);
      for (const route of height === 800 ? ["/dashboard", "/kol", "/third-party", "/creative"] : ["/dashboard"]) {
        await visit(page, route, true); await capture(page, `${route.slice(1)}-text200-spacing-1280x${height}`);
      }
      await focusLastPrimary(page); await capture(page, `last-primary-focused-text200-spacing-1280x${height}`);
    } finally { await context.close(); }
  });
  await scenario("dark mobile drawer", async () => {
    const { page, context } = await session({ width: 390, height: 640 }, "dark");
    try {
      await login(page); await visit(page, "/kol"); await capture(page, "kol-dark-390");
      await page.getByRole("button", { name: "打开导航", exact: true }).click(); await capture(page, "kol-context-drawer-dark-390");
    } finally { await context.close(); }
  });
  }
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  const all = report.captures.flatMap((item) => [item, ...item.frames.map((frame) => ({ id: `${item.id}:${frame.url}`, ...frame }))]);
  report.summary = {
    captures: report.captures.length,
    scenarioFailures: report.scenarios.filter((item) => item.status !== "PASS"),
    overflowFailures: all.filter((item) => !item.overflow.pass).map((item) => ({ id: item.id, overflow: item.overflow })),
    contrastFailures: all.filter((item) => item.contrast.status === "FAIL").map((item) => ({ id: item.id, failures: item.contrast.failures })),
    contrastNeedsManual: all.filter((item) => item.contrast.status === "NEEDS_MANUAL").map((item) => ({ id: item.id, unsupported: item.contrast.unsupported })),
    pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length, externalRequests: report.externalRequests.length,
  };
  const fail = report.summary.scenarioFailures.length || report.summary.overflowFailures.length || report.summary.contrastFailures.length || report.summary.pageErrors || report.summary.consoleErrors || report.summary.externalRequests;
  report.status = fail ? "FAIL" : report.summary.contrastNeedsManual.length ? "NEEDS_MANUAL" : "PASS";
  await save();
  await writeFile(path.join(evidence, focusOnly ? "visual-focus-results.json" : "visual-results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, runId, ...report.summary }, null, 2));
  if (fail) process.exitCode = 1;
}
