import type { Metadata } from "next";
import { Suspense } from "react";

import { NeutralShell } from "@/components/shell/app-shell";
import { LoginForm } from "@/features/auth/login-form";
import { CloudLoginForm } from "@/features/auth/cloud-login-form";

export const metadata: Metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <Suspense fallback={<NeutralShell />}>
      {process.env.NEXT_PUBLIC_MIKOSHI_AUTH_MODE === "production" ? <CloudLoginForm /> : <LoginForm />}
    </Suspense>
  );
}
