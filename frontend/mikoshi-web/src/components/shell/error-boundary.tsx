"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

interface Props {
  /** page：整页内容区；widget：单张卡片 */
  area: "page" | "widget";
  title?: string;
  children: React.ReactNode;
}

/**
 * 局部错误边界：一个页面或卡片出错时只影响自身，外壳导航仍可用（SPEC §7）。
 * 不向普通用户输出栈信息（FE-48）。
 */
export class ErrorBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[mikoshi] render error", this.props.area, error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const isWidget = this.props.area === "widget";
    return (
      <Notice
        tone="danger"
        title={isWidget ? `${this.props.title ?? "此卡片"}暂时无法显示` : "此页面暂时无法显示"}
        actions={
          <Button size="sm" onClick={() => this.setState({ failed: false })}>
            重新显示
          </Button>
        }
      >
        {isWidget ? "其他卡片和导航不受影响。" : "侧栏导航仍然可用，可以前往其他页面，或重新显示本页。"}
      </Notice>
    );
  }
}
