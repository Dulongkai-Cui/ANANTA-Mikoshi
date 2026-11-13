"use client";

import * as React from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/features/auth/session-provider";
import { PreferencesProvider } from "@/features/settings/preferences-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <SessionProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SessionProvider>
    </PreferencesProvider>
  );
}
