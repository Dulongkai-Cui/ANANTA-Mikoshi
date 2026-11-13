// 临时视觉检查：node tests/visual/shot.mjs <path> <out.png> [width] [height] [scheme] [loginAs]
// 只连本地 127.0.0.1:3100；用于开发期检查，正式截图集由 capture.mjs 生成。
import { chromium } from "@playwright/test";

const [path = "/login", out = "shot.png", w = "1440", h = "900", scheme = "light", loginAs = ""] = process.argv.slice(2);
const base = process.env.MIKOSHI_URL ?? "http://127.0.0.1:3100";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, colorScheme: scheme, locale: "zh-CN" });
if (loginAs) {
  await page.goto(`${base}/login`);
  await page.getByRole("button", { name: `填入演示账号：${loginAs}` }).click();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await page.waitForURL("**/dashboard");
}
await page.goto(`${base}${path}`);
await page.waitForLoadState("networkidle");
// 工作台 iframe：等原系统渲染出页面标题
const frame = page.frameLocator("iframe:not([hidden])");
if (/^\/(kol|third-party)/.test(path)) await frame.locator("h1").first().waitFor({ timeout: 60_000 }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved", out);
