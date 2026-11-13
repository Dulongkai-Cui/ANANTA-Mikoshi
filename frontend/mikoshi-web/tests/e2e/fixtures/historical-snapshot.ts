// Explicit historical fixture: generate outside public, route only these test pages.
// Normal initialization tests must never call this helper.
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { Page } from "@playwright/test";
import type { Catalog } from "../../../src/features/third-party/model";

const appRoot = path.resolve(__dirname, "../../..");
const outputDirectory = path.resolve(appRoot, "../../.local/sbs-0013-e2e-snapshot");
let prepared: Promise<unknown> | undefined;

async function snapshotDirectory() {
  // Keep the native ESM generator in Node; Playwright transforms test modules as CJS.
  prepared ??= promisify(execFile)(process.execPath, ["--input-type=module", "--eval",
    'import { syncLegacy } from "./scripts/sync-legacy.mjs"; await syncLegacy({thirdpartyMode:"snapshot",kolMode:"snapshot",outputDirectory:process.argv[1]});', outputDirectory], { cwd: appRoot, windowsHide: true });
  await prepared;
  return outputDirectory;
}

export async function installHistoricalSnapshot(page: Page): Promise<Catalog> {
  const directory = await snapshotDirectory();
  const files = new Set(["thirdparty.html", "kol.html", "thirdparty-catalog.json", "summary.json"]);
  await page.route("**/legacy/*", async route => {
    const name = path.posix.basename(new URL(route.request().url()).pathname);
    if (!files.has(name)) return route.continue();
    return route.fulfill({ path: path.join(directory, name), contentType: name.endsWith(".html") ? "text/html; charset=utf-8" : "application/json" });
  });
  return JSON.parse(await readFile(path.join(directory, "thirdparty-catalog.json"), "utf8")) as Catalog;
}

export async function readBrowserCatalog(page: Page): Promise<Catalog> {
  return page.evaluate(async () => {
    const response = await fetch("/legacy/thirdparty-catalog.json");
    if (!response.ok) throw new Error("Catalog response failed");
    return response.json();
  });
}
