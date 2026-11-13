import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { selectAuthGateway } from "@/adapters";
import { createDemoAuthGateway, SESSION_KEY } from "@/adapters/demo/auth";
import { DEMO_PASSWORD, DEMO_USERS } from "@/adapters/demo/users";
import { denyStorageProperty, installStorage } from "./storage-fixture";

describe("demo session contract", () => {
  let storage: ReturnType<typeof installStorage>;
  beforeEach(() => { storage = installStorage(); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it.each(DEMO_USERS)("logs in and restores only the identity $id", async (user) => {
    const auth = createDemoAuthGateway();
    const result = await auth.signIn({ email: ` ${user.email.toUpperCase()} `, password: DEMO_PASSWORD });
    expect(result).toMatchObject({ ok: true, session: { user: { id: user.id }, mode: "demo" } });
    expect(JSON.parse(storage.session.getItem(SESSION_KEY)!)).toEqual({ version: 1, userId: user.id, mode: "demo" });
    expect(await createDemoAuthGateway().getSession()).toMatchObject({ status: "authenticated", session: { user: { id: user.id } } });
    expect(storage.local.length).toBe(0);
  });

  it("does not create a session for wrong credentials", async () => {
    expect(await createDemoAuthGateway().signIn({ email: DEMO_USERS[0]!.email, password: "wrong" }))
      .toEqual({ ok: false, error: { code: "invalid_credentials" } });
    expect(storage.session.length).toBe(0);
  });

  it.each(["bad json", "null", "[]", '{"version":2,"mode":"demo"}', '{"version":1,"mode":"live"}', '{"version":1,"mode":"demo","userId":"unknown"}'])
    ("rejects a damaged or expired session %s", async (raw) => {
      storage.session.setItem(SESSION_KEY, raw);
      expect(await createDemoAuthGateway().getSession()).toEqual({ status: "invalid", issue: "corrupted" });
      expect(storage.session.getItem(SESSION_KEY)).toBe(raw);
      expect(await createDemoAuthGateway().getSession()).toEqual({ status: "invalid", issue: "corrupted" });
    });

  it("distinguishes an anonymous tab from unavailable storage", async () => {
    expect(await createDemoAuthGateway().getSession()).toEqual({ status: "anonymous" });
    denyStorageProperty(storage.browser, "sessionStorage");
    expect(await createDemoAuthGateway().getSession()).toEqual({ status: "invalid", issue: "storage_unavailable" });
    expect(await createDemoAuthGateway().signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD }))
      .toEqual({ ok: false, error: { code: "storage_unavailable" } });
  });

  it.each([new DOMException("Full", "QuotaExceededError"), new Error("Write failed")])
    ("does not silently switch to an in-memory session on write failure", async (error) => {
      storage.session.writeError = error;
      expect(await createDemoAuthGateway().signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD }))
        .toEqual({ ok: false, error: { code: "storage_unavailable" } });
      expect(await createDemoAuthGateway().getSession()).toEqual({ status: "anonymous" });
    });

  it("rejects a write that cannot be verified and removes its residual data", async () => {
    storage.session.readError = new Error("Read denied after write");
    expect(await createDemoAuthGateway().signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD }))
      .toEqual({ ok: false, error: { code: "storage_unavailable" } });
    expect(storage.session.data.has(SESSION_KEY)).toBe(false);
  });

  it("holds the pending result only while a test-injected delay is active", async () => {
    vi.useFakeTimers();
    window.__MIKOSHI_DEMO_FAULTS__ = { signInDelayMs: 200 };
    const result = createDemoAuthGateway().signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD });
    await vi.advanceTimersByTimeAsync(199);
    expect(storage.session.length).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect((await result).ok).toBe(true);
  });

  it("clears the session so a fresh gateway cannot restore it", async () => {
    const auth = createDemoAuthGateway();
    await auth.signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD });
    expect(await auth.signOut()).toEqual({ ok: true });
    expect(await createDemoAuthGateway().getSession()).toEqual({ status: "anonymous" });
  });

  it("reports removal failure instead of claiming logout succeeded", async () => {
    const auth = createDemoAuthGateway();
    await auth.signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD });
    storage.session.removeError = new DOMException("Denied", "SecurityError");
    expect(await auth.signOut()).toEqual({ ok: false, error: { code: "storage_unavailable" } });
    expect((await auth.getSession()).status).toBe("authenticated");
  });

  it("verifies logout even if removeItem silently keeps its value", async () => {
    const auth = createDemoAuthGateway();
    await auth.signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD });
    storage.session.ignoreRemoves = true;
    expect(await auth.signOut()).toEqual({ ok: false, error: { code: "storage_unavailable" } });
  });

  it.each(["unconfigured", "unset", "", "DEMO"])("mode %s cannot fall back to demo authentication", async (mode) => {
    const gateway = selectAuthGateway(mode);
    expect(gateway.mode).toBe("unconfigured");
    expect(await gateway.getSession()).toEqual({ status: "invalid", issue: "not_configured" });
    expect(await gateway.signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD }))
      .toEqual({ ok: false, error: { code: "not_configured" } });
    expect(storage.session.length).toBe(0);
  });

  it("production delegates identity to the server and never accepts a demo session", async () => {
    await createDemoAuthGateway().signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD });
    const fetcher = vi.fn().mockResolvedValue({ status: 401, ok: false, json: async () => ({ error: "拒绝" }) });
    vi.stubGlobal("fetch", fetcher);
    const gateway = selectAuthGateway("production");
    expect(gateway.mode).toBe("production");
    expect(await gateway.getSession()).toEqual({ status: "anonymous" });
    expect(await gateway.signIn({ email: DEMO_USERS[0]!.email, password: DEMO_PASSWORD }))
      .toEqual({ ok: false, error: { code: "invalid_credentials" } });
    expect(fetcher).toHaveBeenCalledWith("/mikoshi-api/auth/session", expect.objectContaining({ cache: "no-store" }));
    fetcher.mockRejectedValue(new Error("offline"));
    expect(await gateway.getSession()).toEqual({ status: "invalid", issue: "not_configured" });
    expect((await gateway.signOut()).ok).toBe(false);
  });
});
