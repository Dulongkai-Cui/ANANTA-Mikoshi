import { AppShell } from "@/components/shell/app-shell";

/** 受保护路由组：会话守卫与外壳 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
