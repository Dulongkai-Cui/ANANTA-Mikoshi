"use client";

import * as React from "react";
import { IS_DEMO } from "@/adapters";
import { useKolStudio } from "@/features/kol-studio/kol-studio-provider";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Repeat2, Settings } from "lucide-react";

import { DEMO_PASSWORD, DEMO_USERS } from "@/adapters/demo/users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser, useSession } from "@/features/auth/session-provider";
import { useDraft } from "@/features/dashboard/draft-provider";
import { usePublication } from "@/features/third-party/publication-provider";
import { useKol } from "@/features/kol/kol-provider";
import { useWorkbench } from "@/features/workbench/workbench-provider";
import { cn } from "@/lib/cn";
import { LOGIN_PATH } from "@/lib/routes";

import { useGuardedNavigate } from "./use-guarded-navigate";

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-body font-semibold text-accent",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** 侧栏底部的当前身份与账户菜单 */
export function UserMenu({ collapsed = false, onAction }: { collapsed?: boolean; onAction?: () => void }) {
  const user = useCurrentUser();
  const router = useRouter();
  const { signOut, switchUser } = useSession();
  const { requestLeave } = useDraft();
  const { requestLeave: leavePublication } = usePublication();
  const { requestLeave: leaveKol } = useKol();
  const { requestLeave: leaveWorkbench } = useWorkbench();
  const { requestLeave: leaveStudio } = useKolStudio();
  const { navigate } = useGuardedNavigate();
  const other = IS_DEMO ? DEMO_USERS.find((u) => u.id !== user.id) : undefined;

  const doSignOut = () =>
    leaveStudio(() => leaveWorkbench(() => leaveKol(() => leavePublication(() => requestLeave(
      () => {
        onAction?.();
        void signOut().then((result) => { if (result.ok) router.replace(LOGIN_PATH); });
      },
      { destroysDraft: true },
    )))), { destroysDraft: true });

  const doSwitch = () => {
    if (!other) return;
    leaveStudio(() => leaveWorkbench(() => leaveKol(() => leavePublication(() => requestLeave(
      () => {
        onAction?.();
        void switchUser(other.email, DEMO_PASSWORD);
      },
      { destroysDraft: true },
    )))), { destroysDraft: true });
  };

  const trigger = (
    <DropdownMenuTrigger
      className={cn(
        "group flex w-full min-w-0 items-center gap-2.5 rounded-[9px] p-1.5 text-left text-nav-fg",
        "transition-[background-color] duration-(--motion-fast) hover:bg-nav-hover data-[state=open]:bg-nav-hover",
        collapsed && "justify-center",
      )}
      aria-label={`账户菜单：${user.displayName}（${IS_DEMO ? "演示身份" : user.roleLabel}）`}
    >
      <Avatar initials={user.initials} />
      {!collapsed && (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="break-anywhere font-medium text-nav-fg-strong">{user.displayName}</span>
            <span className="break-anywhere text-caption text-nav-muted">{IS_DEMO ? "演示身份" : user.roleLabel}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-nav-muted" aria-hidden />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">{user.displayName} · 账户</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} className={cn("w-64", onAction && "z-[calc(var(--z-modal)+1)]")}>
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-body font-semibold text-fg">{user.displayName}</span>
          <span className="break-anywhere text-fg-secondary">{user.email}</span>
          <span>{user.roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              onAction?.();
              navigate("/settings");
            }}
          >
            <Settings aria-hidden />
            个人设置
          </DropdownMenuItem>
          {other && (
            <DropdownMenuItem onSelect={doSwitch}>
              <Repeat2 aria-hidden />
              切换为演示身份「{other.displayName}」
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={doSignOut}>
          <LogOut aria-hidden />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
