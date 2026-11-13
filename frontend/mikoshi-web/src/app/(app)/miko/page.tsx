import type { Metadata } from "next";
import { MikoPage } from "@/features/miko/miko-page";

export const metadata: Metadata = { title: "MIKO" };

export default function Page() {
  return <MikoPage />;
}
