import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * 让 tailwind-merge 认识 Mikoshi 的语义字号/圆角/阴影 token。
 * 否则 `text-body`（字号）会被当成文字颜色，与 `text-on-accent` 互相覆盖。
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["title", "section", "body", "long", "caption", "metric", "eyebrow"],
      radius: ["control", "card", "overlay"],
      shadow: ["card", "overlay", "control", "primary"],
    },
  },
});

/** 合并 className；与 shadcn/ui 约定的 cn() 等价。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
