/** SBS-0008: actual production UI screenshots, rendered contrast and iframe parity. */
import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRenderedPage } from "./render-metrics.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const evidence = path.resolve(root, "../../SBS/evidence/SBS-0008");
const runId = `visual-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const directory = path.join(evidence, runId);
await mkdir(directory, { recursive: true });
const base = process.env.MIKOSHI_URL ?? "http://127.0.0.1:3108";
const origin = new URL(base).origin;
const legacyOnly = process.argv.includes("--legacy-only");
const legacyRoutes = ["/kol", "/third-party"];
const allRoutes = [...legacyRoutes, "/collaborations", "/creative", "/vpc", "/business", "/settings"];
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) throw new Error("Local verification only");
const report = {
  runId, startedAt: new Date().toISOString(), base, runMode: legacyOnly ? "legacy-only" : "full",
  scope: "Production local demo plus both offline historical workspaces. Screenshots inspect visible viewports; contrast probes inspect rendered HTML text, excluding SVG/chart text and image pixels, which need visual review.",
  contrastMethod: "Browser-parsed colors with alpha/background/ancestor opacity compositing. 4.5 normal text, 3 large text. Disabled and hidden text excluded; unsupported effects require manual review.",
  captures: [], chartEvidence: [], scenarios: [], externalRequests: [], pageErrors: [], consoleErrors: [],
};
const browser = await chromium.launch();
report.browser = browser.version();
const save = () => writeFile(path.join(directory, "results.json"), JSON.stringify(report, null, 2));
const spacing = "html { font-size: 32px !important; } * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }";

async function session(viewport = { width: 1440, height: 900 }, colorScheme = "light", reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, colorScheme, reducedMotion, locale: "zh-CN", timezoneId: "Asia/Shanghai", deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) report.externalRequests.push({ page: page.url(), url: request.url() });
  });
  page.on("pageerror", (error) => report.pageErrors.push({ page: page.url(), message: error.message }));
  page.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push({ page: page.url(), text: message.text() }); });
  return { page, context };
}

async function login(page) {
  await page.goto(`${base}/login`);
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "我的工作台", exact: true })).toBeVisible();
}

async function visit(page, route, enlarged = false) {
  await page.goto(base + route);
  if (route === "/kol" || route === "/third-party") {
    const workspaceId = route === "/kol" ? "kol" : "thirdparty";
    const embedded = page.frameLocator(`iframe[src^="/legacy/${workspaceId}.html"]`);
    await expect(embedded.locator(workspaceId === "kol" ? "#view" : "#page-content")).not.toBeEmpty();
    await expect(page.getByText(/^正在打开.*数据工作台$/)).toHaveCount(0);
  } else await expect(page.locator("h1")).toBeVisible();
  if (enlarged) {
    await page.addStyleTag({ content: spacing });
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
    // Apply the same genuine user stylesheet inside the document, after checking
    // that the host's enlarged root font is propagated by the actual bridge.
    for (const frame of page.frames().filter((f) => /\/legacy\//.test(f.url()))) {
      await expect.poll(() => frame.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
      await frame.addStyleTag({ content: spacing });
    }
  }
}

async function capture(page, id) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const modalOpen = await page.locator('[role="dialog"][data-state="open"]').count();
  const embedded = page.frames().filter((f) => /\/legacy\//.test(f.url()));
  const metrics = await page.evaluate(inspectRenderedPage);
  const frameMetrics = [];
  for (const child of embedded) {
    const owner = await child.frameElement();
    if (await owner.isVisible()) frameMetrics.push(await child.evaluate(inspectRenderedPage));
  }
  const screenshot = path.join(runId, `${id}.png`).replaceAll("\\", "/");
  await page.screenshot({ path: path.join(evidence, screenshot), fullPage: !modalOpen && !frameMetrics.length });
  const row = { id, screenshot, viewport: page.viewportSize(), ...metrics, frames: frameMetrics };
  report.captures.push(row);
  if (/^(kol|third-party)-(light|dark)-1440$/.test(id)) {
    const child = embedded[0];
    const graphs = child.locator("svg");
    for (let index = 0; index < await graphs.count(); index++) {
      const graph = graphs.nth(index);
      const box = await graph.boundingBox();
      if (!box || box.width < 200 || box.height < 120) continue;
      await graph.scrollIntoViewIfNeeded();
      const chartShot = path.join(runId, `${id}-chart-detail.png`).replaceAll("\\", "/");
      await page.screenshot({ path: path.join(evidence, chartShot), fullPage: false });
      const labels = await graph.evaluate((svg) => [...svg.querySelectorAll("text")].map((label) => {
        const style = getComputedStyle(label);
        const chain = [];
        for (let cursor = label; cursor; cursor = cursor.parentElement) {
          const s = getComputedStyle(cursor);
          if (s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.opacity !== "1" || s.backgroundImage !== "none") chain.push({ element: cursor.tagName, className: cursor.getAttribute("class"), background: s.backgroundColor, backgroundImage: s.backgroundImage, opacity: s.opacity });
        }
        return { text: label.textContent, fill: style.fill, color: style.color, fillOpacity: style.fillOpacity, opacity: style.opacity, fontSize: style.fontSize, fontWeight: style.fontWeight, bounds: label.getBoundingClientRect().toJSON(), ancestorPaint: chain };
      }));
      const detail = { id, screenshot: chartShot, graphIndex: index, note: "SVG labels are not included in HTML contrast PASS. Ancestor paint does not prove no graph geometry lies behind a label; inspect chart screenshot for ordinary axis/label backing before calculating a ratio.", labels };
      report.chartEvidence.push(detail);
      await writeFile(path.join(directory, `${id}-chart-labels.json`), JSON.stringify(detail, null, 2));
      break;
    }
  }
  await save();
  console.log(`${id}: shell overflow=${metrics.overflow.pass}, contrast=${metrics.contrast.status}; frames=${frameMetrics.map((f) => `${f.url}:${f.overflow.pass}/${f.contrast.status}`).join(",")}`);
}

async function scenario(name, run) {
  const item = { name, status: "RUNNING" };
  report.scenarios.push(item);
  try { await run(); item.status = "PASS"; }
  catch (error) { item.status = "FAIL"; item.error = error.stack ?? String(error); console.error(name, error.message); }
  await save();
}

try {
  for (const scheme of ["light", "dark"]) await scenario(`desktop ${scheme}`, async () => {
    const { page, context } = await session(undefined, scheme);
    try {
      if (!legacyOnly) { await visit(page, "/login"); await capture(page, `login-${scheme}-1440`); }
      await login(page);
      if (!legacyOnly) {
        await capture(page, `dashboard-${scheme}-1440`);
        await page.getByRole("button", { name: "编辑首页", exact: true }).click();
        await capture(page, `dashboard-edit-${scheme}-1440`);
        await page.getByRole("button", { name: "取消", exact: true }).click();
      }
      for (const route of legacyOnly ? legacyRoutes : allRoutes) {
        await visit(page, route); await capture(page, `${route.slice(1)}-${scheme}-1440`);
      }
    } finally { await context.close(); }
  });
  await scenario("compact desktop 1280", async () => {
    const { page, context } = await session({ width: 1280, height: 800 });
    try {
      await login(page); if (!legacyOnly) await capture(page, "dashboard-light-1280");
      for (const route of ["/kol", "/third-party"]) { await visit(page, route); await capture(page, `${route.slice(1)}-light-1280`); }
    } finally { await context.close(); }
  });
  for (const width of [390, 320]) await scenario(`narrow viewport ${width}`, async () => {
    const { page, context } = await session({ width, height: width === 390 ? 844 : 800 });
    try {
      if (!legacyOnly) { await visit(page, "/login"); await capture(page, `login-light-${width}`); }
      await login(page);
      if (!legacyOnly) {
        await capture(page, `dashboard-light-${width}`);
        await page.getByRole("button", { name: "打开导航" }).click();
        await capture(page, `navigation-light-${width}`);
        await page.keyboard.press("Escape");
      }
      for (const route of legacyOnly ? legacyRoutes : allRoutes) {
        await visit(page, route); await capture(page, `${route.slice(1)}-light-${width}`);
      }
    } finally { await context.close(); }
  });
  await scenario("200 percent text plus user spacing", async () => {
    const { page, context } = await session({ width: 1280, height: 800 });
    try {
      if (!legacyOnly) { await visit(page, "/login", true); await capture(page, "login-text-200-spacing-1280"); }
      await login(page);
      for (const route of legacyOnly ? legacyRoutes : ["/dashboard", ...allRoutes]) {
        await visit(page, route, true); await capture(page, `${route.slice(1)}-text-200-spacing-1280`);
      }
    } finally { await context.close(); }
  });
  await scenario("reduced motion and keyboard search", async () => {
    const { page, context } = await session({ width: 390, height: 844 }, "light", "reduce");
    try {
      await login(page);
      if (!legacyOnly) {
        await page.getByRole("button", { name: "搜索页面", exact: true }).click();
        await page.getByRole("combobox", { name: "搜索页面", exact: true }).fill("联动创意跨板块协作数据".repeat(15));
        await capture(page, "search-long-reduced-motion-390");
        await page.keyboard.press("Escape");
        await expect(page.getByRole("button", { name: "搜索页面", exact: true })).toBeFocused();
      }
      for (const route of ["/kol", "/third-party"]) {
        await visit(page, route);
        const child = page.frames().find((f) => /\/legacy\//.test(f.url()));
        await expect.poll(() => child.evaluate(() => document.documentElement.dataset.motion)).toBe("reduce");
        const animations = await child.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
        expect(animations).toBe(0);
        await capture(page, `${route.slice(1)}-reduced-motion-390`);
      }
    } finally { await context.close(); }
  });
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  const all = report.captures.flatMap((c) => [{ id: c.id, ...c }, ...c.frames.map((f) => ({ id: `${c.id}:${f.url}`, ...f }))]);
  report.summary = {
    captures: report.captures.length,
    scenarioFailures: report.scenarios.filter((s) => s.status !== "PASS"),
    overflowFailures: all.filter((c) => !c.overflow.pass).map((c) => ({ id: c.id, overflow: c.overflow })),
    contrastFailures: all.filter((c) => c.contrast.status === "FAIL").map((c) => ({ id: c.id, failures: c.contrast.failures })),
    contrastNeedsManual: all.filter((c) => c.contrast.status === "NEEDS_MANUAL").map((c) => ({ id: c.id, unsupported: c.contrast.unsupported })),
    pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length, externalRequests: report.externalRequests.length,
  };
  const fail = report.summary.scenarioFailures.length || report.summary.overflowFailures.length || report.summary.contrastFailures.length || report.summary.pageErrors || report.summary.consoleErrors || report.summary.externalRequests;
  report.status = fail ? "FAIL" : report.summary.contrastNeedsManual.length ? "NEEDS_MANUAL" : "PASS";
  await save();
  await writeFile(path.join(evidence, legacyOnly ? "visual-legacy-results.json" : "visual-results.json"), JSON.stringify(report, null, 2));
  if (legacyOnly && report.status === "PASS" && report.captures.length === 14) {
    const original = JSON.parse(await readFile(path.join(evidence, "visual-results.json"), "utf8"));
    const replacements = new Map(report.captures.map((capture) => [capture.id, capture]));
    const merged = {
      ...original,
      scope: `Composed evidence: unchanged shell and four new boards retain full run ${original.runId}; only the 14 affected legacy workspace captures and their bridge/layout probes were rerun after legacy-only corrections. This is not a claim that all 55 screenshots were recaptured together.`,
      runMode: "composed",
      sourceReports: [`${original.runId}/results.json`, `${report.runId}/results.json`],
      captures: original.captures.map((capture) => replacements.get(capture.id) ?? capture),
      chartEvidence: report.chartEvidence,
      targetedRevisions: [{ runId: report.runId, changedScope: "legacy adaptation and generated resources", replacedCaptureIds: [...replacements.keys()] }],
    };
    const mergedMeasurements = merged.captures.flatMap((c) => [c, ...c.frames]);
    merged.summary = {
      captures: merged.captures.length,
      scenarioFailures: [...original.summary.scenarioFailures, ...report.summary.scenarioFailures],
      overflowFailures: mergedMeasurements.filter((c) => !c.overflow.pass),
      contrastFailures: mergedMeasurements.filter((c) => c.contrast.status === "FAIL"),
      contrastNeedsManual: mergedMeasurements.filter((c) => c.contrast.status === "NEEDS_MANUAL"),
      pageErrors: original.summary.pageErrors + report.summary.pageErrors,
      consoleErrors: original.summary.consoleErrors + report.summary.consoleErrors,
      externalRequests: original.summary.externalRequests + report.summary.externalRequests,
    };
    const problems = merged.summary.scenarioFailures.length + merged.summary.overflowFailures.length + merged.summary.contrastFailures.length + merged.summary.pageErrors + merged.summary.consoleErrors + merged.summary.externalRequests;
    merged.status = problems ? "FAIL" : merged.summary.contrastNeedsManual.length ? "NEEDS_MANUAL" : "PASS";
    await writeFile(path.join(evidence, "visual-final-results.json"), JSON.stringify(merged, null, 2));
  }
  console.log(JSON.stringify({ status: report.status, runId, captures: report.summary.captures, scenariosFailed: report.summary.scenarioFailures.length, overflowFailures: report.summary.overflowFailures.map((f) => f.id), contrastFailures: report.summary.contrastFailures.map((f) => ({ id: f.id, count: f.failures.length })), contrastNeedsManual: report.summary.contrastNeedsManual.map((f) => ({ id: f.id, count: f.unsupported.length })), pageErrors: report.summary.pageErrors, consoleErrors: report.summary.consoleErrors, externalRequests: report.summary.externalRequests }, null, 2));
  if (fail) process.exitCode = 1;
}
