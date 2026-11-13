import { describe, expect, it } from "vitest";

import { safeBilibiliUrl, thirdpartyCatalog } from "../../scripts/sync-legacy.mjs";

describe("historical account catalog", () => {
  it("retains original account identities and emits the latest three real works without fabricating missing metrics", () => {
    const records = [
      { id: "old", account: "uid:7", title: "旧作", date: "2026-08-01", time: "20:00", supplier: "财义", view: 10 },
      { id: "same-day-early", account: "uid:7", title: "早", date: "2026-09-01", time: "09:00", supplier: "蘑菇", view: 0, like: 0, reply: null },
      { id: "latest", account: "uid:7", title: "新作", date: "2026-09-02", time: "10:00", supplier: "蘑菇", view: 5, like: 2, reply: 0, link: "https://www.bilibili.com/video/BV1test/" },
      { id: "same-day-late", account: "uid:7", title: "晚", date: "2026-09-01", time: "18:00", supplier: "蘑菇", view: 3, link: "javascript:alert(1)" },
      { id: "unmatched-uid", account: "name:原名称", date: "2026-09-02", supplier: "财义", view: null },
    ];
    const data = {
      profiles: [
        { id: "uid:7", uid: "7", name: "作者", link: "https://space.bilibili.com/7" },
        { id: "name:原名称", uid: null, name: "原名称", link: null },
      ], records,
    };
    const before = JSON.stringify(data);
    const catalog = thirdpartyCatalog(data, "source-sha");
    expect(JSON.stringify(data)).toBe(before);
    expect(catalog.schema).toBe(1);
    expect(catalog.sourceHash).toBe("source-sha");
    const [known, missing] = catalog.accounts;
    if (!known || !missing) throw new Error("Expected both historical profiles to remain in the catalog");
    expect(known).toMatchObject({ id: "uid:7", uid: "7", workCount: 4, view: 18, suppliers: ["蘑菇", "财义"] });
    expect(known.works.map((work) => work.id)).toEqual(["latest", "same-day-late", "same-day-early"]);
    expect(known.works[0]).toMatchObject({ view: 5, like: 2, reply: 0 });
    expect(known.works[1]).toMatchObject({ like: null, reply: null, link: null });
    expect(known.works[2]).toMatchObject({ view: 0, like: 0, reply: null });
    expect(missing).toMatchObject({ id: "name:原名称", uid: null, link: null, workCount: 1, view: null });
    expect(missing.works[0]).toMatchObject({ title: null, time: null, view: null });
  });

  it("keeps a partly unknown total unknown rather than presenting a partial sum as the full effect", () => {
    const catalog = thirdpartyCatalog({ profiles: [{ id: "a", name: "A" }, { id: "empty", name: "B" }], records: [{ id: "1", account: "a", view: 8 }, { id: "2", account: "a", view: null }] }, "hash");
    expect(catalog.accounts.map((account) => account.view)).toEqual([null, null]);
    expect(catalog.accounts[1]).toMatchObject({ workCount: 0 });
  });

  it.each(["javascript:alert(1)", "https://bilibili.com.evil.test/", "https://evil.test/?bilibili.com", "https://x@space.bilibili.com/1", "ftp://space.bilibili.com/1", "//space.bilibili.com/1", "https://space.bilibili.com:4000/1", null])("rejects unsafe or non-Bilibili links %s", (value) => {
    expect(safeBilibiliUrl(value)).toBeNull();
  });

  it("accepts canonical HTTP(S) Bilibili profile and work URLs", () => {
    expect(safeBilibiliUrl("https://space.bilibili.com/7")).toBe("https://space.bilibili.com/7");
    expect(safeBilibiliUrl("http://www.bilibili.com/video/BV1test/")).toBe("http://www.bilibili.com/video/BV1test/");
  });

  it("fails on broken historical identities instead of silently dropping work", () => {
    expect(() => thirdpartyCatalog({ profiles: [{ id: "a", name: "A" }], records: [{ id: "1", account: "missing" }] }, "hash")).toThrow("no matching account");
    expect(() => thirdpartyCatalog({ profiles: [{ id: "a", name: "A" }, { id: "a", name: "A" }], records: [] }, "hash")).toThrow("duplicate");
  });
});
