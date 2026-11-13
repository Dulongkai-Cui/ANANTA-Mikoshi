import type { Metadata } from "next";
import { WorkbenchPage } from "@/features/workbench/workbench-page";
export const metadata: Metadata = { title: "任务看板" };
export default function Page() { return <WorkbenchPage view="tasks" />; }
