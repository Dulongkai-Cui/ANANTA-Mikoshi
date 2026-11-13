import type { Metadata } from "next";

import { LegacyHeader } from "@/features/legacy/legacy-header";

export const metadata: Metadata = { title: "三方号" };

/** 工作台内容由外壳中常驻的 LegacyStage 承载（切换页面时保留状态） */
export default function Page() {
  return <LegacyHeader id="thirdparty" />;
}
