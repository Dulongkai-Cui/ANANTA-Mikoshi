import { describe, expect, it } from "vitest";
import { APP_ROUTES, HOME_PATH, LOGIN_PATH, findWorkspaceRoute, isProtectedPath, loginHrefFor, sanitizeReturnTo } from "@/lib/routes";
import { searchPages } from "@/features/search/search-pages";

describe("SBS-0021 retired KOL entries", () => {
  it.each(["/kol/plans", "/kol/calendar", "/kol/accounts", "/kol/studio#sources", ...["creators", "content", "sentiment", "compare", "quality"].map((page) => `/kol#${page}`)])("rejects retired return targets and search links: %s", (path) => {
    expect(sanitizeReturnTo(path)).toBeNull();
    expect(searchPages("").some((route) => route.path === path)).toBe(false);
  });
  it("preserves studio scheduling, cooperation and the separate third-party pages", () => {
    for (const path of ["/kol/studio#calendar", "/kol/progress", "/kol#home", "/kol#overview", "/third-party/plans", "/third-party/calendar", "/third-party/accounts", "/third-party#sources"]) expect(sanitizeReturnTo(path)).toBe(path);
  });
});

describe("SBS-0020 information architecture", () => {
  it("keeps dashboard as the home while exposing four ordered top-level destinations", () => {
    expect(HOME_PATH).toBe("/dashboard");
    expect(APP_ROUTES.filter((route) => route.group !== "personal" && !route.parentPath).map((route) => [route.path, route.label])).toEqual([
      ["/miko", "MIKO"], ["/dashboard", "我的工作台"], ["/third-party", "三方号"], ["/kol", "KOL"],
    ]);
    expect(APP_ROUTES.find((route) => route.path === "/creative/vpc")).toBeUndefined();
  });

  it("excludes retired boards while preserving KOL creative pages", () => {
    expect(searchPages("VPC")).toEqual([]);
    expect(searchPages("联动管理")).toEqual([]);
    expect(searchPages("创意管理")).toEqual([]);
    expect(searchPages("创意").some((route) => route.path.startsWith("/kol/studio#"))).toBe(true);
    expect(searchPages("整体业务中台")).toEqual([]);
    expect(searchPages("").map((route) => route.path)).not.toContain("/business");
    expect(APP_ROUTES.map((route) => route.path)).not.toContain("/vpc");
    expect(sanitizeReturnTo("/business")).toBeNull();
    expect(loginHrefFor("/business")).toBe(LOGIN_PATH);
    expect(sanitizeReturnTo("/creative/vpc")).toBeNull();
    expect(loginHrefFor("/creative/vpc")).toBe(LOGIN_PATH);
  });

  it("resolves only registered child pages to their actual parent workspace", () => {
    expect(findWorkspaceRoute("/creative/vpc")).toBeUndefined();
    expect(findWorkspaceRoute("/kol/studio#ideas")?.path).toBe("/kol");
    expect(findWorkspaceRoute("/miko")?.path).toBe("/miko");
    expect(findWorkspaceRoute("/creative/not-registered")).toBeUndefined();
    expect(findWorkspaceRoute("/business")).toBeUndefined();
    expect(isProtectedPath("/business")).toBe(false);
    expect(isProtectedPath("/creative/vpc")).toBe(false);
  });
});

describe("login return target", () => {
  it.each(APP_ROUTES.map((route) => route.path))("accepts registered route %s unchanged", (path) => {
    expect(sanitizeReturnTo(path)).toBe(path);
  });

  it.each([
    undefined, null, 42, {}, "", "https://example.invalid", "//example.invalid/kol",
    "\\example.invalid", "/\\example.invalid", "%2fkol", "/%2fexample.invalid",
    "/%252fexample.invalid", "/%6bol", "/kol%00", "/kol?returnTo=//example.invalid",
    "/kol#section", "/kol/../settings", "/kol/", "/login", "/unknown",
    " /kol", "/kol ", "/kol\n", "/ko\tl", "/ko\u0000l", "/ko\u007fl", "/kol\u00a0",
  ])("rejects external, encoded, unregistered or malformed input %j", (value) => {
    expect(sanitizeReturnTo(value)).toBeNull();
  });

  it("constructs a return link only for known non-home destinations", () => {
    expect(loginHrefFor("/settings")).toBe("/login?returnTo=%2Fsettings");
    expect(loginHrefFor("/collaborations")).toBe(LOGIN_PATH);
    expect(loginHrefFor(HOME_PATH)).toBe(LOGIN_PATH);
    expect(loginHrefFor("//example.invalid")).toBe(LOGIN_PATH);
  });

  it("preserves only registered legacy subpage deep links through sign-in", () => {
    expect(sanitizeReturnTo("/kol#overview")).toBe("/kol#overview");
    expect(sanitizeReturnTo("/third-party#finance")).toBe("/third-party#finance");
    expect(loginHrefFor("/kol#overview")).toBe("/login?returnTo=%2Fkol%23overview");
    for (const candidate of ["/kol#", "/kol#pivot", "/third-party#creators", "/kol#home#bad", "/kol#%63reators", "/dashboard#creators", "/kol#//external.invalid", "/kol#creators?bad=1"]) {
      expect(sanitizeReturnTo(candidate)).toBeNull();
    }
  });
});
