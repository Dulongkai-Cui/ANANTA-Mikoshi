/**
 * SBS-0007 visual verification against a running local application.
 * MIKOSHI_URL=http://127.0.0.1:3108 node tests/visual/capture.mjs
 * Uses real UI actions and user text-spacing overrides; no fixture DOM replacement.
 */
import { chromium, expect } from "@playwright/test";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../../", import.meta.url));
const evidence = path.resolve(appRoot, "../../SBS/evidence/SBS-0007/implementation");
const screenshots = path.join(evidence, "screenshots");
const settingsOnly = process.argv.includes("--settings-only");
const reportFile = path.join(evidence, settingsOnly ? "visual-settings-results.json" : "visual-results.json");
const previousReport = settingsOnly ? JSON.parse(await readFile(path.join(evidence, "visual-results.json"), "utf8")) : null;
const base = process.env.MIKOSHI_URL ?? "http://127.0.0.1:3108";
const target = new URL(base);
if (!["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)) {
  throw new Error("This acceptance script only operates a local application.");
}
await mkdir(screenshots, { recursive: true });
if (settingsOnly) {
  const archiveName = `before-settings-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const archive = path.join(screenshots, archiveName);
  await mkdir(archive, { recursive: true });
  await copyFile(path.join(evidence, "visual-results.json"), path.join(evidence, `${archiveName}.json`));
  for (const id of ["settings-light-1440", "settings-dark-1440", "settings-light-390", "settings-light-320", "settings-text-200-spacing-1280"]) {
    await copyFile(path.join(screenshots, `${id}.png`), path.join(archive, `${id}.png`));
  }
}
const report = {
  startedAt: new Date().toISOString(), baseUrl: target.origin,
  scope: "Local demo frontend; computed rendered text contrast, screenshots and functional layout probes. No real authentication/backend or user aesthetic approval claimed.",
  contrastMethod: "CSS colors parsed by the browser canvas, alpha/background/ancestor opacity composited in sRGB; raw WCAG ratios compared to 4.5 or 3 for large text. Unsupported paint effects are NEEDS_MANUAL. Disabled text and clipped assistive-only text are excluded explicitly.",
  scenarios: [], captures: [], consoleErrors: [], pageErrors: [], externalRequests: [],
  runMode: settingsOnly ? "settings-only" : "full",
};
let browser;
let interrupted;
report.status = "IN_PROGRESS";
const checkpoint = () => writeFile(reportFile, JSON.stringify(report, null, 2) + "\n", "utf8");
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    interrupted = signal;
    report.interrupted = signal;
    // Closing only this script's browser unblocks pending actions; outer finally saves results.
    void browser?.close();
  });
}

async function newPage(viewport = { width: 1440, height: 900 }, scheme = "light", reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, colorScheme: scheme, reducedMotion, locale: "zh-CN", timezoneId: "Asia/Shanghai", deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ page: page.url(), text: message.text() });
  });
  page.on("pageerror", (error) => report.pageErrors.push({ page: page.url(), message: error.message }));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== target.origin) {
      report.externalRequests.push({ page: page.url(), url: request.url(), method: request.method() });
    }
  });
  return { context, page };
}

async function ready(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  // Let short UI transitions finish before recording their stable text colors.
  await page.waitForTimeout(260);
}

async function login(page) {
  await page.goto(`${base}/login`);
  await page.getByRole("button", { name: "填入演示账号：林序" }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("button", { name: "编辑首页", exact: true })).toBeVisible();
  await ready(page);
}

/** Runs inside Chromium, using rendered elements rather than a token-only palette. */
function inspectRenderedPage() {
  const width = document.documentElement.clientWidth;
  const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const styles = new Map();
  const style = (el) => styles.get(el) ?? (styles.set(el, getComputedStyle(el)), styles.get(el));
  const colorCache = new Map();
  function color(css) {
    if (colorCache.has(css)) return colorCache.get(css);
    if (!ctx || !CSS.supports("color", css)) return null;
    // A rejected Canvas color leaves fillStyle unchanged: two sentinels detect that.
    ctx.fillStyle = "#010203"; ctx.fillStyle = css; const first = ctx.fillStyle;
    ctx.fillStyle = "#fdfcfb"; ctx.fillStyle = css; const second = ctx.fillStyle;
    if (first !== second) return null;
    ctx.clearRect(0, 0, 1, 1); ctx.fillRect(0, 0, 1, 1);
    const pixels = ctx.getImageData(0, 0, 1, 1).data;
    const result = [pixels[0] / 255, pixels[1] / 255, pixels[2] / 255, pixels[3] / 255];
    colorCache.set(css, result);
    return result;
  }
  function over(front, back) {
    const alpha = front[3] + back[3] * (1 - front[3]);
    if (alpha === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / alpha).concat(alpha);
  }
  const luminance = (c) => c.slice(0, 3).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const rgb = (c) => c.slice(0, 3).map((v) => Math.round(v * 255));
  const selector = (el) => el.id ? `${el.tagName.toLowerCase()}#${el.id}` : `${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[role=${el.getAttribute("role")}]` : ""}.${[...el.classList].slice(0, 4).join(".")}`;
  function visible(el) {
    if (!el.getClientRects().length) return false;
    for (let node = el; node; node = node.parentElement) {
      const s = style(node);
      if (s.display === "none" || s.visibility !== "visible" || Number(s.opacity) === 0 || node.hidden) return false;
      // Only visually clipped assistive text is excluded; aria-hidden hints may still be visible.
      if ((s.clip !== "auto" && s.clip !== "rect(auto, auto, auto, auto)") || s.clipPath === "inset(50%)") return false;
    }
    return true;
  }
  const pairs = [];
  const unsupported = [];
  const exclusions = { disabled: 0, hiddenOrClipped: 0, inactiveModalUnderlay: 0 };
  const modal = document.querySelector('[role="dialog"][data-state="open"]');
  function inspectText(el, text, pseudo) {
    if (!text.trim()) return;
    // Scrim paint is a sibling, not an ancestor. Do not claim an ancestor-only
    // contrast result for inactive content behind an open modal overlay.
    if (modal && !modal.contains(el)) { exclusions.inactiveModalUnderlay += 1; return; }
    if (!visible(el)) { exclusions.hiddenOrClipped += 1; return; }
    if (el.closest(":disabled, [aria-disabled=true]")) { exclusions.disabled += 1; return; }
    const ownStyle = pseudo ? getComputedStyle(el, pseudo) : style(el);
    const fill = ownStyle.webkitTextFillColor && ownStyle.webkitTextFillColor !== "currentcolor" ? ownStyle.webkitTextFillColor : ownStyle.color;
    let foreground = color(fill);
    let background = [0, 0, 0, 0];
    const problems = [];
    if (!foreground) problems.push(`unsupported text color: ${fill}`);
    let cursor = el;
    let opaqueBackgroundSeen = false;
    for (; cursor; cursor = cursor.parentElement) {
      const s = style(cursor);
      const paint = color(s.backgroundColor);
      if (!paint) problems.push(`unsupported background: ${s.backgroundColor}`);
      // An opaque descendant shields ancestor background images, but not ancestor filters.
      if (!opaqueBackgroundSeen && s.backgroundImage !== "none") problems.push(`background image at ${selector(cursor)}`);
      if (s.mixBlendMode !== "normal" || s.filter !== "none" || s.backdropFilter !== "none") problems.push(`filter or blend at ${selector(cursor)}`);
      if (s.textShadow !== "none" && cursor === el) problems.push("text shadow");
      if (paint) {
        foreground = foreground ? over(foreground, paint) : null;
        background = over(background, paint);
        const opacity = Number(s.opacity);
        if (foreground) foreground = [foreground[0], foreground[1], foreground[2], foreground[3] * opacity];
        background = [background[0], background[1], background[2], background[3] * opacity];
        if (background[3] === 1) opaqueBackgroundSeen = true;
      }
    }
    const info = { element: selector(el), text: text.trim().slice(0, 100), pseudo: pseudo ?? null, color: fill, fontSize: ownStyle.fontSize, fontWeight: ownStyle.fontWeight };
    if (problems.length || !foreground) { unsupported.push({ ...info, reasons: [...new Set(problems)] }); return; }
    foreground = over(foreground, [1, 1, 1, 1]);
    background = over(background, [1, 1, 1, 1]);
    const a = luminance(foreground); const b = luminance(background);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(ownStyle.fontSize); const weight = parseFloat(ownStyle.fontWeight);
    const required = size >= 24 || (size >= 18.6666667 && weight >= 700) ? 3 : 4.5;
    pairs.push({ ...info, foreground: rgb(foreground), background: rgb(background), ratio, required, pass: ratio >= required });
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "TITLE"].includes(el.tagName) || el.closest("svg")) continue;
    inspectText(el, node.textContent ?? "");
  }
  for (const el of document.querySelectorAll("input,textarea")) {
    if (el.value) inspectText(el, el.type === "password" ? "•••• (masked password)" : el.value);
    else if (el.placeholder) inspectText(el, el.placeholder, "::placeholder");
  }
  const failures = pairs.filter((pair) => !pair.pass);
  const overflowCandidates = [...document.querySelectorAll("body *")].filter((el) => visible(el)).map((el) => {
    const box = el.getBoundingClientRect();
    return { element: selector(el), text: (el.textContent ?? "").trim().slice(0, 60), left: box.left, right: box.right };
  }).filter((box) => box.right > width + 1 || box.left < -1).slice(0, 20);
  return {
    url: location.pathname,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
    theme: document.documentElement.dataset.theme ?? "system",
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    overflow: { width, scrollWidth, pass: scrollWidth <= width + 1, candidates: overflowCandidates },
    contrast: {
      status: failures.length ? "FAIL" : unsupported.length ? "NEEDS_MANUAL" : pairs.length ? "PASS" : "NOT_RUN",
      testedTextNodes: pairs.length, minRatio: pairs.length ? Math.min(...pairs.map((pair) => pair.ratio)) : null,
      exclusions, failures, unsupported, pairs,
    },
  };
}

async function capture(page, id, notes = "") {
  await ready(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  const file = `${id}.png`;
  const modalOpen = await page.locator('[role="dialog"][data-state="open"]').count() > 0;
  // Fixed scrims cover the viewport, not offscreen document content. Capture
  // overlays at the viewport size to avoid a misleading full-page composite.
  await page.screenshot({ path: path.join(screenshots, file), fullPage: !modalOpen });
  const metrics = await page.evaluate(inspectRenderedPage);
  const row = { id, capturedAt: new Date().toISOString(), screenshot: `screenshots/${file}`, screenshotMode: modalOpen ? "viewport" : "fullPage", viewport: page.viewportSize(), notes, ...metrics };
  report.captures.push(row);
  await checkpoint();
  console.log(`${id}: overflow=${metrics.overflow.pass ? "PASS" : "FAIL"}, text contrast=${metrics.contrast.status}, nodes=${metrics.contrast.testedTextNodes}`);
}

async function scenario(name, execute) {
  if (interrupted) throw new Error(`Visual run interrupted: ${interrupted}`);
  const item = { name, status: "RUNNING" };
  report.scenarios.push(item);
  try { await execute(item); item.status = "PASS"; }
  catch (error) { item.status = "FAIL"; item.error = error.stack ?? String(error); console.error(`${name}: ${error.message}`); }
  finally { await checkpoint(); }
}

try {
  await checkpoint();
  browser = await chromium.launch();
  report.browser = { name: "Chromium", version: browser.version(), headless: true };
  if (settingsOnly) {
    await scenario("targeted settings layout revision", async (result) => {
      const desktop = await newPage();
      try {
        await login(desktop.page);
        await desktop.page.goto(`${base}/settings`);
        await capture(desktop.page, "settings-light-1440", "Targeted settings Row revision; other page evidence retained from the full run.");
        await desktop.page.getByRole("radio", { name: "深色", exact: true }).click();
        await expect(desktop.page.locator("html")).toHaveAttribute("data-theme", "dark");
        await capture(desktop.page, "settings-dark-1440");
      } finally { await desktop.context.close(); }
      for (const width of [390, 320]) {
        const mobile = await newPage({ width, height: width === 390 ? 844 : 800 });
        try {
          await login(mobile.page);
          await mobile.page.goto(`${base}/settings`);
          await capture(mobile.page, `settings-light-${width}`);
        } finally { await mobile.context.close(); }
      }
      const enlarged = await newPage({ width: 1280, height: 800 });
      try {
        await login(enlarged.page);
        await enlarged.page.goto(`${base}/settings`);
        await enlarged.page.addStyleTag({ content: "html { font-size: 32px !important; } * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }" });
        await expect.poll(() => enlarged.page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
        await capture(enlarged.page, "settings-text-200-spacing-1280", "Targeted row wrapping fix at 200% root text plus WCAG user spacing.");
        result.themeDescription = await enlarged.page.getByText("跟随系统，当前为浅色", { exact: true }).evaluate((el) => ({
          text: el.textContent, width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height, fontSize: getComputedStyle(el).fontSize,
        }));
      } finally { await enlarged.context.close(); }
    });
  } else {
  await scenario("login light and invalid credentials", async () => {
    const { page, context } = await newPage();
    try {
      await page.goto(`${base}/login`);
      await expect(page.getByRole("button", { name: "填入演示账号：林序" })).toBeVisible();
      await capture(page, "login-light-1440");
      await page.getByRole("button", { name: "填入演示账号：林序" }).click();
      await page.getByLabel("密码", { exact: true }).fill("incorrect-demo-password");
      await page.getByRole("button", { name: "登录", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: "邮箱或密码不正确" })).toBeVisible();
      await capture(page, "login-error-light-1440");
    } finally { await context.close(); }
  });
  await scenario("login follows dark system theme", async () => {
    const { page, context } = await newPage({ width: 1440, height: 900 }, "dark");
    try { await page.goto(`${base}/login`); await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible(); await capture(page, "login-dark-1440"); }
    finally { await context.close(); }
  });
  await scenario("desktop shell, editing, business and settings", async () => {
    const { page, context } = await newPage();
    try {
      await login(page);
      await capture(page, "dashboard-light-1440");
      await page.getByRole("button", { name: "编辑首页", exact: true }).click();
      await expect(page.getByRole("button", { name: "保存布局", exact: true })).toBeVisible();
      await capture(page, "dashboard-edit-light-1440");
      await page.getByRole("button", { name: "取消", exact: true }).click();
      await page.goto(`${base}/third-party`);
      await expect(page.getByRole("heading", { name: "三方号", exact: true })).toBeVisible();
      await capture(page, "third-party-light-1440");
      await page.goto(`${base}/settings`);
      await capture(page, "settings-light-1440");
      await page.getByRole("radio", { name: "深色", exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await capture(page, "settings-dark-1440");
      await page.goto(`${base}/dashboard`);
      await capture(page, "dashboard-dark-1440");
      await page.getByRole("button", { name: "编辑首页", exact: true }).click();
      await capture(page, "dashboard-edit-dark-1440");
      await page.getByRole("button", { name: "取消", exact: true }).click();
    } finally { await context.close(); }
  });
  await scenario("compact desktop at 1280 by 800", async () => {
    const { page, context } = await newPage({ width: 1280, height: 800 });
    try { await login(page); await capture(page, "dashboard-light-1280"); }
    finally { await context.close(); }
  });
  for (const width of [390, 320]) {
    await scenario(`narrow screen ${width}px and navigation`, async () => {
      const { page, context } = await newPage({ width, height: width === 390 ? 844 : 800 });
      try {
        await page.goto(`${base}/login`);
        await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible();
        await capture(page, `login-light-${width}`);
        await login(page);
        await capture(page, `dashboard-light-${width}`);
        await page.getByRole("button", { name: "打开导航" }).click();
        await expect(page.getByRole("dialog", { name: "导航", exact: true })).toBeVisible();
        await capture(page, `navigation-light-${width}`);
        await page.getByRole("dialog").getByRole("link", { name: "个人设置", exact: true }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(page.getByRole("heading", { name: "个人设置", exact: true })).toBeVisible();
        await capture(page, `settings-light-${width}`);
      } finally { await context.close(); }
    });
  }
  await scenario("200 percent text and WCAG user text spacing", async (result) => {
    const { page, context } = await newPage({ width: 1280, height: 800 });
    const css = "html { font-size: 32px !important; } * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }";
    try {
      await page.goto(`${base}/login`);
      await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible();
      await page.addStyleTag({ content: css });
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
      await capture(page, "login-text-200-spacing-1280", "Root 32px; line-height 1.5, letter-spacing .12em, word-spacing .16em and paragraph spacing 2em. Real user stylesheet override.");
      await page.getByRole("button", { name: "填入演示账号：林序" }).click();
      await page.getByRole("button", { name: "登录", exact: true }).click();
      await page.waitForURL("**/dashboard");
      await expect(page.getByRole("button", { name: "编辑首页", exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("32px");
      await capture(page, "dashboard-text-200-spacing-1280");
      result.largeTextNavigation = await page.evaluate(() => {
        const aside = document.querySelector('aside[aria-label="侧栏"]');
        const bounds = aside.getBoundingClientRect();
        const names = [...aside.querySelectorAll("nav a")].map((link) => {
          const label = [...link.querySelectorAll("span")].find((span) => span.textContent.trim() === link.textContent.trim());
          return { text: link.textContent.trim(), clipped: !label || label.scrollWidth > label.clientWidth + 1 };
        });
        const brand = [...aside.querySelectorAll("span")].filter((span) => ["Mikoshi", "ANANTA"].includes(span.textContent.trim())).map((span) => {
          const rect = span.getBoundingClientRect();
          return { text: span.textContent.trim(), top: rect.top, left: rect.left, right: rect.right, clipped: rect.top < 0 || rect.left < bounds.left || rect.right > bounds.right };
        });
        return { names, brand, pass: names.every((name) => !name.clipped) && brand.length === 2 && brand.every((entry) => !entry.clipped) };
      });
      expect(result.largeTextNavigation.pass).toBe(true);
      await page.getByRole("button", { name: "编辑首页", exact: true }).click();
      await capture(page, "dashboard-edit-text-200-spacing-1280");
      await page.getByRole("button", { name: "取消", exact: true }).click();
      await page.goto(`${base}/settings`);
      await page.addStyleTag({ content: css });
      await capture(page, "settings-text-200-spacing-1280");
      result.userOverride = css;
      result.note = "CSS root text enlargement is tested; this is not a claim of operating-system display zoom coverage.";
    } finally { await context.close(); }
  });
  await scenario("long Chinese search input and reduced motion", async (result) => {
    const { page, context } = await newPage({ width: 390, height: 844 }, "light", "reduce");
    try {
      await login(page);
      await page.getByRole("button", { name: "搜索页面", exact: true }).click();
      await expect(page.getByRole("combobox", { name: "搜索页面" })).toBeVisible();
      result.activeAnimationsAfterOpen = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => ({
        playState: a.playState, duration: a.effect?.getTiming().duration,
        type: a.constructor.name,
        transitionProperty: "transitionProperty" in a ? a.transitionProperty : null,
        target: a.effect?.target instanceof Element ? `${a.effect.target.tagName}.${a.effect.target.className}` : null,
        keyframes: a.effect?.getKeyframes(),
      })));
      const longQuery = "联动创意资料跨板块协作尚未接入数据".repeat(10);
      await page.getByRole("combobox", { name: "搜索页面" }).fill(longQuery);
      await expect(page.getByRole("status").filter({ hasText: "没有名为" })).toBeVisible();
      await capture(page, "search-long-chinese-reduced-motion-390", "Typed through the real search input; no DOM text replacement.");
      await page.keyboard.press("Escape");
      for (let i = 0; i < 5; i += 1) {
        await page.getByRole("button", { name: "搜索页面", exact: true }).click();
        await expect(page.getByRole("combobox", { name: "搜索页面" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
      }
      await expect(page.getByRole("button", { name: "搜索页面", exact: true })).toBeFocused();
      await page.goto(`${base}/settings`);
      await expect(page.getByRole("switch", { name: "减少动效" })).toBeChecked();
      await expect(page.getByRole("switch", { name: "减少动效" })).toBeDisabled();
      await capture(page, "settings-reduced-motion-390");
      const colorOnly = new Set(["color", "background-color", "border-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color", "text-decoration-color", "fill", "stroke"]);
      result.disallowedMotion = result.activeAnimationsAfterOpen.filter((animation) => animation.type !== "CSSTransition" || !colorOnly.has(animation.transitionProperty));
      result.motionInterpretation = "SPEC reduces spatial movement and overlay animation. Immediate color-only hover feedback remains allowed; run1/run2 retained the original over-strict all-animations-zero assertion and its property diagnostics.";
      expect(result.disallowedMotion).toEqual([]);
    } finally { await context.close(); }
  });
  }
} catch (error) {
  report.fatalError = error.stack ?? String(error);
  console.error(error.message);
} finally {
  await browser?.close();
  report.finishedAt = new Date().toISOString();
  report.summary = {
    scenarios: report.scenarios.length,
    failedScenarios: report.scenarios.filter((s) => s.status !== "PASS").map((s) => s.name),
    captures: report.captures.length,
    horizontalOverflowFailures: report.captures.filter((c) => !c.overflow.pass).map((c) => c.id),
    textContrastFailures: report.captures.filter((c) => c.contrast.status === "FAIL").map((c) => ({ id: c.id, count: c.contrast.failures.length })),
    textContrastNeedsManual: report.captures.filter((c) => c.contrast.status === "NEEDS_MANUAL").map((c) => ({ id: c.id, count: c.contrast.unsupported.length })),
    consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length, externalRequests: report.externalRequests.length,
  };
  const failed = report.fatalError || report.interrupted || report.summary.failedScenarios.length || report.summary.horizontalOverflowFailures.length || report.summary.textContrastFailures.length || report.summary.pageErrors || report.summary.consoleErrors || report.summary.externalRequests;
  report.status = failed ? "FAIL" : report.summary.textContrastNeedsManual.length ? "NEEDS_MANUAL" : "PASS";
  await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n", "utf8");
  if (settingsOnly && previousReport) {
    const replacements = new Map(report.captures.map((capture) => [capture.id, capture]));
    const merged = {
      ...previousReport,
      captures: previousReport.captures.map((capture) => replacements.get(capture.id) ?? capture),
      targetedRevisions: [...(previousReport.targetedRevisions ?? []), {
        startedAt: report.startedAt, finishedAt: report.finishedAt, status: report.status,
        report: "visual-settings-results.json", captureIds: [...replacements.keys()],
        note: "Settings Row wrapping and session-storage explanatory text changed. Only the five listed settings captures were rerun; other screenshots and interaction results retain their original full-run evidence.",
      }],
      status: previousReport.status === "PASS" && report.status === "PASS" ? "PASS" : "FAIL",
    };
    merged.summary.horizontalOverflowFailures = merged.captures.filter((capture) => !capture.overflow.pass).map((capture) => capture.id);
    merged.summary.textContrastFailures = merged.captures.filter((capture) => capture.contrast.status === "FAIL").map((capture) => ({ id: capture.id, count: capture.contrast.failures.length }));
    merged.summary.textContrastNeedsManual = merged.captures.filter((capture) => capture.contrast.status === "NEEDS_MANUAL").map((capture) => ({ id: capture.id, count: capture.contrast.unsupported.length }));
    await writeFile(path.join(evidence, "visual-results.json"), JSON.stringify(merged, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify({ status: report.status, ...report.summary }, null, 2));
  if (failed) process.exitCode = 1;
}
