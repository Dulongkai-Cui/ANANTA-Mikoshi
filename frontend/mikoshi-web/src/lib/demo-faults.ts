/**
 * 测试注入点（仅 demo adapter 读取）。浏览器测试通过 Playwright addInitScript
 * 设置 window.__MIKOSHI_DEMO_FAULTS__，用来验证 pending 与失败状态。
 * 不提供任何面向用户的调试界面；未设置时全部为无延迟、无故障。
 */
export interface DemoFaults {
  signInDelayMs?: number;
  layoutSaveDelayMs?: number;
}

declare global {
  interface Window {
    __MIKOSHI_DEMO_FAULTS__?: DemoFaults;
  }
}

export function getDemoFaults(): DemoFaults {
  if (typeof window === "undefined") return {};
  const faults = window.__MIKOSHI_DEMO_FAULTS__;
  return faults && typeof faults === "object" ? faults : {};
}

export function wait(ms: number | undefined): Promise<void> {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
