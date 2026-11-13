import { vi } from "vitest";

/** Small Web Storage implementation; faults throw at the same API boundary as browsers. */
export class MemoryStorage implements Storage {
  readonly data = new Map<string, string>();
  readError: Error | undefined;
  writeError: Error | undefined;
  removeError: Error | undefined;
  ignoreWrites = false;
  ignoreRemoves = false;

  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  getItem(key: string) {
    if (this.readError) throw this.readError;
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.writeError) throw this.writeError;
    if (!this.ignoreWrites) this.data.set(key, value);
  }
  removeItem(key: string) {
    if (this.removeError) throw this.removeError;
    if (!this.ignoreRemoves) this.data.delete(key);
  }
}

export function installStorage() {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = { localStorage: local, sessionStorage: session };
  vi.stubGlobal("window", browser);
  return { local, session, browser };
}

export function denyStorageProperty(browser: object, property: "localStorage" | "sessionStorage") {
  Object.defineProperty(browser, property, {
    configurable: true,
    get() { throw new DOMException("Storage denied", "SecurityError"); },
  });
}
