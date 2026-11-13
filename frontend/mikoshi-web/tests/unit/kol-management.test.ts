import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyCollaboration, emptyStore, emptyTalent, isOverdue, matchesStatus, normalizeIdentity, safeProfileUrl, validateCollaboration, validateSchedule, validateTalent, type Collaboration, type KolStore, type Schedule, type Talent } from "@/features/kol/model";
import { decodeStore, kolKey, readKol, writeKol } from "@/features/kol/repository";
import { installStorage } from "./storage-fixture";

const at = "2026-10-19T00:00:00.000Z", user = "demo-u-linxu";
const talent = (patch: Partial<Talent> = {}): Talent => ({ ...emptyTalent(), id: "talent:a", name: "测试达人", externalId: "12345678901234567890", createdAt: at, updatedAt: at, ...patch });
const cooperation = (patch: Partial<Collaboration> = {}): Collaboration => ({ ...emptyCollaboration(), id: "collaboration:a", talentId: "talent:a", title: "测试合作", createdAt: at, updatedAt: at, ...patch });
const schedule = (patch: Partial<Schedule> = {}): Schedule => ({ id: "schedule:a", collaborationId: "collaboration:a", title: "测试发布", date: "2026-12-01", time: "18:00", content: "", review: "pending", status: "planned", notes: "", createdAt: at, updatedAt: at, ...patch });
const stored = (patch: Partial<KolStore> = {}): KolStore => ({ schema: 1, revision: "r1", talents: [talent()], collaborations: [cooperation()], schedules: [schedule()], ...patch });

describe("KOL identity and management meaning", () => {
  it("keeps unknown fields null while a real zero remains a zero", () => {
    expect(emptyTalent().followers).toBeNull(); expect(emptyTalent().referencePrice).toBeNull(); expect(emptyCollaboration().quote).toBeNull();
    expect(decodeStore(JSON.stringify(stored({ talents: [talent({ followers: 0, referencePrice: null })] })))).toMatchObject({ ok: true, data: { talents: [{ followers: 0, referencePrice: null }] } });
  });
  it("normalizes B站 digits without precision loss and preserves case-sensitive platform IDs", () => {
    expect(normalizeIdentity("B站", " 0012345678901234567890 ")).toBe("12345678901234567890");
    expect(normalizeIdentity("YouTube", " UCAbC123 ")).toBe("UCAbC123");
    const other = talent({ platform: "YouTube", externalId: "UCAbC123" });
    expect(validateTalent({ ...other, externalId: "UCabc123" }, stored({ talents: [other] }))).toEqual({});
    expect(decodeStore(JSON.stringify(stored({ talents: [other, { ...other, id: "talent:b", externalId: "UCabc123" }] })))).toMatchObject({ ok: true });
  });
  it("rejects same-platform duplicates and changes to a saved identity but not equal IDs across platforms", () => {
    expect(validateTalent({ ...talent(), externalId: "0012345678901234567890" }, stored()).externalId).toMatch(/已经入库/);
    expect(validateTalent({ ...talent(), externalId: "8888" }, stored(), "talent:a").externalId).toMatch(/不可更换/);
    expect(validateTalent({ ...talent(), platform: "抖音" }, stored())).toEqual({});
    expect(validateTalent(talent({ name: "重命名" }), stored(), "talent:a")).toEqual({});
  });
  it.each(["0", "-1", "1e3", "123 456", "123456789012345678901"])("rejects invalid B站 UID %s", externalId => { expect(validateTalent(talent({ externalId }), emptyStore()).externalId).toBeTruthy(); });
  it.each(["javascript:alert(1)", "data:text/html,hi", "https://user:pass@example.com", "not a link"])("rejects unsafe homepage %s", profileUrl => { expect(safeProfileUrl(profileUrl)).toBe(false); expect(validateTalent(talent({ profileUrl }), emptyStore()).profileUrl).toBeTruthy(); });
  it("allows safe homepage and rejects impossible numeric values", () => {
    expect(safeProfileUrl("https://space.bilibili.com/123")).toBe(true);
    expect(validateTalent(talent({ followers: 1.5, referencePrice: -1 }), emptyStore())).toMatchObject({ followers: expect.any(String), referencePrice: expect.any(String) });
    expect(validateCollaboration(cooperation({ quote: Number.POSITIVE_INFINITY }), stored())).toHaveProperty("quote");
  });
  it("supports multiple independent collaborations and keeps stage separate from booking", () => {
    const c = cooperation({ id: "collaboration:b", stage: "production", booking: "verbal" });
    expect(validateCollaboration(c, stored())).toEqual({});
    const result = decodeStore(JSON.stringify(stored({ collaborations: [cooperation(), c] })));
    expect(result).toMatchObject({ ok: true, data: { collaborations: [{ stage: "proposal", booking: "none" }, { stage: "production", booking: "verbal" }] } });
  });
  it("stopped talents cannot get new collaboration, while existing history can still be edited", () => {
    const data = stored({ talents: [talent({ status: "archived" })] });
    expect(validateCollaboration(cooperation(), data).talentId).toMatch(/停用/);
    expect(validateCollaboration(cooperation({ stage: "cancelled" }), data, "collaboration:a")).toEqual({});
  });
  it("validates optional milestones and cannot reassign an existing cooperation", () => {
    expect(validateCollaboration(cooperation({ scriptDate: "2026-02-29", latestOrderDate: "2101-01-01" }), stored())).toMatchObject({ scriptDate: expect.any(String), latestOrderDate: expect.any(String) });
    const data = stored({ talents: [talent(), talent({ id: "talent:b", externalId: "8888" })] });
    expect(validateCollaboration(cooperation({ talentId: "talent:b" }), data, "collaboration:a").talentId).toMatch(/不能更换/);
  });
  it("checks scheduling collisions across different collaborations of the same talent", () => {
    const data = stored({ collaborations: [cooperation(), cooperation({ id: "collaboration:b" })] });
    expect(validateSchedule(schedule({ collaborationId: "collaboration:b" }), data).time).toMatch(/已有排期/);
    expect(validateSchedule(schedule({ time: "19:00" }), data)).toEqual({});
    expect(validateSchedule(schedule(), data, "schedule:a")).toEqual({});
  });
  it("allows cancelled/withdrawn records and rechecks unavailable relationships on restore", () => {
    for (const data of [stored({ talents: [talent({ status: "archived" })] }), stored({ collaborations: [cooperation({ stage: "cancelled" })] })]) {
      expect(validateSchedule(schedule(), data, "schedule:a").collaborationId).toBeTruthy();
      expect(validateSchedule(schedule({ status: "cancelled" }), data, "schedule:a")).toEqual({});
      expect(validateSchedule(schedule({ status: "withdrawn" }), data, "schedule:a")).toEqual({});
      expect(decodeStore(JSON.stringify(data))).toMatchObject({ ok: true });
    }
    expect(matchesStatus(schedule({ status: "withdrawn" }), "")).toBe(false);
    expect(matchesStatus(schedule({ status: "withdrawn" }), "withdrawn")).toBe(true);
    expect(matchesStatus(schedule({ status: "cancelled" }), "")).toBe(true);
  });
  it("validates real date/time and derives overdue without writing publication results", () => {
    expect(validateSchedule(schedule({ date: "2026-04-31", time: "24:00" }), stored())).toMatchObject({ date: expect.any(String), time: expect.any(String) });
    const value = schedule({ date: "2026-10-19", time: "08:00" });
    expect(isOverdue(value, new Date("2026-10-18T23:59:59Z"))).toBe(false);
    expect(isOverdue(value, new Date("2026-10-19T00:00:01Z"))).toBe(true);
    expect(value.status).toBe("planned");
  });
});

describe("KOL local persistence boundaries", () => {
  let storage: ReturnType<typeof installStorage>;
  beforeEach(() => { storage = installStorage(); vi.stubGlobal("navigator", {}); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it("starts empty without writes, isolates identities and preserves old KOL and third-party data", async () => {
    storage.local.setItem("mikoshi.legacy.v1:demo-u-linxu:kol", "old KOL unchanged");
    storage.local.setItem("mikoshi:third-party:initial-20261019:demo-u-linxu", "third-party unchanged");
    expect(readKol(user)).toEqual({ ok: true, data: emptyStore() }); expect(storage.local.length).toBe(2);
    const result = await writeKol(user, null, stored()); expect(result.ok).toBe(true);
    expect(readKol("demo-u-xucheng")).toEqual({ ok: true, data: emptyStore() });
    expect(storage.local.getItem("mikoshi.legacy.v1:demo-u-linxu:kol")).toBe("old KOL unchanged");
    expect(storage.local.getItem("mikoshi:third-party:initial-20261019:demo-u-linxu")).toBe("third-party unchanged");
    expect(kolKey("a/b")).not.toBe(kolKey("a%2Fb"));
  });
  it("rejects damaged schemas, references, duplicate identities and unsafe nested fields", () => {
    for (const data of [ { ...stored(), schema: 2 }, stored({ talents: [talent(), talent()] }), stored({ collaborations: [cooperation({ talentId: "missing" })] }), stored({ schedules: [schedule({ collaborationId: "missing" })] }), stored({ talents: [talent({ profileUrl: "javascript:alert(1)" })] }), stored({ talents: [talent({ followers: -1 })] }) ]) expect(decodeStore(JSON.stringify(data))).toMatchObject({ ok: false });
    expect(decodeStore("broken")).toMatchObject({ ok: false });
  });
  it("does not overwrite corrupt stored values", async () => {
    storage.local.setItem(kolKey(user), "corrupt original");
    expect(await writeKol(user, null, stored())).toMatchObject({ ok: false });
    expect(storage.local.getItem(kolKey(user))).toBe("corrupt original");
  });
  it("preserves winner and caller draft on stale writes", async () => {
    const first = await writeKol(user, null, stored()); expect(first.ok).toBe(true);
    const before = storage.local.getItem(kolKey(user)), draft = stored({ talents: [talent({ name: "stale" })] });
    expect(await writeKol(user, null, draft)).toMatchObject({ ok: false, error: expect.stringMatching(/其他窗口/) });
    expect(storage.local.getItem(kolKey(user))).toBe(before); expect(draft.talents[0]?.name).toBe("stale");
  });
  it("reports quota and ignored writes instead of claiming success", async () => {
    storage.local.writeError = new DOMException("Quota", "QuotaExceededError");
    expect(await writeKol(user, null, stored())).toMatchObject({ ok: false, error: expect.stringMatching(/空间不足/) });
    storage.local.writeError = undefined; storage.local.ignoreWrites = true;
    expect(await writeKol(user, null, stored())).toMatchObject({ ok: false, error: expect.stringMatching(/未能确认/) });
    expect(storage.local.getItem(kolKey(user))).toBeNull();
  });
  it("serializes through Web Locks when available", async () => {
    const request = vi.fn(async (_: string, callback: () => unknown) => callback());
    vi.stubGlobal("navigator", { locks: { request } });
    expect(await writeKol(user, null, stored())).toMatchObject({ ok: true });
    expect(request).toHaveBeenCalledWith(kolKey(user), expect.any(Function));
  });
});
