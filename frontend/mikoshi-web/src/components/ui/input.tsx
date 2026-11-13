// 改编自 shadcn/ui new-york-v4 registry `ui/input.tsx`（MIT，SHA d2fba50）。
// 改动：控件边界使用 border.control（3:1），focus 使用统一轮廓，错误态用 danger。
import * as React from "react";

import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-control border border-control bg-surface px-3 text-long text-fg sm:h-9 sm:text-body",
        "transition-[border-color,box-shadow] duration-(--motion-fast)",
        "placeholder:text-fg-muted",
        "focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-secondary",
        "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
