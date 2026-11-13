import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoDashboardRepository, layoutKey } from "@/adapters/demo/dashboard";
import { type WidgetInstance } from "@/contracts/dashboard";
import { addWidget, availableTypes, defaultLayout, defaultWidgets, moveWidget, removeWidget, sameWidgets, setWidgetSize, validateLayout } from "@/features/dashboard/layout";
import { denyStorageProperty, installStorage } from "./storage-fixture";

const USER_A = "demo-u-linxu";
const USER_B = "demo-u-xucheng";

describe("dashboard configuration validation and editing", () => {
  it("accepts valid defaults and an intentionally empty layout", () => {
    expect(validateLayout(defaultLayout(USER_A), USER_A).ok).toBe(true);
    expect(validateLayout({ ...defaultLayout(USER_A), widgets: [] }, USER_A).ok).toBe(true);
  });

  it.each([
    [null, "invalid_shape"],
    [{ ...defaultLayout(USER_A), schemaVersion: 2 }, "schema_version"],
    [defaultLayout(USER_B), "user_mismatch"],
    [{ ...defaultLayout(USER_A), revision: -1 }, "invalid_shape"],
    [{ ...defaultLayout(USER_A), revision: 1.5 }, "invalid_shape"],
    [{ ...defaultLayout(USER_A), revision: Number.MAX_SAFE_INTEGER + 1 }, "invalid_shape"],
    [{ ...defaultLayout(USER_A), widgets: [{}] }, "unknown_type"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], type: "removed-plugin" }] }, "unknown_type"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], order: -1 }] }, "invalid_shape"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], order: 1 }] }, "invalid_shape"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], order: 0 }, { ...defaultWidgets()[1], order: 0 }] }, "invalid_shape"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], order: 0 }, { ...defaultWidgets()[1], id: defaultWidgets()[0]!.id, order: 1 }] }, "duplicate"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], order: 0 }, { ...defaultWidgets()[0], id: "another-id", order: 1 }] }, "duplicate"],
    [{ ...defaultLayout(USER_A), widgets: [{ ...defaultWidgets()[0], size: "huge", order: 0 }] }, "invalid_shape"],
  ])("reports a malformed configuration without silently repairing it", (value, reason) => {
    expect(validateLayout(value, USER_A)).toEqual({ ok: false, reason });
  });

  it("sorts a valid stored order into matching DOM order without mutating input", () => {
    const input = { ...defaultLayout(USER_A), widgets: defaultWidgets().reverse() };
    const result = validateLayout(input, USER_A);
    expect(result).toMatchObject({ ok: true, layout: { widgets: defaultWidgets() } });
    expect(input.widgets[0]!.type).toBe("agent-activity");
  });

  it("supports remove, add, move and size edits without changing the saved layout", () => {
    const saved = defaultWidgets();
    const before = structuredClone(saved);
    let draft = removeWidget(saved, "w-my-todos");
    expect(availableTypes(draft)).toEqual(["my-todos"]);
    draft = addWidget(draft, "my-todos");
    draft = moveWidget(draft, "w-my-todos", -1);
    draft = setWidgetSize(draft, "w-my-todos", "wide");
    expect(draft[2]).toMatchObject({ type: "my-todos", size: "wide", order: 2 });
    expect(saved).toEqual(before);
    expect(sameWidgets(saved, draft)).toBe(false);
    expect(validateLayout({ ...defaultLayout(USER_A), widgets: draft }, USER_A).ok).toBe(true);
  });

  it("prevents duplicate types and preserves boundary positions", () => {
    const widgets = defaultWidgets();
    expect(addWidget(widgets, "my-todos")).toEqual(widgets);
    expect(moveWidget(widgets, widgets[0]!.id, -1)).toEqual(widgets);
    expect(moveWidget(widgets, widgets[3]!.id, 1)).toEqual(widgets);
    expect(moveWidget(widgets, "missing", -1)).toEqual(widgets);
  });
});

describe("demo dashboard persistence", () => {
  let storage: ReturnType<typeof installStorage>;
  beforeEach(() => { storage = installStorage(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("loads defaults without writing and keeps identities independent", async () => {
    const repository = createDemoDashboardRepository();
    expect(await repository.load(USER_A)).toEqual({ status: "ok", layout: defaultLayout(USER_A), source: "default" });
    expect(storage.local.length).toBe(0);
    const result = await repository.save({ userId: USER_A, widgets: [], expectedRevision: 0 });
    expect(result).toMatchObject({ ok: true, layout: { userId: USER_A, revision: 1, widgets: [] } });
    expect(await createDemoDashboardRepository().load(USER_A)).toMatchObject({ status: "ok", source: "saved", layout: { widgets: [], revision: 1 } });
    expect(await repository.load(USER_B)).toEqual({ status: "ok", layout: defaultLayout(USER_B), source: "default" });
    expect(storage.local.getItem(layoutKey(USER_B))).toBeNull();
  });

  it("rejects a stale writer and preserves both its draft and the winner", async () => {
    const writerA = createDemoDashboardRepository();
    const writerB = createDemoDashboardRepository();
    await writerA.load(USER_A);
    await writerB.load(USER_A);
    await writerA.save({ userId: USER_A, widgets: [], expectedRevision: 0 });
    const staleDraft = defaultWidgets();
    const snapshot = structuredClone(staleDraft);
    expect(await writerB.save({ userId: USER_A, widgets: staleDraft, expectedRevision: 0 }))
      .toEqual({ ok: false, error: { code: "conflict", currentRevision: 1 } });
    expect(staleDraft).toEqual(snapshot);
    expect(await writerA.load(USER_A)).toMatchObject({ status: "ok", layout: { revision: 1, widgets: [] } });
  });

  it.each([
    ["not json", "unparseable"],
    [JSON.stringify({ ...defaultLayout(USER_A), schemaVersion: 2 }), "schema_version"],
    [JSON.stringify(defaultLayout(USER_B)), "user_mismatch"],
    [JSON.stringify({ ...defaultLayout(USER_A), widgets: [{ type: "retired-widget" }] }), "unknown_type"],
  ])("preserves corrupt storage until an explicit recovery save", async (raw, reason) => {
    storage.local.setItem(layoutKey(USER_A), raw);
    const repository = createDemoDashboardRepository();
    expect(await repository.load(USER_A)).toEqual({ status: "corrupted", reason, fallback: defaultLayout(USER_A) });
    expect(storage.local.getItem(layoutKey(USER_A))).toBe(raw);
    expect(await repository.save({ userId: USER_A, widgets: [], expectedRevision: 0 }))
      .toEqual({ ok: false, error: { code: "conflict", currentRevision: "corrupted" } });
    expect(storage.local.getItem(layoutKey(USER_A))).toBe(raw);
    expect(await repository.save({ userId: USER_A, widgets: [], expectedRevision: "corrupted" }))
      .toMatchObject({ ok: true, layout: { revision: 1, widgets: [] } });
  });

  it("rejects a recovery save if another instance already repaired the record", async () => {
    storage.local.setItem(layoutKey(USER_A), "broken");
    const repository = createDemoDashboardRepository();
    await repository.load(USER_A);
    storage.local.setItem(layoutKey(USER_A), JSON.stringify(defaultLayout(USER_A, 3)));
    expect(await repository.save({ userId: USER_A, widgets: [], expectedRevision: "corrupted" }))
      .toEqual({ ok: false, error: { code: "conflict", currentRevision: 3 } });
  });

  it("returns recoverable defaults when storage is denied, but cannot claim a save", async () => {
    denyStorageProperty(storage.browser, "localStorage");
    const repository = createDemoDashboardRepository();
    expect(await repository.load(USER_A)).toEqual({ status: "unavailable", fallback: defaultLayout(USER_A) });
    expect(await repository.save({ userId: USER_A, widgets: [], expectedRevision: 0 }))
      .toEqual({ ok: false, error: { code: "storage_unavailable" } });
  });

  it.each([
    [new DOMException("Full", "QuotaExceededError"), "quota_exceeded"],
    [new DOMException("Denied", "SecurityError"), "storage_unavailable"],
    [new Error("Write failed"), "write_failed"],
  ])("reports write failure while retaining saved data and the caller's draft", async (error, code) => {
    const repository = createDemoDashboardRepository();
    await repository.save({ userId: USER_A, widgets: defaultWidgets(), expectedRevision: 0 });
    const stored = storage.local.getItem(layoutKey(USER_A));
    const draft: WidgetInstance[] = [];
    storage.local.writeError = error as Error;
    expect(await repository.save({ userId: USER_A, widgets: draft, expectedRevision: 1 }))
      .toEqual({ ok: false, error: { code } });
    expect(storage.local.getItem(layoutKey(USER_A))).toBe(stored);
    expect(draft).toEqual([]);
  });

  it("validates draft schema before writing anything", async () => {
    const widgets = [{ ...defaultWidgets()[0]!, order: -1 }];
    expect(await createDemoDashboardRepository().save({ userId: USER_A, widgets, expectedRevision: 0 }))
      .toEqual({ ok: false, error: { code: "invalid_layout" } });
    expect(storage.local.length).toBe(0);
  });

  it("refuses revision overflow rather than silently losing stale-version detection", async () => {
    storage.local.setItem(layoutKey(USER_A), JSON.stringify(defaultLayout(USER_A, Number.MAX_SAFE_INTEGER)));
    expect(await createDemoDashboardRepository().save({ userId: USER_A, widgets: [], expectedRevision: Number.MAX_SAFE_INTEGER }))
      .toEqual({ ok: false, error: { code: "invalid_layout" } });
  });
});
