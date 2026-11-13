import type { Metadata } from "next";
import { WorkbenchPage } from "@/features/workbench/workbench-page";
export const metadata: Metadata = { title: "KOL协作概览" };
export default function Page() { return <WorkbenchPage view="kol" />; }
