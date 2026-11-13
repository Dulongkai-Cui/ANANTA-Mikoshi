"use client";

// 改编自 shadcn/ui new-york-v4 registry `ui/label.tsx`（MIT，SHA d2fba50）。
import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("flex items-center gap-2 text-body font-medium text-fg select-none", className)}
      {...props}
    />
  );
}

export { Label };
