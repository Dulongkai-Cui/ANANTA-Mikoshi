import type { AuthGateway, Session } from "@/contracts/auth";

const ROOT = "/mikoshi-api/auth";
type IdentityResponse = { session: Session; csrf: string };

// Bound both the response headers and body, so a stalled service cannot leave
// login, registration or the initial session check pending indefinitely.
async function fetchIdentity(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(ROOT + path, {
      ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal,
    });
    const data = await response.json().catch((error: unknown) => {
      if (controller.signal.aborted) throw error;
      return {};
    });
    return { response, data };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("连接超时，请稍后重试。如刚刚提交过注册，请先尝试使用该邮箱登录。");
    if (error instanceof TypeError) throw new Error("无法连接账号服务，请检查网络后重试。");
    throw error;
  } finally { clearTimeout(timer); }
}

export async function identityRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (method !== "GET" && !["/login", "/register"].includes(path)) {
    const current = await identityRequest<IdentityResponse>("/session");
    headers["X-CSRF-Token"] = current.csrf;
  }
  const { response, data } = await fetchIdentity(path, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.error || "连接暂时不可用，请稍后重试。");
  return data as T;
}

export function createCloudAuthGateway(): AuthGateway {
  return {
    mode: "production",
    async getSession() {
      try {
        const { response, data }: { response: Response; data: IdentityResponse } = await fetchIdentity("/session");
        if (response.status === 401) return { status: "anonymous" };
        if (!response.ok) return { status: "invalid", issue: "not_configured" };
        if (data.session?.mode !== "production" || !data.session.user?.id) return { status: "invalid", issue: "not_configured" };
        return { status: "authenticated", session: data.session };
      } catch { return { status: "invalid", issue: "not_configured" }; }
    },
    async signIn(credentials) {
      try {
        const data = await identityRequest<IdentityResponse>("/login", "POST", credentials);
        return { ok: true, session: data.session };
      } catch { return { ok: false, error: { code: "invalid_credentials" } }; }
    },
    async signOut() {
      try {
        await identityRequest("/logout", "POST", {});
        return { ok: true };
      } catch {
        // Expired sessions are already signed out; a network failure is not success.
        const result = await fetchIdentity("/session").catch(() => null);
        return result?.response.status === 401 ? { ok: true } : { ok: false, error: { code: "storage_unavailable" } };
      }
    },
  };
}
