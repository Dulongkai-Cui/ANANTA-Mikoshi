import type { LegacySummary } from "@/features/legacy/modules";

const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const count = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const nullableText = (v: unknown) => v === null || typeof v === "string";

/** 静态资产也可能缺失或损坏；不得将无效汇总呈现成 0 / NaN 或已加载成功。 */
export function parseSnapshotSummary(value: unknown): LegacySummary {
  if (!record(value)) throw new Error("Invalid snapshot summary");
  for (const [key, entityKey] of [["kol", "creators"], ["thirdParty", "accounts"]] as const) {
    const section = value[key];
    if (!record(section) || !count(section.works) || !count(section[entityKey]) || !count(section.views)
      || !count(section.knownViewRecords) || !count(section.missingViews)
      || section.knownViewRecords + section.missingViews !== section.works
      || typeof section.basis !== "string" || !section.basis.trim()
      || typeof section.snapshotLabel !== "string" || !section.snapshotLabel.trim()
      || !nullableText(section.snapshotAt)) {
      throw new Error("Invalid snapshot section");
    }
  }
  const thirdParty = value.thirdParty as Record<string, unknown>;
  if (!record(thirdParty.range) || !nullableText(thirdParty.range.start) || !nullableText(thirdParty.range.end)) {
    throw new Error("Invalid snapshot range");
  }
  return value as unknown as LegacySummary;
}
