"use client";

// 改编自 shadcn/ui new-york-v4 registry `ui/sheet.tsx`（MIT，SHA d2fba50），只保留左侧导航抽屉一种形态。
// 改动：时长从 300/500ms 改为 motion.panel/normal（220/160ms），尊重减少动效；中文关闭名称。
import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DrawerPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

const Drawer = DrawerPrimitive.Root;
const DrawerTitle = DrawerPrimitive.Title;
const DrawerDescription = DrawerPrimitive.Description;
const DrawerClose = DrawerPrimitive.Close;

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay data-slot="overlay" className="fixed inset-0 z-(--z-modal) bg-scrim" />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed inset-y-0 left-0 z-(--z-modal) flex h-full w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-line bg-canvas text-fg shadow-overlay",
          className,
        )}
        {...props}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-color:var(--nav-muted)_transparent] [scrollbar-width:thin]">
          {children}
        </div>
        <DrawerPrimitive.Close
          className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-control text-fg-secondary transition-[background-color,color] duration-(--motion-fast) hover:bg-hover hover:text-fg"
          aria-label="关闭导航"
        >
          <X className="size-5" aria-hidden />
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle };
