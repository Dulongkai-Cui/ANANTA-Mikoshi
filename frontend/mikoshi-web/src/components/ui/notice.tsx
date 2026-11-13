// 项目基础控件：页面内持久提示（FE-18 Inline notice）。关键状态不只出现在会消失的 toast 中。
import * as React from "react";
import { AlertTriangle, CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/cn";

const toneStyles = {
  info: { box: "border-accent/30 bg-accent-soft", icon: Info, iconClass: "text-accent" },
  success: { box: "border-success/30 bg-success-soft", icon: CircleCheck, iconClass: "text-success" },
  warning: { box: "border-warning/35 bg-warning-soft", icon: AlertTriangle, iconClass: "text-warning" },
  danger: { box: "border-danger/35 bg-danger-soft", icon: CircleAlert, iconClass: "text-danger" },
} as const;

function Notice({
  tone = "info",
  title,
  children,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  tone?: keyof typeof toneStyles;
  title?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const style = toneStyles[tone];
  const Icon = style.icon;
  return (
    <div className={cn("flex gap-3 rounded-card border px-3.5 py-3 text-body text-fg", style.box, className)} {...props}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", style.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("break-anywhere text-fg-secondary", title ? "mt-0.5" : undefined)}>{children}</div>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { Notice };
