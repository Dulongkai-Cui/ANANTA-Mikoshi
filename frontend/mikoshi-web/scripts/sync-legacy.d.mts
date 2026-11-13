export function sha256(value: string | Uint8Array): string;
export function scriptJson(html: string, id: string): unknown;
export function assignmentJson(doc: string, marker: string): unknown;
export function scalableFonts(doc: string): string;
export function inject(doc: string, start: string, head: string, body: string): string;
export function compileBridge(template: string, workspace: string, pages: string[]): string;
export function legacyDataMode(policy: unknown, override?: unknown): "empty" | "snapshot";
export function kolDataMode(policy: unknown, override?: unknown): "empty" | "snapshot";
export function recordSummary<T extends { view?: unknown }>(records: T[], identity: (record: T) => unknown): {
  works: number; identities: number; views: number; knownViewRecords: number; missingViews: number;
};
export function safeBilibiliUrl(value: unknown): string | null;
export function thirdpartyCatalog(data: unknown, sourceHash: string): {
  schema: 1;
  sourceHash: string;
  accounts: Array<{
    id: string; uid: string | null; name: string; link: string | null; suppliers: string[]; workCount: number; view: number | null;
    works: Array<{ id: string; title: string | null; date: string | null; time: string | null; view: number | null; like: number | null; reply: number | null; link: string | null }>;
  }>;
};
export function outputsValid(directory: string, manifest: unknown, inputs: unknown): Promise<boolean>;
export function syncLegacy(options?: { force?: boolean; thirdpartyMode?: "empty" | "snapshot"; kolMode?: "empty" | "snapshot"; outputDirectory?: string }): Promise<unknown>;
