"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useKolStudio } from "./kol-studio-provider";
import { KOL_STUDIO_PATH } from "./modules";

export function KolStudioStage() {
  const pathname = usePathname();
  const active = pathname === KOL_STUDIO_PATH;
  const [visited, setVisited] = React.useState(false);
  if (active && !visited) setVisited(true);
  const { status, generation, error, registerFrame, retry } = useKolStudio();
  return <div hidden={!active} className="relative min-h-0 flex-1 bg-canvas">
    {visited && <iframe
      key={generation}
      ref={registerFrame}
      src="/kol-studio/index.html?view=kols&embedded=1"
      title="KOL筛选与创意工作室"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-modals"
      allow="fullscreen"
      className="absolute inset-0 size-full border-0 bg-canvas"
    />}
    {active && status !== "ready" && <div role={status === "error" ? "alert" : "status"} className="absolute inset-0 z-[1] flex flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-semibold text-fg">{status === "error" ? "KOL工作室暂时没有载入" : "正在打开KOL工作室"}</p>
      <p className="mt-2 max-w-md text-caption text-fg-secondary">{status === "error" ? error || "请检查登录状态或资料服务，然后重新载入。" : "正在载入达人档案、创意与作品资料"}</p>
      {status === "error" && <Button className="mt-4" onClick={retry}>重新载入</Button>}
    </div>}
  </div>;
}
