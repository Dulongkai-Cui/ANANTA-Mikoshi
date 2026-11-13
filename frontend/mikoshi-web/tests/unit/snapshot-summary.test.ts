import { describe, expect, it } from "vitest";
import { parseSnapshotSummary } from "@/features/dashboard/snapshot-summary";

const fixture = () => ({
  kol: { works: 2, creators: 1, views: 320, knownViewRecords: 1, missingViews: 1, snapshotAt: null, snapshotLabel: "测试快照", basis: "已知播放求和" },
  thirdParty: { works: 0, accounts: 0, views: 0, knownViewRecords: 0, missingViews: 0, snapshotAt: null, snapshotLabel: "测试快照", basis: "尚无记录", range: { start: null, end: null } },
});

describe("snapshot summary integrity", () => {
  it("保留真实零与缺项区别", () => {
    const result = parseSnapshotSummary(fixture());
    expect(result.kol.views).toBe(320);
    expect(result.thirdParty.works).toBe(0);
  });
  it.each([null, [], {}, { kol: {} }])("拒绝缺失或损坏资产 %j", (value) => expect(() => parseSnapshotSummary(value)).toThrow());
  it.each([-1, NaN, Infinity, 1.5, "320"])('拒绝无效播放数 %j', (views) => {
    const value = fixture();
    expect(() => parseSnapshotSummary({ ...value, kol: { ...value.kol, views } })).toThrow();
  });
  it("拒绝覆盖统计矛盾，不把缺项伪装为完整数据", () => {
    const value = fixture();
    value.kol.missingViews = 0;
    expect(() => parseSnapshotSummary(value)).toThrow();
  });
  it("拒绝缺少口径或无效发布范围", () => {
    const value = fixture();
    value.kol.basis = "";
    expect(() => parseSnapshotSummary(value)).toThrow();
    const another = fixture();
    expect(() => parseSnapshotSummary({ ...another, thirdParty: { ...another.thirdParty, range: null } })).toThrow();
  });
});
