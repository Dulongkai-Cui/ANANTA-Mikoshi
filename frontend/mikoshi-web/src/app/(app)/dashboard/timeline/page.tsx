import type { Metadata } from "next";
import { WorkbenchPage } from "@/features/workbench/workbench-page";
export const metadata: Metadata = { title: "项目时间轴" };
export default function Page() { return <WorkbenchPage view="timeline" />; }
