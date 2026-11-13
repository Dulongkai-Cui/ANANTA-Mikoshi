import type { Metadata } from "next";
import { WorkbenchPage } from "@/features/workbench/workbench-page";

export const metadata: Metadata = { title: "我的工作台" };

export default function Page() {
  return <WorkbenchPage />;
}
