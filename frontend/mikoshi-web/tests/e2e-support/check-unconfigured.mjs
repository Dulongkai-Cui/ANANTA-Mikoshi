/**
 * Explicit production-mode check, deliberately outside tests/e2e.
 * Prerequisite: build with NEXT_PUBLIC_MIKOSHI_AUTH_MODE=production, then start on a separate port.
 * This script never builds, starts, stops, or changes the application.
 */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.MIKOSHI_UNCONFIGURED_PORT ?? 3109);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid local verification port");
const baseURL = `http://127.0.0.1:${port}`;
const appRoot = fileURLToPath(new URL("../../", import.meta.url));
const evidenceDir = path.resolve(appRoot, "../../SBS/evidence/SBS-0007/implementation");
const screenshotsDir = path.join(evidenceDir, "unconfigured-mode");
await mkdir(screenshotsDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1440, height: 900 },
  locale: "zh-CN",
  timezoneId: "Asia/Shanghai",
  colorScheme: "light",
});
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && /hydration|Minified React error/i.test(message.text())) runtimeErrors.push(message.text());
});

const report = {
  startedAt: new Date().toISOString(),
  baseURL,
  browser: { name: "Chromium", version: browser.version() },
  node: process.version,
  scope: "Actual local production build with unconfigured identity adapter; no real authentication service or deployment",
  checks: [],
  screenshots: [],
  runtimeErrors,
  passed: false,
};

async function check(name, action) {
  try {
    await action();
    report.checks.push({ name, result: "PASS" });
  } catch (error) {
    report.checks.push({ name, result: "FAIL", error: String(error) });
    throw error;
  }
}

async function screenshot(name) {
  const filename = `${name}.png`;
  await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: true });
  report.screenshots.push(`unconfigured-mode/${filename}`);
}

try {
  await check("Production login clearly reports unconfigured service and exposes no demo entry", async () => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible();
    await expect(page.getByText("正式模式：身份服务未配置", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^填入演示账号：/ })).toHaveCount(0);
    await expect(page.getByText("本地演示，请使用演示账号", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "登录", exact: true })).toBeDisabled();
    await expect(page.getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(0);
  });
  await screenshot("login-unconfigured");

  await check("Entering public demo credentials cannot establish a session, including direct form submission", async () => {
    // Public fictional fixture only; never reads credentials from user files.
    await page.getByLabel("邮箱", { exact: true }).fill("linxu@mikoshi-demo.invalid");
    await page.getByLabel("密码", { exact: true }).fill("mikoshi-demo");
    await page.getByLabel("密码", { exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "登录", exact: true })).toBeDisabled();
    await expect(page).toHaveURL(`${baseURL}/login`);
    // Exercise adapter failure even if an integration invokes the form handler.
    await page.locator("form").evaluate((form) => form.requestSubmit());
    await expect(page.getByText("正式身份服务尚未接入", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(`${baseURL}/login`);
    expect(await page.evaluate(() => sessionStorage.getItem("mikoshi.session"))).toBeNull();
    await expect(page.getByRole("button", { name: /^账户菜单：/ })).toHaveCount(0);
  });
  await screenshot("demo-credentials-rejected");

  for (const route of ["/dashboard", "/third-party", "/kol", "/collaborations", "/creative", "/vpc", "/business", "/settings"]) {
    await check(`Protected deep link ${route} returns to login without business UI`, async () => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
      await expect(page.getByRole("heading", { name: "登录 Mikoshi" })).toBeVisible();
      await expect(page.getByText("正式模式：身份服务未配置", { exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^账户菜单：/ })).toHaveCount(0);
      await expect(page.locator("[data-widget]")).toHaveCount(0);
      expect(await page.evaluate(() => sessionStorage.getItem("mikoshi.session"))).toBeNull();
    });
  }
  await screenshot("deep-link-unconfigured");

  await check("A forged local demo session does not activate the unconfigured production adapter", async () => {
    await page.evaluate(() => sessionStorage.setItem("mikoshi.session", JSON.stringify({ version: 1, mode: "demo", userId: "demo-u-linxu" })));
    await page.goto("/business");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.getByText("正式模式：身份服务未配置", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "主导航", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^账户菜单：/ })).toHaveCount(0);
    await page.evaluate(() => sessionStorage.removeItem("mikoshi.session"));
  });

  await check("No uncaught runtime or hydration errors", async () => expect(runtimeErrors).toEqual([]));
  report.passed = true;
} catch (error) {
  report.failure = String(error);
  process.exitCode = 1;
  await screenshot("failure").catch(() => {});
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(evidenceDir, "unconfigured-mode.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, baseURL, evidence: "SBS/evidence/SBS-0007/implementation/unconfigured-mode.json" }));
}
