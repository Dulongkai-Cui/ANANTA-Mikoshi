// 改编自 shadcn/ui new-york-v4 registry `ui/button.tsx`（MIT，SHA d2fba50）。
// 改动：映射 Mikoshi tokens；transition 仅列出属性（FE-41 禁止 transition:all）；
// 增加 pending 状态（FE-18：保留宽度与动作名称，阻止重复提交）。
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none max-sm:min-h-11 max-sm:min-w-11",
    "transition-[background-color,border-color,color,box-shadow] duration-(--motion-fast) ease-(--ease-enter)",
    "disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-on-accent shadow-primary hover:bg-accent-hover active:bg-accent-hover active:shadow-none",
        secondary:
          "border border-control/40 bg-surface text-fg shadow-control hover:border-control/60 hover:bg-canvas active:bg-subtle",
        ghost: "text-fg-secondary hover:bg-hover hover:text-fg active:bg-pressed",
        danger:
          "border border-danger/50 bg-surface text-danger hover:bg-danger-soft active:bg-danger-soft",
        link: "h-auto px-0 text-accent underline-offset-4 hover:underline",
      },
      size: {
        md: "h-9 px-3.5 text-body",
        lg: "h-10 px-4 text-body",
        sm: "h-8 px-2.5 text-body",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** 提交中：保留原文字宽度，显示进度并阻止再次触发 */
    pending?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  pending = false,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      data-slot="button"
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      // pending 时保持可聚焦（不丢焦点），通过 aria-disabled 与拦截点击阻止重复提交
      aria-disabled={pending || undefined}
      disabled={disabled}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={cn(buttonVariants({ variant, size, className }), pending && "cursor-progress")}
      {...props}
    >
      {pending ? (
        <>
          <span className="invisible inline-flex items-center gap-2">{children}</span>
          <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
            <Loader2 aria-hidden className="animate-spin reduce-motion:animate-none" />
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { Button, buttonVariants };
