import type { Metadata } from "next";
import { WorkbenchPage } from "@/features/workbench/workbench-page";
export const metadata: Metadata = { title: "人员进度" };
export default function Page() { return <WorkbenchPage view="people" />; }
