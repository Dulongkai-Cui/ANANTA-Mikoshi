/* eslint-disable @next/next/no-img-element -- 本地静态原图，不需要图片优化服务 */
import { cn } from "@/lib/cn";
import { assetPath } from "@/lib/asset-path";

const LOGO_SRC = assetPath("/brand/mikoshi-fox.png");

/**
 * 使用用户选定的巫女小狐狸原图，来源与 SHA 见 public/brand/README.md。
 * 图像本身保留透明边缘，不用混合模式改变颜色。
 */
export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <img
        src={LOGO_SRC}
        alt={compact ? "MIKOSHI" : "Mikoshi 巫女小狐狸"}
        width={1254}
        height={1254}
        className={cn("block h-auto shrink-0 select-none", compact ? "w-10" : "w-18")}
        draggable={false}
      />
      {!compact && (
        <>
          <span className="mt-2 text-[1.25rem] leading-7 font-semibold tracking-[0.14em] text-nav-fg-strong">MIKOSHI</span>
          <span className="mt-3 flex w-full max-w-48 items-center justify-center gap-2.5 text-left">
            <img
              src={assetPath("/brand/ananta-logo.png")}
              alt="无限大 ANANTA"
              width={612}
              height={326}
              className="block h-auto w-16 shrink-0 select-none mix-blend-screen"
              draggable={false}
            />
            <span className="min-w-0 text-caption leading-relaxed text-nav-fg">无限大业务工作中枢</span>
          </span>
        </>
      )}
    </div>
  );
}

/** 紧凑图标，用于中性页面。 */
export function BrandTile({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex size-14 shrink-0 items-center justify-center", className)}>
      <img src={LOGO_SRC} alt="MIKOSHI" width={1254} height={1254} className="block h-auto w-full select-none" draggable={false} />
    </span>
  );
}

/** 兼容旧调用 */
export function Wordmark({ compact, className }: { compact?: boolean; className?: string }) {
  return <BrandLogo compact={compact} className={className} />;
}
