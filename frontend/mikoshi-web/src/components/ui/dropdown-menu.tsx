"use client";

// 改编自 shadcn/ui new-york-v4 registry `ui/dropdown-menu.tsx`（MIT，SHA d2fba50），只保留本步使用的部件。
// 改动：Mikoshi tokens、浮层圆角 12px、动效由 globals.css 统一控制。
import * as React from "react";
import { Check } from "lucide-react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;
const DropdownMenuGroup = MenuPrimitive.Group;
const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="menu-content"
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          "z-(--z-popover) max-h-(--radix-dropdown-menu-content-available-height) min-w-56 overflow-y-auto rounded-overlay border border-line bg-raised p-1.5 text-fg shadow-overlay",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

const itemClass =
  "relative flex min-h-9 cursor-default items-center gap-2.5 rounded-control px-2.5 text-body outline-none select-none data-[disabled]:opacity-55 data-[highlighted]:bg-accent-soft data-[highlighted]:text-fg [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-secondary";

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & { variant?: "default" | "danger" }) {
  return (
    <MenuPrimitive.Item
      className={cn(itemClass, variant === "danger" && "text-danger [&_svg]:text-danger", className)}
      {...props}
    />
  );
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-2.5 py-1.5 text-caption text-fg-muted", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("mx-1 my-1.5 h-px bg-line", className)} {...props} />;
}

function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem className={cn(itemClass, "pr-8", className)} {...props}>
      {children}
      <span className="absolute right-2.5 inline-flex">
        <MenuPrimitive.ItemIndicator>
          <Check className="text-accent" aria-hidden />
        </MenuPrimitive.ItemIndicator>
      </span>
    </MenuPrimitive.RadioItem>
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
