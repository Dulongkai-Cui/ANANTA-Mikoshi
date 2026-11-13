"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { NeutralShell } from "@/components/shell/app-shell";
import { useSession } from "@/features/auth/session-provider";
import { HOME_PATH, LOGIN_PATH } from "@/lib/routes";

/** `/`：根据演示会话导向首页或登录（SPEC §3） */
export default function RootRedirect() {
  const { state } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (state.status === "checking") return;
    router.replace(state.status === "authenticated" ? HOME_PATH : LOGIN_PATH);
  }, [state, router]);

  return <NeutralShell />;
}
