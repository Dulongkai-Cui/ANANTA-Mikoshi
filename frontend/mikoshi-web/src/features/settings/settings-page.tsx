"use client";

import * as React from "react";
import { IS_DEMO } from "@/adapters";
import { Monitor, Moon, Sun } from "lucide-react";

import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Avatar } from "@/components/shell/user-menu";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import type { ThemePreference } from "@/contracts/preferences";
import { useCurrentUser } from "@/features/auth/session-provider";
import { cn } from "@/lib/cn";

import { usePreferences, type PersistenceStatus } from "./preferences-provider";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "system", label: "跟随系统", icon: Monitor },
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
];

function Row({ label, description, children, htmlFor }: { label: string; description?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col flex-wrap gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-x-8">
      <div className="min-w-0 flex-1 sm:flex-[1_1_12rem]">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="font-medium text-fg">
            {label}
          </label>
        ) : (
          <p className="font-medium text-fg">{label}</p>
        )}
        {description && <div className="mt-0.5 text-fg-secondary">{description}</div>}
      </div>
      <div className="min-w-0 max-w-full">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const user = useCurrentUser();
  const { preferences, persistence, systemReducedMotion, systemDark, setTheme, setMotion } = usePreferences();
  const motionReduced = systemReducedMotion || preferences.motion === "reduce";
  const [announcement, setAnnouncement] = React.useState("");

  const announce = (text: string, status: PersistenceStatus) => setAnnouncement(status === "persisted" ? text : `${text}（仅本次会话有效）`);

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="SETTINGS" title="个人设置" description={IS_DEMO ? "当前演示身份与本浏览器的外观偏好。" : "当前团队身份与本浏览器的外观偏好。"} />

      {persistence === "session-only" && (
        <Notice tone="warning" title="设置仅在本次会话有效" className="mb-6">
          浏览器不允许保存本地偏好，刷新或关闭页面后会恢复默认。
        </Notice>
      )}
      {persistence === "recovered" && (
        <Notice tone="info" title="已改用默认偏好" className="mb-6">
          之前保存的偏好无法读取，现在显示默认值。修改任意一项后会重新保存。
        </Notice>
      )}

      <section aria-labelledby="settings-identity" className="mb-8">
        <SectionTitle id="settings-identity">身份</SectionTitle>
        <div className="mt-3 flex items-center gap-4 rounded-card bg-surface px-5 py-4 shadow-card">
          <Avatar initials={user.initials} className="size-11 text-section" />
          <dl className="min-w-0 flex-1">
            <dt className="sr-only">姓名</dt>
            <dd className="flex flex-wrap items-center gap-2 font-semibold text-fg">
              {user.displayName}
              <Badge tone="sample">{IS_DEMO ? "演示身份" : user.roleLabel}</Badge>
            </dd>
            <dt className="sr-only">邮箱</dt>
            <dd className="break-anywhere text-fg-secondary">{user.email}</dd>
            <dt className="sr-only">角色</dt>
            <dd className="text-caption text-fg-muted">{user.roleLabel}</dd>
          </dl>
        </div>
        <p className="mt-2 text-caption text-fg-muted">{IS_DEMO ? "演示身份为只读，不能修改资料或密码。" : "KOL筛选与策划共用团队服务器资料；原发布管理、三方号和我的工作台仍为本浏览器资料。邮箱用作登录标识，未提供邮件验证或自助找回密码。"}</p>
      </section>

      <section aria-labelledby="settings-appearance" className="mb-8">
        <SectionTitle id="settings-appearance">外观</SectionTitle>
        <div className="mt-3 divide-y divide-line/70 rounded-card bg-surface shadow-card">
          <Row
            label="主题"
            description={preferences.theme === "system" ? `跟随系统，当前为${systemDark ? "深色" : "浅色"}` : "固定使用所选主题"}
          >
            <div role="radiogroup" aria-label="主题" className="inline-flex max-w-full flex-wrap rounded-[8px] bg-subtle p-0.5">
              {THEME_OPTIONS.map((o) => {
                const Icon = o.icon;
                const checked = preferences.theme === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabIndex={checked ? 0 : -1}
                    onClick={() => {
                      announce(`主题已设为${o.label}`, setTheme(o.value));
                    }}
                    onKeyDown={(e) => {
                      const idx = THEME_OPTIONS.findIndex((x) => x.value === preferences.theme);
                      const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                      if (!delta) return;
                      e.preventDefault();
                      const next = THEME_OPTIONS[(idx + delta + THEME_OPTIONS.length) % THEME_OPTIONS.length];
                      if (!next) return;
                      announce(`主题已设为${next.label}`, setTheme(next.value));
                      const group = e.currentTarget.parentElement;
                      requestAnimationFrame(() => group?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus());
                    }}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 font-medium sm:min-h-8",
                      "transition-[background-color,color,box-shadow] duration-(--motion-fast)",
                      checked ? "bg-raised text-fg shadow-card" : "text-fg-secondary hover:text-fg",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </Row>
          <Row
            label="减少动效"
            htmlFor="settings-motion"
            description={
              systemReducedMotion
                ? "系统已要求减少动态效果，这里无法关闭。"
                : "关闭浮层、侧栏的过渡动画，界面直接切换。"
            }
          >
            <button
              id="settings-motion"
              type="button"
              role="switch"
              aria-checked={motionReduced}
              disabled={systemReducedMotion}
              onClick={() => {
                const next = preferences.motion === "reduce" ? "system" : "reduce";
                announce(next === "reduce" ? "已开启减少动效" : "已关闭减少动效", setMotion(next));
              }}
              className={cn(
                "relative inline-flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-control",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <span className="sr-only">{motionReduced ? "已开启" : "已关闭"}</span>
              <span aria-hidden className={cn("inline-flex h-6 w-10 items-center rounded-full border transition-[background-color,border-color] duration-(--motion-fast)", motionReduced ? "border-accent bg-accent" : "border-control bg-subtle")}><span
                aria-hidden
                className={cn(
                  "inline-block size-[18px] rounded-full shadow-card",
                  "transition-transform duration-(--motion-fast) ease-(--ease-move) reduce-motion:transition-none",
                  motionReduced ? "translate-x-[18px] bg-on-accent" : "translate-x-[2px] bg-raised",
                )}
              /></span>
            </button>
          </Row>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </section>

      <section aria-labelledby="settings-storage">
        <SectionTitle id="settings-storage">本地数据说明</SectionTitle>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-fg-secondary marker:text-fg-muted">
          <li>主题和减少动效保存在本浏览器，本站身份共用。</li>
          <li>工作台及原发布管理按身份分别保存在本浏览器，不会同步到其他设备。KOL筛选与策划使用团队数据库。</li>
          <li>{IS_DEMO ? "登录状态保存在当前标签页的会话存储中，不保存密码。浏览器恢复标签页时可能恢复会话，请用退出登录清除。" : "登录使用服务器校验的安全 Cookie，最长 7 天。退出登录会撤销当前会话。"}</li>
        </ul>
      </section>
    </div>
  );
}
