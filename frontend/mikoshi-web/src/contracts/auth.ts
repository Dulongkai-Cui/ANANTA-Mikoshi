/**
 * AuthGateway 合同（SPEC §5.1、FE-30）。
 * 前端只依赖本接口；demo 与未来正式身份服务各自实现，可整体替换而不改表单与外壳。
 * 本步 demo 实现只模拟路由状态，不是安全认证。
 */

export interface UserProfile {
  role?: "admin" | "editor" | "viewer";
  id: string;
  displayName: string;
  email: string;
  /** 只读展示用角色说明 */
  roleLabel: string;
  initials: string;
}

export interface Session {
  version: 1;
  user: UserProfile;
  mode: "demo" | "production";
}

export type SessionIssue =
  /** 本地会话数据无法解析、版本不符或指向不存在的身份 */
  | "corrupted"
  /** 浏览器禁止访问 sessionStorage */
  | "storage_unavailable"
  /** 正式身份服务尚未接入 */
  | "not_configured";

export type SessionResult =
  | { status: "authenticated"; session: Session }
  | { status: "anonymous" }
  | { status: "invalid"; issue: SessionIssue };

export type SignInError =
  | { code: "invalid_credentials" }
  /** 本地会话无法建立（sessionStorage 不可用或写入失败） */
  | { code: "storage_unavailable" }
  | { code: "not_configured" };

export type SignInResult = { ok: true; session: Session } | { ok: false; error: SignInError };

/** 退出只有在本地会话确实清除后才成功；失败时界面不能声称已退出。 */
export type SignOutResult = { ok: true } | { ok: false; error: { code: "storage_unavailable" } };

export interface AuthGateway {
  /** demo：本地演示；unconfigured：已选择正式模式但适配器未接入 */
  readonly mode: "demo" | "production" | "unconfigured";
  getSession(): Promise<SessionResult>;
  signIn(credentials: { email: string; password: string }): Promise<SignInResult>;
  signOut(): Promise<SignOutResult>;
}
