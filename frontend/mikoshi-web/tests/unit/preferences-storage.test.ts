import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoPreferencesStore, parsePreferences, PREFERENCES_KEY } from "@/adapters/demo/preferences";
import { DEFAULT_PREFERENCES } from "@/contracts/preferences";
import { parseJson, readItem, removeItem, writeItem } from "@/lib/storage";
import { denyStorageProperty, installStorage } from "./storage-fixture";

describe("local preferences", () => {
  let storage: ReturnType<typeof installStorage>;
  beforeEach(() => { storage = installStorage(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("uses system defaults without eagerly writing them", () => {
    expect(createDemoPreferencesStore().load()).toEqual({ status: "ok", preferences: DEFAULT_PREFERENCES, source: "default" });
    expect(storage.local.length).toBe(0);
  });

  it("persists theme, motion and sidebar independently across a new store", () => {
    const preferences = { ...DEFAULT_PREFERENCES, theme: "dark" as const, motion: "reduce" as const, sidebarCollapsed: true };
    expect(createDemoPreferencesStore().save(preferences)).toEqual({ ok: true });
    expect(createDemoPreferencesStore().load()).toEqual({ status: "ok", preferences, source: "saved" });
    expect(storage.session.length).toBe(0);
  });

  it.each([
    null, [], {}, { ...DEFAULT_PREFERENCES, version: 2 },
    { ...DEFAULT_PREFERENCES, theme: "sepia" },
    { ...DEFAULT_PREFERENCES, motion: "force-animation" },
    { ...DEFAULT_PREFERENCES, sidebarCollapsed: "true" },
  ].map((raw) => ({ raw })))("rejects unsupported preference data $raw", ({ raw }) => {
    expect(parsePreferences(raw)).toBeNull();
  });

  it("reports damaged records but preserves them until the next explicit change", () => {
    storage.local.setItem(PREFERENCES_KEY, "{broken");
    const store = createDemoPreferencesStore();
    expect(store.load()).toEqual({ status: "corrupted", preferences: DEFAULT_PREFERENCES });
    expect(storage.local.getItem(PREFERENCES_KEY)).toBe("{broken");
    expect(store.save({ ...DEFAULT_PREFERENCES, theme: "light" })).toEqual({ ok: true });
    expect(store.load()).toMatchObject({ status: "ok", source: "saved", preferences: { theme: "light" } });
  });

  it("reports denied storage instead of pretending preferences are persistent", () => {
    denyStorageProperty(storage.browser, "localStorage");
    expect(createDemoPreferencesStore().load()).toEqual({ status: "unavailable", preferences: DEFAULT_PREFERENCES });
    expect(createDemoPreferencesStore().save(DEFAULT_PREFERENCES)).toEqual({ ok: false, error: "storage_unavailable" });
  });

  it.each([
    [new DOMException("Full", "QuotaExceededError"), "quota_exceeded"],
    [new DOMException("Denied", "SecurityError"), "storage_unavailable"],
    [new Error("Write failed"), "write_failed"],
  ])("maps preference write failures without replacing the persisted values", (error, expected) => {
    const store = createDemoPreferencesStore();
    store.save(DEFAULT_PREFERENCES);
    storage.local.writeError = error as Error;
    expect(store.save({ ...DEFAULT_PREFERENCES, theme: "dark" })).toEqual({ ok: false, error: expected });
    expect(store.load()).toMatchObject({ status: "ok", preferences: { theme: "system" } });
  });
});

describe("storage boundary", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("handles a server environment without a window", () => {
    vi.stubGlobal("window", undefined);
    expect(readItem("local", "key")).toEqual({ ok: false, error: "unavailable" });
    expect(writeItem("session", "key", "value")).toEqual({ ok: false, error: "unavailable" });
    expect(removeItem("session", "key")).toEqual({ ok: false, error: "unavailable" });
  });

  it("distinguishes missing values from throwing getItem", () => {
    const { local } = installStorage();
    expect(readItem("local", "key")).toEqual({ ok: true, value: null });
    local.readError = new Error("Read unavailable");
    expect(readItem("local", "key")).toEqual({ ok: false, error: "unavailable" });
  });

  it("never treats invalid JSON as an empty object", () => {
    expect(parseJson("{")).toBeUndefined();
    expect(parseJson("null")).toBeNull();
    expect(parseJson('{"version":1}')).toEqual({ version: 1 });
  });
});
