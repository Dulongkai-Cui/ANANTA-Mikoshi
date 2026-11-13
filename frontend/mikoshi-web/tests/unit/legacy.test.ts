import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { afterEach, describe, expect, it } from "vitest";

import { decodeLegacyMemory, legacyHref, legacyMemoryKey, legacyPageFromHash } from "@/features/legacy/navigation";
import { assignmentJson, compileBridge, inject, outputsValid, recordSummary, scalableFonts, scriptJson, sha256 } from "../../scripts/sync-legacy.mjs";

describe("legacy navigation boundaries", () => {
  it("falls back from retired saved views without dropping the third-party view", () => {
    expect(decodeLegacyMemory('{"kol":"creators","thirdparty":"sources"}')).toEqual({ kol: "home", thirdparty: "sources" });
    expect(legacyHref("kol", "creators")).toBe("/kol#home");
  });
  it("scopes view memory to the current identity", () => {
    expect(legacyMemoryKey("demo-linxu")).not.toBe(legacyMemoryKey("demo-xucheng"));
  });
  it.each([null, "null", "[]", "broken", "7", '{"kol":"javascript:bad","thirdparty":"creators"}'])("rejects malformed/stale memory %s", (value) => {
    expect(decodeLegacyMemory(value)).toEqual({ kol: "home", thirdparty: "home" });
  });
  it("restores each module's own registered subpage", () => {
    expect(decodeLegacyMemory('{"kol":"overview","thirdparty":"pivot"}')).toEqual({ kol: "overview", thirdparty: "pivot" });
    expect(legacyPageFromHash("kol", "#overview")).toBe("overview");
    expect(legacyPageFromHash("kol", "#pivot")).toBeNull();
    expect(legacyPageFromHash("kol", "#%63reators")).toBeNull();
    expect(legacyHref("thirdparty", "finance")).toBe("/third-party#finance");
    expect(legacyHref("kol", "//external.invalid")).toBe("/kol#home");
  });
});

describe("deterministic legacy generation", () => {
  const temporary: string[] = [];
  afterEach(async () => { for (const dir of temporary.splice(0)) await rm(dir, { recursive: true, force: true }); });
  it("extracts nested JSON without being fooled by braces or escaped quotes inside strings", () => {
    const data = { nested: [{ text: 'a };\n text "quoted" \\ end', value: 4 }] };
    expect(assignmentJson(`const DATA=${JSON.stringify(data)};\nfunction render(){}`, "const DATA=")).toEqual(data);
    expect(() => assignmentJson("const DATA={", "const DATA=")).toThrow("Unterminated");
    expect(() => assignmentJson("const OTHER={}", "const DATA=")).toThrow("Missing");
  });
  it("fails closed on missing or incomplete embedded documents", () => {
    expect(scriptJson('<script id="x" type="application/json">{"a":1}</script>', "x")).toEqual({ a: 1 });
    expect(() => scriptJson('<script id="x" type="application/json">{}', "x")).toThrow();
    expect(() => scriptJson("", "x")).toThrow();
    expect(() => inject("<head></head>", "", "", "")).toThrow();
  });
  it("installs the policy/bootstrap before any original script without replacement metacharacter corruption", () => {
    const result = inject("<html><head><script>old()</script></head><body>data</body></html>", "POLICY$&", "STYLE", "BRIDGE");
    expect(result).toBe("<html><head>POLICY$&<script>old()</script>STYLE</head><body>dataBRIDGE</body></html>");
  });
  it("scales presentation font sizes without editing source records or numeric data", () => {
    const result = scalableFonts('<style>body{font:14px/1.6 Arial}h1{font-size:24px}small{font-size:9px}</style><script>const DATA={"note":"font-size:9px"}</script>');
    expect(result).toContain("font:0.875rem/1.6");
    expect(result).toContain("font-size:1.5rem");
    expect(result).toContain("font-size:0.75rem");
    expect(result).toContain('"note":"font-size:9px"');
  });
  it("counts explicit zero as known, missing fields separately, and excludes missing identities", () => {
    const result = recordSummary([{ user: "a", view: 0 }, { user: "a", view: 12 }, { user: "b", view: null }, { view: "4" }], (record) => record.user);
    expect(result).toEqual({ works: 4, identities: 2, views: 12, knownViewRecords: 2, missingViews: 2 });
  });
  it("invalidates changed bridge/style inputs, missing outputs, and same-size corrupt outputs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "mikoshi-legacy-test-")); temporary.push(dir);
    const inputs = { source: "hash", bridge: "v1" };
    const outputs: Record<string, { bytes: number; sha256: string }> = {};
    for (const name of ["kol.html", "thirdparty.html", "summary.json", "thirdparty-catalog.json"]) {
      await writeFile(path.join(dir, name), "abcd");
      outputs[name] = { bytes: 4, sha256: sha256("abcd") };
    }
    const manifest = { version: 2, inputs, outputs };
    expect(await outputsValid(dir, manifest, inputs)).toBe(true);
    expect(await outputsValid(dir, manifest, { ...inputs, bridge: "v2" })).toBe(false);
    await writeFile(path.join(dir, "thirdparty-catalog.json"), "wxyz");
    expect(await outputsValid(dir, manifest, inputs)).toBe(false);
    await writeFile(path.join(dir, "thirdparty-catalog.json"), "abcd");
    await writeFile(path.join(dir, "thirdparty.html"), "wxyz");
    expect(await outputsValid(dir, manifest, inputs)).toBe(false);
    await writeFile(path.join(dir, "thirdparty.html"), "abcd");
    await rm(path.join(dir, "summary.json"));
    expect(await outputsValid(dir, manifest, inputs)).toBe(false);
  });
});

describe("early iframe storage/network bootstrap", () => {
  it("normalizes retired internal KOL navigation before rendering and removes its links", async () => {
    const template = await readFile(new URL("../../scripts/legacy-bridge.js", import.meta.url), "utf8");
    const removed: string[] = [], rendered: string[] = [];
    const context = {
      state: { page: "home" },
      document: { documentElement: {}, addEventListener() {}, querySelectorAll(selector: string) { return selector === '[data-action="nav"]' ? ["overview", "quality", "creators"].map((value) => ({ dataset: { value }, remove() { removed.push(value); } })) : []; } },
      window: { addEventListener() {} }, location: { origin: "https://mikoshi.test" }, parent: { postMessage() {} }, history: { replaceState() {} }, queueMicrotask() {},
      render() { rendered.push(context.state.page); },
    };
    vm.runInNewContext(compileBridge(template, "kol", ["home", "overview"]), context);
    context.state.page = "quality"; context.render();
    expect(rendered).toEqual(["home"]);
    expect(removed).toContain("quality"); expect(removed).toContain("creators"); expect(removed).not.toContain("overview");
    context.state.page = "overview"; context.render(); expect(rendered.at(-1)).toBe("overview");
  });
  it("executes the real compiled bridge even when token names also appear in comments", async () => {
    const template = await readFile(new URL("../../scripts/legacy-bridge.js", import.meta.url), "utf8");
    const bridge = compileBridge(template, "kol", ["home", "creators"]);
    expect(bridge).not.toMatch(/__PAGES__|__MODULE__/);
    const messages: unknown[] = [];
    vm.runInNewContext(bridge, {
      document: { documentElement: {}, querySelectorAll: () => [], addEventListener: () => {} },
      window: { addEventListener: () => {} },
      location: { origin: "http://127.0.0.1:3108" },
      parent: { postMessage: (message: unknown) => messages.push(message) },
      history: { replaceState: () => {} },
      state: { page: "home" },
    });
    expect(messages).toEqual([{ type: "state", page: "home", channel: "mikoshi-legacy-v1", module: "kol" }]);
  });

  it("isolates legacy storage before source scripts run and never writes original keys", async () => {
    const source = (await readFile(new URL("../../scripts/legacy-bootstrap.js", import.meta.url), "utf8")).replaceAll("__MODULE__", "thirdparty");
    const store = new Map<string, string>([["ananta-thirdparty-pivot-v1", "original"]]);
    const native = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    };
    function boot(user: string) {
      const window = { localStorage: native, fetch: () => Promise.resolve() };
      const document = { documentElement: { dataset: {}, style: {} } };
      vm.runInNewContext(source, { window, document, URLSearchParams, location: { search: `?user=${user}&theme=dark&font=32&motion=reduce` } });
      return { window, document };
    }
    const a = boot("demo-a"), b = boot("demo-b");
    expect(a.window.localStorage.getItem("ananta-thirdparty-pivot-v1")).toBeNull();
    a.window.localStorage.setItem("ananta-thirdparty-pivot-v1", "A");
    expect(b.window.localStorage.getItem("ananta-thirdparty-pivot-v1")).toBeNull();
    expect(boot("demo-a").window.localStorage.getItem("ananta-thirdparty-pivot-v1")).toBe("A");
    expect(store.get("ananta-thirdparty-pivot-v1")).toBe("original");
    await expect(a.window.fetch()).rejects.toThrow("尚未接入");
    expect(a.document.documentElement.dataset).toMatchObject({ theme: "dark", motion: "reduce" });
    expect(a.document.documentElement.style).toMatchObject({ fontSize: "32px" });
  });
});
