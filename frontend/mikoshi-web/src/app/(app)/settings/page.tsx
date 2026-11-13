import type { Metadata } from "next";

import { SettingsPage } from "@/features/settings/settings-page";
import { TeamAccessPanel } from "@/features/auth/team-access-panel";

export const metadata: Metadata = { title: "个人设置" };

export default function Page() {
  return <><SettingsPage /><TeamAccessPanel /></>;
}
