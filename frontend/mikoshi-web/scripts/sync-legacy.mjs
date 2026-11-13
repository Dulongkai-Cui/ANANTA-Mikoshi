// Rebuild derived, ignored legacy assets from the unchanged reference HTML.
// Every input and output is hashed; --force produces byte-identical output.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "References/BilibiliDashboard/无限大B站数据系统.html";
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function scriptJson(html, id) {
  const open = `<script id="${id}" type="application/json">`;
  const start = html.indexOf(open);
  const end = html.indexOf("</script>", start + open.length);
  if (start < 0 || end < start) throw new Error(`Missing or unterminated JSON script: ${id}`);
  return JSON.parse(html.slice(start + open.length, end));
}

export function assignmentJson(doc, marker) {
  const start = doc.indexOf(marker);
  if (start < 0) throw new Error(`Missing JSON assignment: ${marker}`);
  const begin = start + marker.length;
  let depth = 0, quoted = false, escaped = false;
  for (let i = begin; i < doc.length; i++) {
    const char = doc[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0) return JSON.parse(doc.slice(begin, i + 1));
    }
  }
  throw new Error(`Unterminated JSON assignment: ${marker}`);
}

/** Presentation-only conversion: original fixed font sizes follow host text zoom. */
export function scalableFonts(doc) {
  return doc.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, attributes, css) => {
    const adjusted = css
      .replace(/(font-size\s*:\s*)(\d+(?:\.\d+)?)px/gi, (_, before, size) => `${before}${Math.max(Number(size), 12) / 16}rem`)
      .replace(/(\bfont\s*:[^;{}]*?)(\d+(?:\.\d+)?)px(?=[/\s])/gi, (_, before, size) => `${before}${Math.max(Number(size), 12) / 16}rem`);
    return `<style${attributes}>${adjusted}</style>`;
  });
}

export function inject(doc, headStart, headEnd, bodyEnd) {
  const start = /<head\b[^>]*>/i.exec(doc);
  const head = doc.indexOf("</head>");
  const body = doc.lastIndexOf("</body>");
  if (!start || head < start.index || body < head) throw new Error("Unexpected legacy document structure");
  const offset = start.index + start[0].length;
  return doc.slice(0, offset) + headStart + doc.slice(offset, head) + headEnd + doc.slice(head, body) + bodyEnd + doc.slice(body);
}

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
export function recordSummary(records, identity) {
  const known = records.filter((record) => isNumber(record.view));
  return {
    works: records.length,
    identities: new Set(records.map(identity).filter((value) => value !== undefined && value !== null && value !== "")).size,
    views: known.reduce((total, record) => total + record.view, 0),
    knownViewRecords: known.length,
    missingViews: records.length - known.length,
  };
}

export function safeBilibiliUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    if (url.hostname !== "bilibili.com" && !url.hostname.endsWith(".bilibili.com")) return null;
    return url.href;
  } catch { return null; }
}

/** Read-only catalog for new native pages; never supplies synthetic effect metrics. */
export function thirdpartyCatalog(data, sourceHash) {
  if (!Array.isArray(data?.profiles) || !Array.isArray(data?.records)) throw new Error("Missing third-party catalog source");
  const text = (value) => typeof value === "string" && value.length ? value : null;
  const metric = (value) => isNumber(value) && value >= 0 ? value : null;
  const profiles = new Set();
  const accounts = data.profiles.map((profile) => {
    if (!text(profile.id) || !text(profile.name) || profiles.has(profile.id)) throw new Error("Invalid or duplicate historical account identity");
    profiles.add(profile.id);
    const rows = data.records.filter((record) => record.account === profile.id);
    const known = rows.map((record) => metric(record.view));
    return {
      id: profile.id,
      uid: text(profile.uid),
      name: profile.name,
      link: safeBilibiliUrl(profile.link),
      suppliers: [...new Set(rows.map((record) => text(record.supplier)).filter(Boolean))].sort(),
      workCount: rows.length,
      view: rows.length && known.every((value) => value !== null) ? known.reduce((total, value) => total + value, 0) : null,
      works: [...rows].sort((a, b) => `${b.date ?? ""} ${b.time ?? ""}`.localeCompare(`${a.date ?? ""} ${a.time ?? ""}`) || String(a.id).localeCompare(String(b.id))).slice(0, 3).map((record) => {
        if (!text(record.id)) throw new Error("Historical work missing identity");
        return { id: record.id, title: text(record.title), date: text(record.date), time: text(record.time), view: metric(record.view), like: metric(record.like), reply: metric(record.reply), link: safeBilibiliUrl(record.link) };
      }),
    };
  });
  if (data.records.some((record) => !profiles.has(record.account))) throw new Error("Historical work has no matching account profile");
  return { schema: 1, sourceHash, accounts };
}

const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; media-src data: blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

export function compileBridge(template, workspace, pages) {
  const output = template.replaceAll("__MODULE__", workspace).replaceAll("__PAGES__", JSON.stringify(pages));
  if (/__MODULE__|__PAGES__/.test(output)) throw new Error("Unresolved legacy bridge template token");
  return output;
}

/** An invalid/missing policy fails closed; historical data is never a fallback. */
export function legacyDataMode(policy, override) {
  const allowed = (value) => value === "empty" || value === "snapshot";
  if (policy?.schema !== 1 || !allowed(policy.thirdparty)) throw new Error("Invalid legacy data policy");
  if (override !== undefined && !allowed(override)) throw new Error("Invalid explicit third-party data mode");
  return override ?? policy.thirdparty;
}

export function kolDataMode(policy, override) {
  const allowed = (value) => value === "empty" || value === "snapshot";
  if (policy?.schema !== 1 || !allowed(policy.kol)) throw new Error("Invalid KOL data policy");
  if (override !== undefined && !allowed(override)) throw new Error("Invalid explicit KOL data mode");
  return override ?? policy.kol;
}

export async function outputsValid(directory, manifest, expectedInputs) {
  if (manifest?.version !== 2 || JSON.stringify(manifest.inputs) !== JSON.stringify(expectedInputs)) return false;
  for (const name of ["kol.html", "thirdparty.html", "summary.json", "thirdparty-catalog.json"]) {
    const expected = manifest.outputs?.[name];
    if (!expected || typeof expected.sha256 !== "string") return false;
    try {
      const bytes = await readFile(path.join(directory, name));
      if (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256) return false;
    } catch { return false; }
  }
  return true;
}

export async function syncLegacy({ force = false, thirdpartyMode: override, kolMode: kolOverride, outputDirectory } = {}) {
  const sourceFile = path.resolve(appRoot, "../..", sourcePath);
  const outDir = outputDirectory ? path.resolve(outputDirectory) : path.join(appRoot, "public/legacy");
  const source = await readFile(sourceFile);
  const files = ["sync-legacy.mjs", "legacy-bootstrap.js", "legacy-bridge.js", "legacy-frame.css", "thirdparty-library.js", "legacy-data-policy.json", "thirdparty-empty.html", "kol-empty.html"];
  const resources = {};
  const inputs = { [sourcePath]: { sha256: sha256(source), bytes: source.length } };
  for (const name of files) {
    const bytes = await readFile(path.join(appRoot, "scripts", name));
    resources[name] = bytes.toString("utf8");
    inputs[`frontend/mikoshi-web/scripts/${name}`] = { sha256: sha256(bytes), bytes: bytes.length };
  }
  const thirdpartyMode = legacyDataMode(JSON.parse(resources["legacy-data-policy.json"]), override);
  const kolMode = kolDataMode(JSON.parse(resources["legacy-data-policy.json"]), kolOverride);
  const publicRelative = path.relative(path.join(appRoot, "public"), outDir);
  const insidePublic = publicRelative === "" || (!publicRelative.startsWith(`..${path.sep}`) && publicRelative !== ".." && !path.isAbsolute(publicRelative));
  if ((kolMode === "snapshot" || thirdpartyMode === "snapshot") && insidePublic) {
    throw new Error("Historical snapshot requires an isolated --out-dir outside public");
  }
  // An explicit historical test/recovery run must not make a later default run look current.
  inputs.effectiveDataPolicy = { thirdparty: thirdpartyMode, kol: kolMode };
  const manifestPath = path.join(outDir, "manifest.json");
  if (!force) {
    try {
      const previous = JSON.parse(await readFile(manifestPath, "utf8"));
      if (await outputsValid(outDir, previous, inputs)) {
        console.log("[legacy] all inputs and outputs verified; up to date");
        return previous;
      }
    } catch { /* Rebuild if missing, corrupt, or stale. */ }
  }
  const html = source.toString("utf8");
  const config = scriptJson(html, "system-config");
  const documents = scriptJson(html, "workspace-documents");
  const contents = {};
  for (const workspace of ["kol", "thirdparty"]) {
    const mode = workspace === "kol" ? kolMode : thirdpartyMode;
    const doc = mode === "empty" ? resources[`${workspace}-empty.html`] : documents[workspace];
    if (typeof doc !== "string") throw new Error(`Missing legacy module ${workspace}`);
    const replaceModule = (text) => text.replaceAll("__MODULE__", workspace);
    const bridge = compileBridge(resources["legacy-bridge.js"], workspace, workspace === "kol" ? ["home", "overview"] : config.modules[workspace].pages.map((page) => page.id));
    contents[`${workspace}.html`] = inject(
      scalableFonts(doc),
      `<meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="referrer" content="no-referrer"><script id="mikoshi-bootstrap">${replaceModule(resources["legacy-bootstrap.js"])}</script>`,
      `<style id="mikoshi-frame-style">${config.frameCss}\n${resources["legacy-frame.css"]}</style>`,
      (workspace === "thirdparty" && thirdpartyMode === "snapshot" ? `<script id="mikoshi-thirdparty-library">${resources["thirdparty-library.js"]}</script>` : "") + `<script id="mikoshi-frame-bridge">${bridge}</script>`,
    );
  }
  const kolData = kolMode === "snapshot" ? assignmentJson(documents.kol, "const DATA=") : { profiles: [], videos: [] };
  const thirdData = thirdpartyMode === "snapshot" ? scriptJson(documents.thirdparty, "dashboard-data") : { records: [], profiles: [] };
  const kol = recordSummary(kolData.videos, (record) => record.uid);
  const third = recordSummary(thirdData.records, (record) => record.account ?? record.uid ?? record.name);
  const { identities: creators, ...kolCounts } = kol;
  const { identities: accounts, ...thirdCounts } = third;
  const summary = {
    schemaVersion: 2,
    source: sourcePath,
    sourceHash: sha256(source),
    kol: { ...kolCounts, creators, snapshotAt: kolData.end ?? null, snapshotLabel: kolMode === "empty" ? "初始工作区" : config.modules.kol.snapshot, basis: kolMode === "empty" ? "发布效果尚未接入；管理名册与合作排期不计入发布作品" : "B站公开数据快照内按 BV 号去重的合作作品；播放为有 view 记录的求和，不含抖音；缺失记录另计" },
    thirdParty: {
      ...thirdCounts, accounts, snapshotAt: thirdData.builtAt ?? null,
      snapshotLabel: thirdpartyMode === "empty" ? "暂无发布数据" : config.modules.thirdparty.snapshot,
      range: { start: thirdData.start ?? null, end: thirdData.end ?? null },
      basis: thirdpartyMode === "empty" ? "暂无发布作品；效果指标尚无数据，不表示已发生的零播放" : "执行表记录的三方号作品；播放为有 view 记录的求和；缺失记录另计",
    },
  };
  contents["summary.json"] = JSON.stringify(summary, null, 2) + "\n";
  contents["thirdparty-catalog.json"] = JSON.stringify(thirdpartyCatalog(thirdData, sha256(source)), null, 2) + "\n";
  const outputs = Object.fromEntries(Object.entries(contents).map(([name, value]) => [name, { bytes: Buffer.byteLength(value), sha256: sha256(value) }]));
  const manifest = {
    version: 2,
    source: { path: sourcePath, ...inputs[sourcePath] },
    inputs,
    outputs,
    dataPolicy: { thirdparty: thirdpartyMode, kol: kolMode },
    adaptation: [thirdpartyMode === "empty" ? "Third-party workspace initialized without embedded historical records; original source retained outside public" : "Third-party historical data retained by explicit snapshot mode", kolMode === "empty" ? "KOL workspace initialized without embedded historical records; original data archived outside public" : "KOL historical data retained by explicit snapshot mode", "Host navigation, identity-scoped storage, theme and text sizing", "Network requests blocked by early CSP; explicit HTTPS links may open a new window", "Generated HTML is local public static content, not a server authorization boundary"],
  };
  await mkdir(outDir, { recursive: true });
  for (const [name, content] of Object.entries(contents)) await writeFile(path.join(outDir, name), content, "utf8");
  // Written last: a partial failure cannot be mistaken for a complete successful build.
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("[legacy] generated and fingerprinted both workspaces, summary and third-party catalog");
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const invalid = args.find((arg) => arg !== "--force" && !arg.startsWith("--thirdparty-mode=") && !arg.startsWith("--kol-mode=") && !arg.startsWith("--out-dir="));
  const options = {
    force: args.includes("--force"),
    thirdpartyMode: args.find((arg) => arg.startsWith("--thirdparty-mode="))?.slice("--thirdparty-mode=".length),
    kolMode: args.find((arg) => arg.startsWith("--kol-mode="))?.slice("--kol-mode=".length),
    outputDirectory: args.find((arg) => arg.startsWith("--out-dir="))?.slice("--out-dir=".length),
  };
  (invalid ? Promise.reject(new Error(`Unknown legacy option: ${invalid}`)) : syncLegacy(options)).catch((error) => {
    console.error("[legacy] failed:", error.message);
    process.exitCode = 1;
  });
}
