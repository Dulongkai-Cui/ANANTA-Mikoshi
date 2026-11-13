/**
 * adapter 选择的唯一位置。组件通过这里取得合同实现，不直接读写存储。
 * 认证模式在构建时由 NEXT_PUBLIC_MIKOSHI_AUTH_MODE 显式决定（next.config.ts 默认 demo）。
 * 除 "demo" 外的任何值都视为正式模式；正式身份服务尚未接入，因此返回“未配置”，不回落演示登录。
 */
import type { AuthGateway } from "@/contracts/auth";
import type { DashboardRepository } from "@/contracts/dashboard";
import type { PreferencesStore } from "@/contracts/preferences";

import { createDemoAuthGateway, createUnconfiguredAuthGateway } from "./demo/auth";
import { createCloudAuthGateway } from "./cloud/auth";
import { createDemoDashboardRepository } from "./demo/dashboard";
import { createDemoPreferencesStore } from "./demo/preferences";

export const AUTH_MODE = process.env.NEXT_PUBLIC_MIKOSHI_AUTH_MODE ?? "unset";
export const IS_DEMO = AUTH_MODE === "demo";

export function selectAuthGateway(mode: string): AuthGateway {
  return mode === "demo" ? createDemoAuthGateway() : mode === "production" ? createCloudAuthGateway() : createUnconfiguredAuthGateway();
}

export const authGateway: AuthGateway = selectAuthGateway(AUTH_MODE);
export const dashboardRepository: DashboardRepository = createDemoDashboardRepository();
export const preferencesStore: PreferencesStore = createDemoPreferencesStore();
