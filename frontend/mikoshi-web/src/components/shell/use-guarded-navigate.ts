"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useDraft } from "@/features/dashboard/draft-provider";
import { usePublication } from "@/features/third-party/publication-provider";
import { useKol } from "@/features/kol/kol-provider";
import { useWorkbench } from "@/features/workbench/workbench-provider";
import { useKolStudio } from "@/features/kol-studio/kol-studio-provider";
import { KOL_STUDIO_PATH } from "@/features/kol-studio/modules";

/** 站内导航统一入口：有未保存布局时先给出“继续编辑/放弃更改”。 */
export function useGuardedNavigate() {
  const router = useRouter();
  const { requestLeave } = useDraft();
  const { requestLeave: leavePublication } = usePublication();
  const { requestLeave: leaveKol } = useKol();
  const { requestLeave: leaveWorkbench } = useWorkbench();
  const { requestLeave: leaveStudio } = useKolStudio();

  const navigate = React.useCallback(
    (href: string, after?: () => void) => {
      leaveStudio(() => leaveWorkbench(() => leaveKol(() => leavePublication(() => requestLeave(() => {
        if (href.startsWith(`${KOL_STUDIO_PATH}#`) && window.location.pathname.endsWith(KOL_STUDIO_PATH)) {
          window.history.pushState(window.history.state, "", `${window.location.pathname}#${href.split("#")[1]}`);
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        } else router.push(href);
        after?.();
      })))));
    },
    [requestLeave, leavePublication, leaveKol, leaveWorkbench, leaveStudio, router],
  );

  /** 给 <Link> 用的 onClick：保留新标签打开等修饰键行为 */
  const linkHandler = React.useCallback(
    (href: string, after?: () => void) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      navigate(href, after);
    },
    [navigate],
  );

  return { navigate, linkHandler };
}
