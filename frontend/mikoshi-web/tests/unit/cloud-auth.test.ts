import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudAuthGateway, identityRequest } from "@/adapters/cloud/auth";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function stalledFetch(bodyOnly = false) {
  return vi.fn((_url: string, init: RequestInit) => {
    const pending = new Promise((_resolve, reject) => {
      init.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
    return bodyOnly ? Promise.resolve({ ok: true, status: 200, json: () => pending }) : pending;
  });
}

describe("cloud identity request recovery", () => {
  it.each([false, true])("stops a stalled registration including its body (bodyOnly=%s)", async (bodyOnly) => {
    vi.useFakeTimers();
    const fetcher = stalledFetch(bodyOnly);
    vi.stubGlobal("fetch", fetcher);
    const result = identityRequest("/register", "POST", {}).catch((error: Error) => error);
    await vi.advanceTimersByTimeAsync(20_000);
    expect((await result as Error).message).toContain("连接超时");
    expect((await result as Error).message).toContain("先尝试使用该邮箱登录");
    expect(fetcher).toHaveBeenCalledTimes(1); // No automatic replay of registration.
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("releases the initial session check instead of leaving checking indefinitely", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", stalledFetch());
    const result = createCloudAuthGateway().getSession();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(await result).toEqual({ status: "invalid", issue: "not_configured" });
  });

  it("keeps a rejected invitation actionable and does not retry it", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "邀请码无效、已使用或已过期。", code: "invalid_invitation" }), { status: 400 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(identityRequest("/register", "POST", {})).rejects.toThrow("邀请码无效、已使用或已过期。");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("restores a real session and clears its deadline", async () => {
    vi.useFakeTimers();
    const session = { version: 1, mode: "production", user: { id: "test-member", role: "editor" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ session, csrf: "test-only" }))));
    expect(await createCloudAuthGateway().getSession()).toEqual({ status: "authenticated", session });
    expect(vi.getTimerCount()).toBe(0);
  });
});
