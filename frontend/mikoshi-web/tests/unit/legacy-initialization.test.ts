import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { kolDataMode, legacyDataMode, scriptJson, sha256, syncLegacy } from "../../scripts/sync-legacy.mjs";

describe("persistent third-party initialization policy", () => {
  it("defaults to the saved empty policy and only accepts an explicit supported historical mode", async () => {
    const policy: unknown = JSON.parse(await readFile(new URL("../../scripts/legacy-data-policy.json", import.meta.url), "utf8"));
    expect(legacyDataMode(policy)).toBe("empty");
    expect(legacyDataMode(policy, "snapshot")).toBe("snapshot");
    expect(() => legacyDataMode(null)).toThrow("policy");
    expect(() => legacyDataMode({ schema: 1, thirdparty: "fallback" })).toThrow("policy");
    expect(() => legacyDataMode(policy, "automatic")).toThrow("explicit");
    expect(kolDataMode(policy)).toBe("empty");
    expect(kolDataMode(policy, "snapshot")).toBe("snapshot");
    expect(() => kolDataMode({ schema: 1, thirdparty: "empty" })).toThrow("policy");
    expect(() => kolDataMode(policy, "automatic")).toThrow("explicit");
  });

  it("keeps isolated history testable, initializes both domains, and repairs outputs without reintroducing history", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "mikoshi-empty-generation-"));
    const read = (name: string) => readFile(path.join(directory, name), "utf8");
    try {
      // This explicit historical run writes only the isolated temporary directory.
      await syncLegacy({ outputDirectory: directory, thirdpartyMode: "snapshot", kolMode: "snapshot" });
      const historicalKol = sha256(await read("kol.html"));
      expect(JSON.parse(await read("summary.json")).kol).toMatchObject({ works: 65, creators: 46, views: 27283149 });
      const snapshot = scriptJson(await read("thirdparty.html"), "dashboard-data") as { profiles: unknown[]; records: unknown[] };
      expect(snapshot.profiles).toHaveLength(85);
      expect(snapshot.records).toHaveLength(374);
      expect(JSON.parse(await read("thirdparty-catalog.json")).accounts).toHaveLength(85);

      // The effective-mode cache key must invalidate the previous historical run.
      await syncLegacy({ outputDirectory: directory });
      const emptyHtml = await read("thirdparty.html");
      const emptyCatalog = await read("thirdparty-catalog.json");
      const emptySummary = await read("summary.json");
      const emptyKol = await read("kol.html");
      expect(sha256(emptyKol)).not.toBe(historicalKol);
      expect(emptyKol).not.toMatch(/const DATA=|BV[0-9A-Za-z]{10}|commentSeed|27283149/);
      expect(JSON.parse(emptySummary).kol).toMatchObject({ works: 0, creators: 0, views: 0, knownViewRecords: 0, missingViews: 0, snapshotAt: null });
      expect(JSON.parse(emptyCatalog)).toMatchObject({ schema: 1, accounts: [] });
      expect(JSON.parse(emptySummary).thirdParty).toMatchObject({ works: 0, accounts: 0, views: 0, knownViewRecords: 0, missingViews: 0, snapshotAt: null, range: { start: null, end: null } });
      expect(emptyHtml).not.toMatch(/dashboard-data|BV[0-9A-Za-z]{10}|2026-0[89]|财义|reportedCpm|supplierReport|GC三方号数据|NaN|Infinity/);
      expect(emptyHtml).toContain('id="mikoshi-bootstrap"');
      expect(emptyHtml).toContain('id="mikoshi-frame-bridge"');
      expect(emptyHtml).not.toContain('id="mikoshi-thirdparty-library"');
      for (const label of ["发布总览", "全局透视", "账号与作品", "内容与讨论", "费用与起飞", "节点复盘", "数据与口径"]) expect(emptyHtml).toContain(label);
      const manifest = JSON.parse(await read("manifest.json"));
      expect(manifest.dataPolicy.thirdparty).toBe("empty");
      expect(manifest.dataPolicy.kol).toBe("empty");
      expect(manifest.inputs).toHaveProperty("frontend/mikoshi-web/scripts/kol-empty.html");
      expect(manifest.inputs).toHaveProperty("frontend/mikoshi-web/scripts/thirdparty-empty.html");
      expect(manifest.inputs).toHaveProperty("frontend/mikoshi-web/scripts/legacy-data-policy.json");

      await syncLegacy({ force: true, outputDirectory: directory });
      expect(await read("thirdparty.html")).toBe(emptyHtml);
      expect(await read("thirdparty-catalog.json")).toBe(emptyCatalog);
      expect(await read("summary.json")).toBe(emptySummary);
      await writeFile(path.join(directory, "thirdparty.html"), "corrupted");
      await rm(path.join(directory, "thirdparty-catalog.json"));
      await syncLegacy({ outputDirectory: directory });
      expect(await read("thirdparty.html")).toBe(emptyHtml);
      expect(await read("thirdparty-catalog.json")).toBe(emptyCatalog);
      expect(await read("kol.html")).toBe(emptyKol);
      // Each domain's explicit recovery is independent and never rewrites the other.
      await syncLegacy({ outputDirectory: directory, kolMode: "snapshot" });
      expect(sha256(await read("kol.html"))).toBe(historicalKol);
      expect(await read("thirdparty.html")).toBe(emptyHtml);
      await syncLegacy({ outputDirectory: directory });
      expect(await read("kol.html")).toBe(emptyKol);
      await expect(syncLegacy({ kolMode: "snapshot" })).rejects.toThrow("isolated");
    } finally {
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.join(path.resolve(os.tmpdir()), "mikoshi-empty-generation-"))) throw new Error("Unexpected temporary test path");
      await rm(resolved, { recursive: true, force: true });
    }
  }, 30_000);
});
