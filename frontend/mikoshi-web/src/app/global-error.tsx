"use client";

/** 根布局本身出错时的最后兜底；不输出栈信息 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Mikoshi 暂时无法显示</h1>
        <p style={{ marginTop: 8 }}>请重试；若仍然失败，刷新页面。</p>
        <button type="button" onClick={reset} style={{ marginTop: 16, padding: "8px 16px" }}>
          重试
        </button>
      </body>
    </html>
  );
}
