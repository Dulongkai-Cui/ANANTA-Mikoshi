import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountReferences, decodeCatalog, emptyAccount, emptyStore, homeForUid, isOverdue, isValidDate, matchesScheduleStatus, normalizeUid, shanghaiNow, validateAccount, validateSchedule,
  type AccountInput, type Catalog, type ManagedAccount, type PublicationSchedule, type PublicationStore } from "@/features/third-party/model";
import { decodeStore, publicationKey, readPublication, writePublication } from "@/features/third-party/repository";
import { calendarMonthDays, shiftCalendarMonth, shanghaiToday } from "@/features/third-party/calendar-dates";
import { denyStorageProperty, installStorage } from "./storage-fixture";

const A = "demo-u-linxu", B = "demo-u-xucheng";
const createdAt = "2026-10-19T03:00:00.000Z";
const account = (overrides: Partial<ManagedAccount> = {}): ManagedAccount => ({ ...emptyAccount(), uid: "725090011", name: "测试账号", id: "local:account-a", createdAt, updatedAt: createdAt, ...overrides });
const schedule = (overrides: Partial<PublicationSchedule> = {}): PublicationSchedule => ({ id: "schedule:a", accountId: "local:account-a", title: "上午内容", date: "2026-11-30", time: "09:00", content: "", review: "pending", notes: "", status: "planned", createdAt, updatedAt: createdAt, ...overrides });
const stored = (overrides: Partial<PublicationStore> = {}): PublicationStore => ({ schema: 1, revision: "saved-r1", accounts: [account()], schedules: [schedule()], ...overrides });
const catalog: Catalog = { schema: 1, sourceHash: "a".repeat(64), accounts: [
  { id: "history-a", uid: "111", name: "历史账号", link: homeForUid("111"), suppliers: ["财义"], workCount: 4, view: 8700,
    works: [{ id: "BV-history", title: "真实历史样例", date: "2026-09-01", time: null, view: 8700, like: 0, reply: null, link: "https://www.bilibili.com/video/BV-history" }] },
  { id: "history-no-uid", uid: null, name: "历史缺UID", link: null, suppliers: ["蘑菇"], workCount: 1, view: null, works: [] },
] };

describe("publication identity, historical facts and validation", () => {
  it("hides withdrawn schedules by default but keeps them recoverable and validates restoration", () => {
    const withdrawn = schedule({ status: "withdrawn" });
    expect(matchesScheduleStatus(withdrawn, "")).toBe(false);
    expect(matchesScheduleStatus(withdrawn, "withdrawn")).toBe(true);
    expect(matchesScheduleStatus(schedule({ status: "cancelled" }), "")).toBe(true);
    expect(isOverdue(withdrawn, new Date("2027-01-01"))).toBe(false);
    const store = stored({ schedules: [withdrawn, schedule({ id: "schedule:another" })] });
    expect(decodeStore(JSON.stringify(store))).toEqual({ ok: true, data: store });
    expect(validateSchedule(withdrawn, store, accountReferences(store, null), withdrawn.id)).toEqual({});
    expect(validateSchedule({ ...withdrawn, status: "planned" }, store, accountReferences(store, null), withdrawn.id).time).toBeTruthy();
    const retired = { ...store, accounts: [account({ status: "retired" })], schedules: [withdrawn] };
    expect(validateSchedule({ ...withdrawn, status: "planned" }, retired, accountReferences(retired, null), withdrawn.id).accountId).toBeTruthy();
  });
  it("accepts complete historical boundary data without replacing null or zero metrics", () => {
    expect(decodeCatalog(catalog)).toEqual(catalog);
    expect(decodeCatalog(catalog)?.accounts[0]?.works[0]).toMatchObject({ like: 0, reply: null });
  });

  it("rejects malformed catalog fields and unsafe nested links instead of exposing partial history", () => {
    const first = catalog.accounts[0]!;
    const inputs: unknown[] = [
      { schema: 1, sourceHash: catalog.sourceHash, accounts: [{ id: "broken", name: "broken", works: [] }] },
      { ...catalog, accounts: [{ ...first, suppliers: null }] },
      { ...catalog, accounts: [{ ...first, works: [{ ...first.works[0], like: -1 }] }] },
      { ...catalog, accounts: [{ ...first, works: [{ ...first.works[0], reply: undefined }] }] },
      { ...catalog, accounts: [{ ...first, link: "javascript:alert(1)" }] },
      { ...catalog, accounts: [{ ...first, works: [{ ...first.works[0], link: "https://bilibili.com.evil.invalid/video" }] }] },
      { ...catalog, accounts: [first, first] },
      { ...catalog, sourceHash: "not-a-source-hash" },
    ];
    for (const value of inputs) expect(decodeCatalog(value)).toBeNull();
  });

  it("normalizes a UID without losing 20-digit identity precision", () => {
    expect(normalizeUid(" 000725090011 ")).toBe("725090011");
    expect(normalizeUid("12345678901234567890")).toBe("12345678901234567890");
    expect(validateAccount({ ...emptyAccount(), uid: " 000725090011 ", name: "新账号", group: "伏羲" }, emptyStore())).toEqual({});
    expect(homeForUid("12345678901234567890")).toBe("https://space.bilibili.com/12345678901234567890");
  });

  it.each(["0", "-12", "1e3", "https://space.bilibili.com/12", "1/../2", "123456789012345678901", "１２３"])('rejects invalid UID "%s"', (uid) => {
    expect(validateAccount({ ...emptyAccount(), name: "昵称", uid }, emptyStore()).uid).toBeTruthy();
  });

  it("rejects normalized duplicate UID and edits that replace an existing identity", () => {
    const value = stored();
    expect(validateAccount({ ...account(), uid: "000725090011" }, value).uid).toMatch(/已入库/);
    expect(validateAccount(account({ name: "已修改昵称", group: "伏羲" }), value, "local:account-a")).toEqual({});
    expect(validateAccount(account({ uid: "725090012" }), value, "local:account-a").uid).toMatch(/不可更换/);
  });

  it("validates management field bounds, statuses and ownership without inventing supplier equivalence", () => {
    const invalid = { ...account(), name: " ", group: "财义", status: "published", phone: "1".repeat(41), notes: "字".repeat(2001) } as unknown as AccountInput;
    expect(validateAccount(invalid, emptyStore())).toMatchObject({ name: expect.any(String), group: expect.any(String), status: expect.any(String), phone: expect.any(String), notes: expect.any(String) });
    expect(validateAccount(account({ group: "伏羲", supplier: "财义" }), emptyStore())).toEqual({});
  });

  it("merges management overlays without duplicating history or changing source facts", () => {
    const source = structuredClone(catalog);
    const local = account({ id: "snapshot:history-a", uid: "111", name: "管理昵称", group: "伏羲", supplier: "人工供应商" });
    const refs = accountReferences(stored({ accounts: [local, account()], schedules: [] }), catalog);
    expect(refs).toHaveLength(3);
    expect(refs.find(a => a.id === "snapshot:history-a")).toMatchObject({ name: "管理昵称", group: "伏羲", uid: "111", history: { suppliers: ["财义"], workCount: 4, view: 8700 } });
    expect(refs.find(a => a.id === "snapshot:history-no-uid")).toMatchObject({ uid: null, link: null, history: { view: null } });
    expect(refs.find(a => a.id === "local:account-a")?.history).toBeUndefined();
    expect(catalog).toEqual(source);
  });

  it("new local and missing-UID historical accounts are immediately schedulable", () => {
    const value = stored({ schedules: [] });
    const refs = accountReferences(value, catalog);
    expect(validateSchedule(schedule(), value, refs)).toEqual({});
    expect(validateSchedule(schedule({ accountId: "snapshot:history-no-uid" }), value, refs)).toEqual({});
  });

  it("supplementing the missing historical UID preserves snapshot identity and earlier schedule references", () => {
    const history = structuredClone(catalog);
    const local = account({ id: "snapshot:history-no-uid", uid: "725090022", name: "补充后昵称", group: "蘑菇" });
    const value = stored({ accounts: [local], schedules: [schedule({ accountId: "snapshot:history-no-uid" })] });
    const refs = accountReferences(value, catalog);
    expect(refs.find(a => a.id === "snapshot:history-no-uid")).toMatchObject({ uid: "725090022", link: homeForUid("725090022"), name: "补充后昵称", history: { id: "history-no-uid", uid: null, workCount: 1 } });
    expect(refs.filter(a => a.uid === "725090022")).toHaveLength(1);
    expect(validateSchedule(value.schedules[0]!, value, refs, "schedule:a")).toEqual({});
    expect(catalog).toEqual(history);
  });

  it("permits separate same-day plans but rejects the same active account/date/time", () => {
    const value = stored(), refs = accountReferences(value, null);
    expect(validateSchedule(schedule({ id: "schedule:b", time: "18:00" }), value, refs)).toEqual({});
    expect(validateSchedule(schedule({ id: "schedule:b" }), value, refs).time).toMatch(/已有排期/);
    expect(validateSchedule(schedule(), value, refs, "schedule:a")).toEqual({});
    expect(validateSchedule(schedule({ date: "2026-12-01" }), value, refs)).toEqual({});
    expect(validateSchedule(schedule({ status: "cancelled" }), value, refs)).toEqual({});
    expect(validateSchedule(schedule(), stored({ schedules: [schedule({ status: "cancelled" })] }), refs)).toEqual({});
  });

  it("retired accounts may cancel existing plans but cannot create or restore them", () => {
    const value = stored({ accounts: [account({ status: "retired" })] }), refs = accountReferences(value, null);
    expect(validateSchedule(schedule(), value, refs, "schedule:a").accountId).toMatch(/停用/);
    expect(validateSchedule(schedule({ status: "cancelled" }), value, refs, "schedule:a")).toEqual({});
    expect(validateSchedule(schedule({ accountId: "unknown" }), value, refs).accountId).toBeTruthy();
  });

  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-01", "1999-12-31", "2101-01-01"])('rejects impossible/out-of-range date "%s"', (date) => {
    expect(isValidDate(date)).toBe(false);
    expect(validateSchedule(schedule({ date }), stored({ schedules: [] }), accountReferences(stored(), null)).date).toBeTruthy();
  });
  it.each(["24:00", "12:60", "9:00", "12:00:30"])('rejects malformed time "%s"', (time) => {
    expect(validateSchedule(schedule({ time }), stored({ schedules: [] }), accountReferences(stored(), null)).time).toBeTruthy();
  });

  it("empty content stays valid and overdue is a Shanghai-time warning, never a publication mutation", () => {
    const value = schedule({ date: "2026-10-19", time: "08:00" });
    const before = structuredClone(value);
    expect(validateSchedule(value, stored({ schedules: [] }), accountReferences(stored(), null))).toEqual({});
    expect(isOverdue(value, new Date("2026-10-18T23:59:59Z"))).toBe(false);
    expect(isOverdue(value, new Date("2026-10-19T00:00:01Z"))).toBe(true);
    expect(isOverdue({ ...value, status: "cancelled" }, new Date("2027-01-01T00:00:00Z"))).toBe(false);
    expect(value).toEqual(before);
    expect(shanghaiNow(new Date("2026-12-31T16:30:00Z"))).toEqual({ date: "2027-01-01", time: "00:30" });
    expect(shanghaiToday(new Date("2026-12-31T16:30:00Z"))).toBe("2027-01-01");
  });

  it("calendar always has 42 consecutive Monday-first dates including leap/year boundaries", () => {
    for (const month of ["2026-11-30", "2028-02-29", "2027-01-01"]) {
      const days = calendarMonthDays(month);
      expect(days).toHaveLength(42); expect(new Set(days).size).toBe(42);
      expect(new Date(`${days[0]}T00:00:00Z`).getUTCDay()).toBe(1);
      expect(days).toContain(month.slice(0, 7) + "-01");
      for (let i = 1; i < days.length; i++) expect(Date.parse(days[i]!) - Date.parse(days[i - 1]!)).toBe(86_400_000);
    }
    expect(shiftCalendarMonth("2026-03-31", -1)).toBe("2026-02-28");
    expect(shiftCalendarMonth("2028-03-31", -1)).toBe("2028-02-29");
    expect(shiftCalendarMonth("2026-12-31", 1)).toBe("2027-01-31");
  });
});

describe("publication repository persistence and conflict boundaries", () => {
  let storage: ReturnType<typeof installStorage>;
  beforeEach(() => { storage = installStorage(); vi.stubGlobal("navigator", {}); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("starts the initialized dataset empty without altering archived or unrelated browser data", async () => {
    const oldA = `mikoshi:third-party:v1:${A}`, oldB = `mikoshi:third-party:v1:${B}`;
    const original = JSON.stringify(stored());
    storage.local.setItem(oldA, original);
    storage.local.setItem(oldB, "unparseable archive preserved exactly");
    const kolKey = `mikoshi.legacy.v1:${A}:kol:notes`;
    storage.local.setItem(kolKey, "KOL notes");
    storage.local.setItem("mikoshi-preferences", "preferences");
    expect(readPublication(A)).toEqual({ ok: true, data: emptyStore() });
    expect(readPublication(B)).toEqual({ ok: true, data: emptyStore() });
    const result = await writePublication(A, null, stored({ revision: null }));
    expect(result.ok).toBe(true);
    expect(readPublication(A)).toEqual({ ok: true, data: result.data });
    expect(storage.local.getItem(oldA)).toBe(original);
    expect(storage.local.getItem(oldB)).toBe("unparseable archive preserved exactly");
    expect(storage.local.getItem(kolKey)).toBe("KOL notes");
    expect(storage.local.getItem("mikoshi-preferences")).toBe("preferences");
  });

  it("loads empty without writes, persists fresh revisions and keeps identities separate", async () => {
    expect(readPublication(A)).toEqual({ ok: true, data: emptyStore() });
    expect(storage.local.length).toBe(0);
    const draft = stored({ revision: null }), before = structuredClone(draft);
    const first = await writePublication(A, null, draft);
    expect(first.ok).toBe(true); expect(first.data?.revision).toEqual(expect.any(String));
    expect(first.data?.revision).not.toBeNull();
    expect(readPublication(A)).toEqual({ ok: true, data: first.data });
    expect(readPublication(B)).toEqual({ ok: true, data: emptyStore() });
    expect(storage.local.getItem(publicationKey(B))).toBeNull();
    expect(draft).toEqual(before);
    const second = await writePublication(A, first.data!.revision, { ...first.data!, accounts: [account({ name: "修改后" })] });
    expect(second.ok).toBe(true); expect(second.data?.revision).not.toBe(first.data?.revision);
    expect(publicationKey("a/b")).not.toBe(publicationKey("a%2Fb"));
  });

  it("rejects stale writes and leaves both winner and caller draft intact", async () => {
    const initial = readPublication(A); expect(initial.ok).toBe(true);
    const stale = stored({ revision: null, accounts: [account({ name: "落后草稿" })] });
    const before = structuredClone(stale);
    await writePublication(A, null, stored({ revision: null, accounts: [account({ name: "最新记录" })] }));
    const winner = storage.local.getItem(publicationKey(A));
    expect(await writePublication(A, null, stale)).toMatchObject({ ok: false, error: expect.stringMatching(/其他窗口.*草稿已保留/) });
    expect(storage.local.getItem(publicationKey(A))).toBe(winner); expect(stale).toEqual(before);
  });

  it("edits/cancels by stable schedule ID without changing a sibling on the same day", async () => {
    const second = schedule({ id: "schedule:b", time: "18:00", title: "下午内容" });
    const first = await writePublication(A, null, stored({ revision: null, schedules: [schedule(), second] }));
    const edited = { ...schedule(), date: "2026-12-01", time: "10:00" };
    const next = await writePublication(A, first.data!.revision, { ...first.data!, schedules: [edited, second] });
    expect(next.data?.schedules.find(s => s.id === "schedule:b")).toEqual(second);
    const cancelled = await writePublication(A, next.data!.revision, { ...next.data!, schedules: [edited, { ...second, status: "cancelled" }] });
    expect(cancelled.data?.schedules.find(s => s.id === "schedule:a")).toEqual(edited);
    expect(cancelled.data?.schedules.find(s => s.id === "schedule:b")?.status).toBe("cancelled");
  });

  it.each([
    "{broken", JSON.stringify({ ...stored(), schema: 2 }), JSON.stringify({ ...stored(), revision: 2 }),
    JSON.stringify({ ...stored(), accounts: [account(), account()] }),
    JSON.stringify({ ...stored(), accounts: [account(), account({ id: "local:b" })] }),
    JSON.stringify({ ...stored(), schedules: [schedule(), schedule()] }),
    JSON.stringify({ ...stored(), schedules: [schedule({ date: "2026-02-30" })] }),
  ])("preserves malformed/unsupported raw storage and prevents save-over recovery", async (raw) => {
    storage.local.setItem(publicationKey(A), raw);
    expect(readPublication(A)).toMatchObject({ ok: false, error: expect.stringMatching(/损坏|版本/) });
    expect(await writePublication(A, null, emptyStore())).toMatchObject({ ok: false });
    expect(storage.local.getItem(publicationKey(A))).toBe(raw);
  });

  it("refuses invalid new store shape before writing", async () => {
    expect(decodeStore(JSON.stringify({ ...stored(), accounts: [account({ uid: "0001" })] })).ok).toBe(false);
    const result = await writePublication(A, null, stored({ revision: null, schedules: [schedule({ time: "24:30" })] }));
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/校验失败/) });
    expect(storage.local.length).toBe(0);
  });

  it("reports inaccessible storage rather than creating defaults or claiming success", async () => {
    denyStorageProperty(storage.browser, "localStorage");
    expect(readPublication(A)).toMatchObject({ ok: false, error: expect.stringMatching(/读取/) });
    expect(await writePublication(A, null, emptyStore())).toMatchObject({ ok: false });
    expect(storage.local.length).toBe(0);
  });

  it.each([[new DOMException("Full", "QuotaExceededError"), /空间不足/], [new DOMException("Denied", "SecurityError"), /无法写入/], [new Error("Write failed"), /无法写入/]])("preserves persisted records and draft after write failure", async (error, message) => {
    const initial = await writePublication(A, null, stored({ revision: null }));
    const before = storage.local.getItem(publicationKey(A));
    const draft = { ...initial.data!, accounts: [account({ name: "仍在草稿" })] }, copy = structuredClone(draft);
    storage.local.writeError = error as Error;
    expect(await writePublication(A, initial.data!.revision, draft)).toMatchObject({ ok: false, error: expect.stringMatching(message as RegExp) });
    expect(storage.local.getItem(publicationKey(A))).toBe(before); expect(draft).toEqual(copy);
  });

  it("serializes cooperating concurrent writers with Web Locks and rejects the stale loser", async () => {
    let queue = Promise.resolve();
    const names: string[] = [];
    const request = (name: string, callback: () => unknown) => {
      names.push(name);
      const pending = queue.then(callback);
      queue = pending.then(() => undefined, () => undefined);
      return pending;
    };
    vi.stubGlobal("navigator", { locks: { request } });
    const results = await Promise.all([
      writePublication(A, null, stored({ revision: null, accounts: [account({ name: "第一个提交" })] })),
      writePublication(A, null, stored({ revision: null, accounts: [account({ name: "另一个草稿" })] })),
    ]);
    expect(names).toEqual([publicationKey(A), publicationKey(A)]);
    expect(results.map(r => r.ok)).toEqual([true, false]);
    expect(readPublication(A)).toMatchObject({ ok: true, data: { accounts: [{ name: "第一个提交" }] } });
  });

  it("a rejected lock request reports failure and never writes", async () => {
    vi.stubGlobal("navigator", { locks: { request: () => Promise.reject(new Error("lock denied")) } });
    expect(await writePublication(A, null, stored({ revision: null }))).toMatchObject({ ok: false, error: expect.stringMatching(/保存未完成/) });
    expect(storage.local.length).toBe(0);
  });
});
