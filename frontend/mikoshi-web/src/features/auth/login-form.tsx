"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, FlaskConical } from "lucide-react";

import { DEMO_PASSWORD, DEMO_USERS } from "@/adapters/demo/users";
import { BrandLogo } from "@/components/shell/brand";
import { Avatar } from "@/components/shell/user-menu";
import { NeutralShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import type { SessionIssue, SignInError } from "@/contracts/auth";
import { cn } from "@/lib/cn";
import { HOME_PATH, sanitizeReturnTo } from "@/lib/routes";

import { SESSION_ISSUE_TEXT, useSession } from "./session-provider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

const SIGN_IN_ERROR_TEXT: Record<SignInError["code"], { title: string; body: string }> = {
  invalid_credentials: {
    title: "邮箱或密码不正确",
    body: "请使用下方的演示账号。可以点“填入”自动填写邮箱和密码。",
  },
  storage_unavailable: {
    title: "本地会话无法建立",
    body: "浏览器阻止了会话存储，演示登录没有生效。请允许本站使用存储（或退出隐私模式限制）后重试。",
  },
  not_configured: {
    title: "正式身份服务尚未接入",
    body: "当前构建处于正式模式，但身份服务还没有配置，所以无法登录。本地演示请使用 demo 模式构建。",
  },
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "请输入邮箱";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "邮箱格式不正确，例如 name@example.com";
  if (!password) errors.password = "请输入密码";
  return errors;
}

export function LoginForm() {
  const { state, mode, signIn } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = sanitizeReturnTo(params.get("returnTo"));
  const rawIssue = params.get("issue");
  const issue: SessionIssue | null = state.status === "invalid" ? state.issue :
    rawIssue === "corrupted" || rawIssue === "storage_unavailable" || rawIssue === "not_configured" ? rawIssue : null;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<SignInError["code"] | null>(null);
  const [pending, setPending] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);
  const submitting = React.useRef(false);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  // 已登录访问 /login 回到首页
  React.useEffect(() => {
    if (state.status === "authenticated") router.replace(succeeded ? (returnTo ?? HOME_PATH) : HOME_PATH);
  }, [state, router, succeeded, returnTo]);

  const fillDemo = (index: number) => {
    const user = DEMO_USERS[index];
    if (!user) return;
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return; // 防重复提交（双击、连按 Enter）
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email) return emailRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    submitting.current = true;
    setPending(true);
    const result = await signIn(email.trim(), password);
    if (result.ok) {
      setSucceeded(true);
      return; // 跳转由上面的 effect 完成；保持 pending 直到离开
    }
    submitting.current = false;
    setPending(false);
    setFormError(result.error.code);
    // 失败保留输入；把焦点交给错误摘要以便读屏获知
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  if (state.status === "checking" || state.status === "authenticated") return <NeutralShell />;

  const notConfigured = mode === "unconfigured";
  const errorText = formError ? SIGN_IN_ERROR_TEXT[formError] : null;

  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas lg:flex-row">
      {/* 深蓝工作台风格，使用用户选定的 Mikoshi 品牌。 */}
      <aside
        aria-label="品牌"
        className="relative flex shrink-0 flex-col justify-between overflow-hidden bg-sidebar px-6 py-6 text-nav-fg lg:w-[min(44vw,560px)] lg:px-12 lg:py-12"
      >
        <BrandLogo className="items-start text-left [&>img]:w-16 lg:[&>img]:w-28 lg:[&>span:first-of-type]:text-[1.75rem] lg:[&>span:first-of-type]:leading-10" />
        <div className="relative mt-6 hidden lg:block">
          <p className="text-eyebrow font-semibold tracking-[0.2em] text-nav-indicator">MIKOSHI WORKSPACE</p>
          <p className="mt-3 max-w-sm text-[1.375rem] leading-9 font-semibold text-nav-fg-strong">
            把发布、合作与创意，
            <br />
            放进同一个工作中枢。
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 text-caption text-nav-fg">
            <li className="flex items-center gap-2.5">
              <i aria-hidden className="size-1.5 shrink-0 rounded-full bg-nav-indicator" />
              KOL 与三方号从入库、合作跟进和发布计划开始
            </li>
            <li className="flex items-center gap-2.5">
              <i aria-hidden className="size-1.5 rounded-full bg-nav-indicator" />
              联动与创意框架已就位；VPC归入创意，MIKO先作AI入口预览
            </li>
          </ul>
        </div>
        <p className="relative mt-6 hidden text-caption tracking-[0.08em] text-nav-muted lg:block">MIKOSHI · 本地演示环境</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-10 sm:items-center sm:pt-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-6">
            <p className="eyebrow mb-1.5">SIGN IN</p>
            <h1 className="text-title font-semibold text-fg">登录 Mikoshi</h1>
            <p className="mt-1 text-caption text-fg-secondary">无限大业务工作中枢 · 请使用演示账号进入</p>
          </div>

          <div className="rounded-overlay bg-surface p-6 shadow-card sm:p-7">
            {issue && !formError && (
              <Notice tone="warning" className="mb-5" role="status">
                {SESSION_ISSUE_TEXT[issue]}
              </Notice>
            )}
            {errorText && (
              <div ref={errorRef} tabIndex={-1} className="mb-5 outline-none" role="alert">
                <Notice tone="danger" title={errorText.title}>
                  {errorText.body}
                </Notice>
              </div>
            )}

            <form noValidate onSubmit={onSubmit} aria-describedby="login-demo-hint" className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-email">邮箱</Label>
                <Input
                  ref={emailRef}
                  id="login-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                  }}
                  aria-invalid={fieldErrors.email ? true : undefined}
                  aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                  readOnly={pending}
                />
                {fieldErrors.email && (
                  <p id="login-email-error" className="text-body text-danger">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="login-password">密码</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                    }}
                    aria-invalid={fieldErrors.password ? true : undefined}
                    aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                    readOnly={pending}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    aria-pressed={showPassword}
                    aria-controls="login-password"
                    className="absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-control text-fg-secondary transition-[background-color,color] duration-(--motion-fast) hover:bg-hover hover:text-fg sm:size-8 sm:right-1"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="login-password-error" className="text-body text-danger">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button type="submit" variant="primary" size="lg" pending={pending} disabled={notConfigured} className="mt-2 w-full">
                {pending ? "正在登录…" : "登录"}
              </Button>
              <p className="sr-only" role="status" aria-live="polite">
                {pending ? "正在登录" : ""}
              </p>
            </form>
          </div>

          {!notConfigured ? (
            <section aria-labelledby="login-demo-title" className="mt-4 rounded-overlay bg-subtle/70 px-5 py-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-warning" aria-hidden />
                <h2 id="login-demo-title" className="font-semibold text-fg">
                  本地演示，请使用演示账号
                </h2>
              </div>
              <p id="login-demo-hint" className="mt-1 text-fg-secondary">
                两个身份均为虚构，密码都是 <code className="rounded-[4px] bg-surface px-1 py-px font-mono text-fg">{DEMO_PASSWORD}</code>
                。登录只在本浏览器模拟，不是安全认证。
              </p>
              <ul className="mt-3 flex flex-col divide-y divide-line/70 rounded-card bg-surface shadow-control">
                {DEMO_USERS.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar initials={u.initials} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-fg">{u.displayName}</span>
                      <span className="block break-anywhere text-caption text-fg-secondary">{u.email}</span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fillDemo(i)}
                      disabled={pending}
                      aria-label={`填入演示账号：${u.displayName}`}
                      className={cn("min-w-14")}
                    >
                      填入
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Notice tone="warning" title="正式模式：身份服务未配置" className="mt-5">
              <span id="login-demo-hint">本构建不提供演示登录，也不会回落到演示账号。</span>
            </Notice>
          )}
        </div>
      </main>
      <footer className="px-4 pb-6 text-center text-caption text-fg-muted">
        {notConfigured ? "正式模式（未配置）" : "演示环境 · 不连接任何业务系统"}
      </footer>
      </div>
    </div>
  );
}
