import type { UserProfile } from "@/contracts/auth";

/**
 * 两个完全虚构的演示身份（SPEC §5.1）。邮箱使用保留的 .invalid 域，密码公开展示。
 * 这些不是凭据：它们只用于本地演示路由状态。
 */
export const DEMO_PASSWORD = "mikoshi-demo";

export const DEMO_USERS: readonly UserProfile[] = [
  {
    id: "demo-u-linxu",
    displayName: "林序",
    email: "linxu@mikoshi-demo.invalid",
    roleLabel: "演示身份 · 运营负责人",
    initials: "林",
  },
  {
    id: "demo-u-xucheng",
    displayName: "许澄",
    email: "xucheng@mikoshi-demo.invalid",
    roleLabel: "演示身份 · 创意策划",
    initials: "许",
  },
] as const;

export function findDemoUserById(id: unknown): UserProfile | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}

export function findDemoUserByEmail(email: string): UserProfile | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_USERS.find((u) => u.email === normalized);
}
