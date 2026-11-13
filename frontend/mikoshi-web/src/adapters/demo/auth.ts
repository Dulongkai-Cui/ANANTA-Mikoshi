import type { AuthGateway, Session, SessionResult, SignInResult, SignOutResult } from "@/contracts/auth";
import { getDemoFaults, wait } from "@/lib/demo-faults";
import { isRecord, parseJson, readItem, removeItem, writeItem } from "@/lib/storage";

import { DEMO_PASSWORD, findDemoUserByEmail, findDemoUserById } from "./users";

export const SESSION_KEY = "mikoshi.session";
const SESSION_VERSION = 1;

function clearSession(): SignOutResult {
  const removed = removeItem("session", SESSION_KEY);
  if (!removed.ok) return { ok: false, error: { code: "storage_unavailable" } };
  const check = readItem("session", SESSION_KEY);
  return check.ok && check.value === null
    ? { ok: true }
    : { ok: false, error: { code: "storage_unavailable" } };
}

/**
 * 演示会话：sessionStorage 只保存 { version, userId, mode }，
 * 不保存密码、令牌或其他凭据（SPEC §5.1）。资料从固定演示名单查出。
 */
export function createDemoAuthGateway(): AuthGateway {
  return {
    mode: "demo",

    async getSession(): Promise<SessionResult> {
      const read = readItem("session", SESSION_KEY);
      if (!read.ok) return { status: "invalid", issue: "storage_unavailable" };
      if (read.value === null) return { status: "anonymous" };

      const data = parseJson(read.value);
      if (!isRecord(data) || data.version !== SESSION_VERSION || data.mode !== "demo") {
        // 读取保持幂等：StrictMode/重复检查不能把失效原因清成 anonymous。
        // 成功登录覆盖记录，明确退出才清除它。
        return { status: "invalid", issue: "corrupted" };
      }
      const user = findDemoUserById(data.userId);
      if (!user) {
        return { status: "invalid", issue: "corrupted" };
      }
      return { status: "authenticated", session: toSession(user.id) };
    },

    async signIn({ email, password }): Promise<SignInResult> {
      await wait(getDemoFaults().signInDelayMs);
      const user = findDemoUserByEmail(email);
      if (!user || password !== DEMO_PASSWORD) return { ok: false, error: { code: "invalid_credentials" } };

      const payload = JSON.stringify({ version: SESSION_VERSION, userId: user.id, mode: "demo" });
      const written = writeItem("session", SESSION_KEY, payload);
      // 不可用或写入失败：明确失败，不回落到内存会话（SPEC §5.1）
      if (!written.ok) return { ok: false, error: { code: "storage_unavailable" } };
      // 写后读回，确认真的建立了会话
      const check = readItem("session", SESSION_KEY);
      if (!check.ok || check.value !== payload) {
        // 写入后的核对失败不能留下一个稍后自动恢复的“成功”会话。
        removeItem("session", SESSION_KEY);
        return { ok: false, error: { code: "storage_unavailable" } };
      }

      return { ok: true, session: toSession(user.id) };
    },

    async signOut() {
      return clearSession();
    },
  };
}

function toSession(userId: string): Session {
  const user = findDemoUserById(userId);
  if (!user) throw new Error("unknown demo user");
  return { version: 1, user, mode: "demo" };
}

/**
 * 正式模式占位：身份服务尚未接入。所有调用明确返回“未配置”，
 * 不回落到演示登录（SPEC §5.1）。
 */
export function createUnconfiguredAuthGateway(): AuthGateway {
  return {
    mode: "unconfigured",
    async getSession() {
      return { status: "invalid", issue: "not_configured" };
    },
    async signIn() {
      return { ok: false, error: { code: "not_configured" } };
    },
    async signOut() {
      return clearSession();
    },
  };
}
