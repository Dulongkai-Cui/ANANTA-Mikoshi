"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { identityRequest } from "@/adapters/cloud/auth";
import { BrandLogo } from "@/components/shell/brand";
import { NeutralShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useSession } from "./session-provider";
import { sanitizeReturnTo } from "@/lib/routes";

export function CloudLoginForm() {
  const { state, refresh } = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const [register, setRegister] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (state.status === "authenticated") router.replace(sanitizeReturnTo(search.get("returnTo")) || "/kol/studio#kols");
  }, [state, router, search]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    lock.current = true; setPending(true); setError("");
    try {
      await identityRequest(register ? "/register" : "/login", "POST", {
        email: String(data.get("email")).trim(), password: String(data.get("password")),
        ...(register ? { displayName: String(data.get("displayName")).trim(), inviteCode: String(data.get("inviteCode")).trim() } : {}),
      });
      const restored = await refresh();
      if (restored.status !== "authenticated") {
        setError(register
          ? "账号已创建，但登录状态未能确认。请切换到登录，使用刚才的邮箱和密码；无需再次使用邀请码。"
          : "登录请求已完成，但未能确认登录状态。请检查本站 Cookie 是否可用，然后重试。");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "连接失败，请重试。"); }
    finally { lock.current = false; setPending(false); }
  }
  if (state.status === "checking" || state.status === "authenticated") return <NeutralShell />;
  return <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
    <aside className="flex flex-col justify-between gap-8 bg-sidebar px-8 py-8 text-nav-fg lg:w-[min(42vw,520px)] lg:p-12">
      <BrandLogo className="items-start text-left" />
      <div className="hidden lg:block"><p className="text-eyebrow tracking-[0.2em] text-nav-indicator">ONE TEAM. ONE WORKSPACE.</p><h2 className="mt-4 text-2xl leading-relaxed font-semibold text-nav-fg-strong">让每一个好想法，<br />找到一起完成的人。</h2><p className="mt-5 leading-7 text-nav-muted">UP资料、创意、排期与预算，<br />在同一个 KOL 工作区连续协作。</p></div>
      <p className="hidden text-caption text-nav-muted lg:block">MIKOSHI · 无限大业务工作中枢</p>
    </aside>
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[410px]">
        <p className="eyebrow">{register ? "JOIN YOUR TEAM" : "WELCOME BACK"}</p>
        <h1 className="mt-2 text-title font-semibold">{register ? "加入 Mikoshi" : "登录 Mikoshi"}</h1>
        <p className="mt-2 text-fg-secondary">{register ? "使用管理员提供的团队码或单次邀请码创建账号。" : "继续选人、安排创意，推动下一步。"}</p>
        <form onSubmit={submit} className="mt-7 space-y-4 rounded-overlay border border-line bg-surface p-6 shadow-card">
          {state.status === "invalid" && !error && <Notice tone="warning" role="alert">暂时无法连接账号服务，请检查网络后刷新，或稍后重新登录。</Notice>}
          {error && <Notice tone="danger" role="alert">{error}</Notice>}
          {register && <div className="space-y-2"><Label htmlFor="cloud-name">姓名 / 显示名</Label><Input id="cloud-name" name="displayName" autoComplete="name" required minLength={2} maxLength={40} disabled={pending} /></div>}
          <div className="space-y-2"><Label htmlFor="cloud-email">邮箱</Label><Input id="cloud-email" name="email" type="email" autoComplete="username" required maxLength={254} disabled={pending} /></div>
          <div className="space-y-2"><Label htmlFor="cloud-password">密码</Label><Input id="cloud-password" name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 12 : 1} maxLength={128} disabled={pending} />{register && <p className="text-caption text-fg-muted">至少 12 个字符，建议使用密码管理器生成。</p>}</div>
          {register && <div className="space-y-2"><Label htmlFor="cloud-invite">邀请码</Label><Input id="cloud-invite" name="inviteCode" required autoComplete="off" spellCheck={false} maxLength={128} disabled={pending} /><p className="text-caption text-fg-muted">团队码可供多人注册；单次码只能使用一次。邀请码失效时请联系管理员，已有账号请直接登录。</p></div>}
          <Button type="submit" variant="primary" className="w-full" pending={pending}>{register ? "创建账号并进入" : "登录工作区"}<ArrowRight className="size-4" /></Button>
        </form>
        <button type="button" disabled={pending} onClick={() => { setRegister(!register); setError(""); }} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-control text-accent hover:bg-accent-soft"><KeyRound className="size-4" />{register ? "已有账号？返回登录" : "有邀请码？创建账号"}</button>
        <p className="mt-6 flex items-center justify-center gap-2 text-caption text-fg-muted"><ShieldCheck className="size-4" />团队邀请制 · 资料需登录访问</p>
      </div>
    </main>
  </div>;
}
