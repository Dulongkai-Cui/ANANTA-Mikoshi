/** SBS-0012: real-UI publication evidence, against an already-running local server. */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRenderedPage } from "./render-metrics.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const evidence = path.resolve(root, "../../SBS/evidence/SBS-0012");
const label = process.argv.find(argument => argument.startsWith("--label="))?.slice(8);
if (label && !/^[a-zA-Z0-9-]+$/.test(label)) throw new Error("Evidence label must contain only letters, numbers or hyphens");
const runId = `visual-${label ? `${label}-` : ""}${new Date().toISOString().replace(/[:.]/g, "-")}`;
const directory = path.join(evidence, runId);
await mkdir(directory, { recursive: true });
const base = process.env.MIKOSHI_URL ?? "http://127.0.0.1:3108";
const origin = new URL(base).origin;
const only = process.argv.find(argument => argument.startsWith("--only="))?.slice(7).split(",");
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) throw new Error("Local verification only");
const browser = await chromium.launch();
const report = {
  runId, base, browser: browser.version(), startedAt: new Date().toISOString(),
  scope: "Nine screenshots of SBS-0012 account intake, historical directory, plans, selected calendar detail, both editors, dark theme, narrow screens and 200% text. One isolated context; a clearly labelled acceptance account and two schedules are created through real UI. The local catalog is read only, historical metrics are never seeded or modified. HTML contrast excludes disabled controls, SVG and image pixels; screenshots require visual inspection.",
  requestedCaptures: only ?? "all", status: "RUNNING", captures: [], operations: [], pageErrors: [], consoleErrors: [], externalRequests: [],
};
const save = () => writeFile(path.join(directory, "results.json"), JSON.stringify(report, null, 2));
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", locale: "zh-CN", timezoneId: "Asia/Shanghai", deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
page.on("pageerror", error => report.pageErrors.push({ url: page.url(), message: error.message }));
page.on("console", message => { if (message.type() === "error") report.consoleErrors.push({ url: page.url(), text: message.text(), location: message.location() }); });
page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) report.externalRequests.push({ url: request.url(), page: page.url() }); });
const accountDialog = () => page.getByRole("dialog", { name: /^(账号入库|编辑账号资料)$/ });
const scheduleDialog = () => page.getByRole("dialog", { name: /^(新增发布排期|编辑发布排期)$/ });
const accountRow = name => page.getByRole("row").filter({ has: page.getByRole("button", { name, exact: true }) });
const manualName = "视觉验收账号 · 仅本机";
const manualTitle = "视觉验收 · 新账号角色短片";
const historicalTitle = "视觉验收 · 历史账号内容复核";
let date;

async function capture(id, fullPage = true) {
  if (only && !only.includes(id)) return;
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  // Dialog entrance and theme colour transitions must settle before measuring rendered text.
  await page.waitForTimeout(350);
  await page.mouse.move(0, 0);
  if (fullPage) {
    // A closing dialog restores focus and can scroll after its element has unmounted.
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  const metrics = await page.evaluate(inspectRenderedPage);
  const structure = await page.evaluate(() => ({
    url: location.pathname,
    theme: document.documentElement.className,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
    headings: [...document.querySelectorAll("main h1,main h2,[role=dialog] h2")].map(node => node.textContent),
    selectedDay: document.querySelector('[data-calendar-day][aria-pressed="true"]')?.getAttribute("data-calendar-day"),
    dayCount: document.querySelectorAll("[data-calendar-day]").length,
    detailText: document.querySelector('section[aria-label="排期详情"]')?.textContent,
    dialogs: [...document.querySelectorAll('[role="dialog"]')].map(node => ({ text: node.textContent, rect: node.getBoundingClientRect().toJSON(), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight })),
  }));
  await page.screenshot({ path: path.join(directory, `${id}.png`), fullPage });
  report.captures.push({ id, screenshot: `${runId}/${id}.png`, viewport: page.viewportSize(), ...metrics, structure });
  await save();
  console.log(`${id}: overflow=${metrics.overflow.pass} contrast=${metrics.contrast.status}`);
}

async function visit(route) {
  await page.goto(`${base}/third-party/${route}`);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "正在读取本机资料" })).toHaveCount(0);
}

async function createSchedule(name, title, time, content) {
  await accountRow(name).getByRole("button", { name: "安排发布", exact: true }).click();
  const dialog = scheduleDialog();
  await expect(dialog.getByLabel(/^发布账号/).locator("option:checked")).toContainText(name);
  await dialog.getByLabel(/^排期标题/).fill(title);
  await dialog.getByLabel(/^计划日期/).fill(date);
  await dialog.getByLabel(/^计划时间/).fill(time);
  await dialog.getByLabel(/^内容说明/).fill(content);
  await dialog.getByLabel("确认状态", { exact: true }).selectOption("confirmed");
  await dialog.getByLabel(/^备注/).fill("SBS-0012 视觉验收录入；仅本机保存，不代表发布或平台审核。");
  await dialog.getByRole("button", { name: "保存排期", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  report.operations.push({ action: "schedule-created-via-ui", account: name, title, date, time });
}

async function selectHistoricalDetail() {
  await expect(page.locator("[data-calendar-day]")).toHaveCount(42);
  await page.locator(`[data-calendar-day="${date}"]`).click();
  await page.locator('section[aria-label="当天排期"]').getByRole("button").filter({ hasText: historicalTitle }).click();
  await expect(page.locator('section[aria-label="排期详情"]')).toContainText(historicalTitle);
  await expect(page.locator('section[aria-label="排期详情"]')).toContainText("最近 3 条历史作品");
}

try {
  await page.goto(`${base}/third-party/accounts`);
  await page.getByRole("button", { name: "填入演示账号：林序", exact: true }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(`${base}/third-party/accounts`);
  await expect(page.getByRole("heading", { level: 1, name: "账号入库", exact: true })).toBeVisible();
  date = await page.evaluate(() => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const lastDay = new Date(Date.UTC(Number(parts.year), Number(parts.month), 0)).getUTCDate();
    return `${parts.year}-${parts.month}-${String(Math.min(Number(parts.day) + 1, lastDay)).padStart(2, "0")}`;
  });
  const catalogResponse = await page.request.get(`${base}/legacy/thirdparty-catalog.json`);
  expect(catalogResponse.ok()).toBe(true);
  const catalog = await catalogResponse.json();
  const historic = catalog.accounts.find(account => account.uid && account.works.length === 3 && account.suppliers.length);
  expect(historic).toBeTruthy();
  report.source = { sourceHash: catalog.sourceHash, historyAccountId: historic.id, historyName: historic.name, historyUid: historic.uid, historyWorks: historic.works, note: "Actual retained historical catalog, read only; links are not opened." };

  await page.getByRole("button", { name: "新增账号", exact: true }).click();
  const intake = accountDialog();
  await intake.getByLabel(/^B站 UID/).fill("9876543210999");
  await intake.getByLabel(/^账号昵称/).fill(manualName);
  await intake.getByLabel("归属标签", { exact: true }).selectOption("伏羲");
  for (const [label, value] of [["供应商", "视觉验收供应商（示例录入）"], ["供应商管理人员", "视觉验收负责人"], ["结算方式", "验收示例 · 按月核对"], ["账号类型", "角色短片"], ["账号人设", "世界探索与角色故事"], ["备注", "仅用于独立浏览器上下文的视觉验收。非真实运营账号。"]]) await intake.getByLabel(label, { exact: true }).fill(value);
  await intake.getByRole("button", { name: "保存账号", exact: true }).click();
  await expect(intake).toHaveCount(0);
  await expect(accountRow(manualName)).toBeVisible();
  report.operations.push({ action: "account-created-via-ui", name: manualName, uid: "9876543210999" });
  await createSchedule(manualName, manualTitle, "10:30", "视觉验收样例：核对角色短片脚本、封面与字幕。此计划只记录安排，播放指标应保持空白。");
  await capture("01-accounts-light-1440");
  await accountRow(manualName).getByRole("button", { name: "编辑资料", exact: true }).click();
  await capture("02-account-editor-light-1440", false);
  await accountDialog().getByRole("button", { name: "取消", exact: true }).click();
  await expect(accountDialog()).toHaveCount(0);

  await page.getByRole("button", { name: "历史账号目录", exact: true }).click();
  await page.getByLabel("搜索账号资料", { exact: true }).fill(historic.uid);
  await expect(accountRow(historic.name)).toBeVisible();
  await capture("03-history-directory-light-1440");
  await createSchedule(historic.name, historicalTitle, "18:30", "视觉验收样例：结合该账号真实历史快照复核内容方向；这些历史数据与本次排期分别记录。");

  await visit("plans");
  await expect(page.getByRole("region", { name: "排期表格，可横向滚动", exact: true }).getByRole("row")).toHaveCount(3);
  await capture("04-plans-light-1440");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await visit("calendar");
  await selectHistoricalDetail();
  await capture("05-calendar-detail-light-1920");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('section[aria-label="排期详情"]').getByRole("button", { name: `编辑排期：${historicalTitle}`, exact: true }).click();
  await capture("06-schedule-editor-light-390", false);
  await scheduleDialog().getByRole("button", { name: "取消", exact: true }).click();
  await expect(scheduleDialog()).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture("07-calendar-detail-light-320");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture("08-calendar-detail-dark-1440");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.addStyleTag({ content: "html { font-size:32px!important } * { line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important } p { margin-bottom:2em!important }" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture("09-calendar-detail-text200-spacing-1920");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("mikoshi:third-party:v1:demo-u-linxu")));
  expect(stored.accounts).toHaveLength(1);
  expect(stored.schedules).toHaveLength(2);
  report.localRecordCounts = { accounts: stored.accounts.length, schedules: stored.schedules.length, allWritesThroughUI: true };
  report.status = report.captures.every(item => item.overflow.pass && item.contrast.status === "PASS") && !report.pageErrors.length && !report.consoleErrors.length && !report.externalRequests.length ? "PASS" : "REVIEW_REQUIRED";
} catch (error) {
  report.status = "FAIL";
  report.error = error.stack ?? String(error);
  console.error(error);
  try { await page.screenshot({ path: path.join(directory, "failure.png"), fullPage: true }); } catch { /* Keep the original failure. */ }
} finally {
  report.finishedAt = new Date().toISOString();
  await save();
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ directory, status: report.status, captures: report.captures.length, pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length, externalRequests: report.externalRequests.length }));
  if (report.status === "FAIL") process.exitCode = 1;
}
