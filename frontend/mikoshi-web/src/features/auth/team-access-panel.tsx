"use client";

import * as React from "react";
import { Check, Copy, KeyRound, RefreshCw, ShieldCheck, UserRoundPlus } from "lucide-react";

import { AUTH_MODE } from "@/adapters";
import { identityRequest } from "@/adapters/cloud/auth";
import { SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useCurrentUser } from "@/features/auth/session-provider";

type Role = "admin" | "editor" | "viewer";
type InviteStatus = "active" | "used" | "expired" | "revoked";
type Invitation = {
  id: string;
  role: Role;
  label: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  reusable: boolean;
  useCount: number;
};
type NewInvitation = { invite: Invitation; code: string };

const ROLES: Record<Role, string> = { admin: "管理员", editor: "编辑成员", viewer: "只读成员" };
const STATUS: Record<InviteStatus, string> = { active: "可使用", used: "已领取", expired: "已过期", revoked: "已撤销" };
const SELECT_CLASS = "h-10 w-full min-w-0 rounded-control border border-control bg-surface px-3 text-body text-fg focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 sm:h-9";

function dateText(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "操作未完成，请稍后重试。";
}

function InviteManager() {
  const [items, setItems] = React.useState<Invitation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [role, setRole] = React.useState<Role>("editor");
  const [label, setLabel] = React.useState("");
  const [days, setDays] = React.useState(7);
  const [reusable, setReusable] = React.useState(true);
  const [pending, setPending] = React.useState<string | null>(null);
  const [fresh, setFresh] = React.useState<NewInvitation | null>(null);
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "manual">("idle");
  const generation = React.useRef(0);
  const mutation = React.useRef(false);
  const codeRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const current = ++generation.current;
    void identityRequest<{ items: Invitation[] }>("/invites").then((result) => {
      if (generation.current !== current) return;
      setItems(result.items);
      setLoading(false);
    }).catch((error: unknown) => {
      if (generation.current !== current) return;
      setLoadError(errorText(error));
      setLoading(false);
    });
    return () => { generation.current += 1; };
  }, []);

  const refresh = async () => {
    if (mutation.current) return;
    const current = ++generation.current;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await identityRequest<{ items: Invitation[] }>("/invites");
      if (generation.current === current) setItems(result.items);
    } catch (error) {
      if (generation.current === current) setLoadError(errorText(error));
    } finally {
      if (generation.current === current) setLoading(false);
    }
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.current || fresh) return;
    mutation.current = true;
    // Ignore an older list fetch after a successful mutation.
    generation.current += 1;
    setLoading(false);
    setPending("create");
    setActionError(null);
    setAnnouncement("");
    setCopyState("idle");
    try {
      const result = await identityRequest<NewInvitation>("/invites", "POST", { role, label: label.trim(), expiresInDays: days, reusable });
      setFresh(result);
      setItems((previous) => [result.invite, ...previous.filter((item) => item.id !== result.invite.id)]);
      setLabel("");
      setAnnouncement("邀请码已生成，请复制保存。完整邀请码只在这里显示一次。");
      requestAnimationFrame(() => codeRef.current?.focus());
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      mutation.current = false;
      setPending(null);
    }
  };

  const revoke = async (invitation: Invitation) => {
    if (mutation.current) return;
    mutation.current = true;
    generation.current += 1;
    setLoading(false);
    setPending(invitation.id);
    setActionError(null);
    setAnnouncement("");
    try {
      await identityRequest(`/invites/${invitation.id}/revoke`, "POST", {});
      setItems((previous) => previous.map((item) => item.id === invitation.id ? { ...item, status: "revoked" } : item));
      if (fresh?.invite.id === invitation.id) setFresh(null);
      setAnnouncement("邀请已撤销，原邀请码无法继续注册。");
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      mutation.current = false;
      setPending(null);
    }
  };

  const copy = async () => {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh.code);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
      codeRef.current?.focus();
      codeRef.current?.select();
    }
  };

  return (
    <div className="mt-3 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4">
        <h3 className="flex items-center gap-2 font-semibold text-fg"><UserRoundPlus className="size-4 text-accent" aria-hidden />邀请同事加入</h3>
        <p className="mt-1 text-caption text-fg-secondary">长期团队码可供多位同事注册，随时可以撤销。新成员会获得所选权限。</p>
      </div>

      <form onSubmit={create} className="space-y-4 px-5 py-4">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="team-invite-kind">邀请类型</Label>
            <select id="team-invite-kind" value={reusable ? "team" : "single"} onChange={(event) => { const team = event.target.value === "team"; setReusable(team); if (team && role === "admin") setRole("editor"); }} className={SELECT_CLASS} disabled={Boolean(pending) || Boolean(fresh)}>
              <option value="team">长期团队码 · 可多人注册</option>
              <option value="single">单次邀请 · 仅限一人</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-invite-label">备注 <span className="font-normal text-fg-muted">（可选）</span></Label>
            <Input id="team-invite-label" placeholder="例如：内容组 · 小林" maxLength={80} value={label} onChange={(event) => setLabel(event.target.value)} disabled={Boolean(pending) || Boolean(fresh)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-invite-role">成员权限</Label>
            <select id="team-invite-role" value={role} onChange={(event) => setRole(event.target.value as Role)} className={SELECT_CLASS} disabled={Boolean(pending) || Boolean(fresh)}>
              <option value="editor">编辑成员 · 查看与编辑 KOL</option>
              <option value="viewer">只读成员 · 查看 KOL</option>
              <option value="admin" disabled={reusable}>管理员 · 仅支持单次邀请</option>
            </select>
          </div>
          {!reusable && <div className="space-y-1.5">
            <Label htmlFor="team-invite-days">有效期</Label>
            <select id="team-invite-days" value={days} onChange={(event) => setDays(Number(event.target.value))} className={SELECT_CLASS} disabled={Boolean(pending) || Boolean(fresh)}>
              <option value={1}>1 天</option><option value={3}>3 天</option><option value={7}>7 天</option>
            </select>
          </div>}
          <div className="flex items-end"><Button type="submit" variant="primary" pending={pending === "create"} disabled={Boolean(pending) || Boolean(fresh)} className="w-full sm:w-auto"><KeyRound aria-hidden />生成邀请码</Button></div>
        </div>
        {reusable && <p className="text-caption text-fg-secondary">长期有效，主动撤销后停止新注册。已经注册的成员保留账号；换码时先撤销旧码，再生成新码。</p>}
        {role === "admin" && <Notice tone="warning">管理员可以编辑 KOL 资料、查看历史备份，并创建管理员或其他成员的邀请。请仅授予需要管理团队的人。</Notice>}
      </form>

      {fresh && (
        <div className="mx-5 mb-5 rounded-card border border-accent/30 bg-accent-soft p-4">
          <Label htmlFor="team-invite-code">新邀请码 · {ROLES[fresh.invite.role]}</Label>
          <p className="mt-1 mb-3 text-caption text-fg-secondary">请复制后交给对应同事，在登录页选择邀请码注册。关闭此处或离开页面后，完整邀请码无法再次查看。</p>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <Input ref={codeRef} id="team-invite-code" readOnly value={fresh.code} autoComplete="off" spellCheck={false} className="min-w-0 font-mono" onFocus={(event) => event.target.select()} />
            <Button type="button" onClick={() => void copy()}>{copyState === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}{copyState === "copied" ? "已复制" : "复制邀请码"}</Button>
          </div>
          <p role="status" className="mt-2 text-caption text-fg-secondary">{copyState === "manual" ? "浏览器未允许自动复制，已选中邀请码，请手动复制。" : fresh.invite.reusable ? "长期有效 · 可多人注册 · 撤销后失效" : `有效至 ${fresh.invite.expiresAt ? dateText(fresh.invite.expiresAt) : "—"}（北京时间），仅可使用一次。`}</p>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setFresh(null); setCopyState("idle"); }}>已保存，关闭邀请码</Button>
        </div>
      )}

      {actionError && <Notice tone="danger" className="mx-5 mb-4" role="alert" title="操作未完成">{actionError}</Notice>}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
        <h3 className="font-semibold text-fg">邀请记录</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => void refresh()} pending={loading} disabled={Boolean(pending)}><RefreshCw aria-hidden />刷新列表</Button>
      </div>
      {loadError && <Notice tone="danger" title="列表未能更新" role="alert" className="mx-5 mb-4">{loadError} 已显示的记录保留，请刷新重试。</Notice>}
      {loading && items.length === 0 ? <p className="px-5 pb-5 text-fg-secondary" role="status">正在读取邀请记录…</p> : items.length === 0 && !loadError ? <p className="px-5 pb-5 text-fg-secondary">尚未创建邀请。选择成员权限后，即可生成第一份邀请。</p> : null}
      {items.length > 0 && <ul aria-label="团队邀请记录" className="divide-y divide-line border-t border-line">
        {items.map((invitation) => (
          <li key={invitation.id} className="flex min-w-0 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="break-anywhere font-medium text-fg">{invitation.label || "未填写备注"}</span><Badge tone={invitation.role === "admin" ? "warning" : "neutral"}>{ROLES[invitation.role]}</Badge><Badge tone={invitation.status === "active" ? "success" : "neutral"}>{STATUS[invitation.status]}</Badge></div>
              <p className="mt-1 text-caption text-fg-muted">{dateText(invitation.createdAt)} 创建 · {invitation.reusable ? `长期团队码 · 已注册 ${invitation.useCount} 人` : invitation.usedAt ? `${dateText(invitation.usedAt)} 领取` : `${invitation.expiresAt ? dateText(invitation.expiresAt) : "—"} 到期`} · 北京时间</p>
            </div>
            {invitation.status === "active" && <Button type="button" size="sm" variant="danger" disabled={Boolean(pending)} pending={pending === invitation.id} onClick={() => void revoke(invitation)} aria-label={`撤销邀请：${invitation.label || ROLES[invitation.role]}`}>撤销邀请</Button>}
          </li>
        ))}
      </ul>}
    </div>
  );
}

export function TeamAccessPanel() {
  const user = useCurrentUser();
  if (AUTH_MODE !== "production") return null;
  return (
    <section aria-labelledby="team-access-title" className="mt-8 max-w-3xl">
      <SectionTitle id="team-access-title">团队访问</SectionTitle>
      <div className="mt-3 flex min-w-0 items-start gap-3 rounded-card bg-subtle px-4 py-3">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
        <div className="min-w-0 text-caption text-fg-secondary"><p className="font-medium text-fg">当前权限：{user.role ? ROLES[user.role] : user.roleLabel}</p><p className="mt-1">团队采用邀请码注册。邮箱仅作为登录标识，当前没有邮件验证或邮件找回服务。</p>{user.role !== "admin" && <p className="mt-1">需要邀请同事或调整权限，请联系管理员。</p>}</div>
      </div>
      {user.role === "admin" && <InviteManager key={user.id} />}
    </section>
  );
}
