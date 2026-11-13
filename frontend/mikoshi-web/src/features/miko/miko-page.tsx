import { ArrowUp, FileText, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import { BrandTile } from "@/components/shell/brand";

const possibilities = [
  { icon: FileText, title: "整理资料", description: "从零散信息中，梳理重点与脉络。" },
  { icon: Lightbulb, title: "一起想创意", description: "围绕一个想法，探索更多可能。" },
  { icon: ListChecks, title: "规划下一步", description: "把目标拆成清晰、可推进的步骤。" },
] as const;

/** 纯展示占位：没有会话、模型调用、上传或任务执行。 */
export function MikoPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col py-4 sm:py-10 lg:py-16">
      <header className="flex flex-col items-center text-center">
        <BrandTile className="size-20" />
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-caption text-fg-secondary">
          <Sparkles className="size-3.5" aria-hidden /> 功能预览
        </p>
        <h1 className="mt-5 text-[2rem] leading-tight font-semibold tracking-[-0.03em] text-fg">你好，我是 MIKO</h1>
        <p className="mt-3 max-w-md text-long leading-relaxed text-fg-secondary">你的 AI 工作伙伴。这里将是一起整理信息、探索创意、推进工作的起点。</p>
      </header>

      <section aria-label="MIKO 对话预览" className="mt-9 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <label htmlFor="miko-message" className="sr-only">给 MIKO 的消息</label>
        <textarea id="miko-message" disabled rows={3} placeholder="AI 能力接入后，在这里开始对话……" aria-describedby="miko-availability"
          className="block w-full resize-none bg-transparent text-long leading-relaxed text-fg-secondary outline-none placeholder:text-fg-secondary disabled:cursor-not-allowed" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p id="miko-availability" className="max-w-full text-caption leading-relaxed text-fg-secondary">尚未接入 AI · 暂不支持发送消息</p>
          <button type="button" disabled aria-label="发送消息（尚未开放）" className="inline-flex size-11 shrink-0 cursor-not-allowed items-center justify-center rounded-control bg-control text-fg-secondary">
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </div>
      </section>

      <section aria-labelledby="miko-possibilities" className="mt-8">
        <h2 id="miko-possibilities" className="text-caption font-medium text-fg-secondary">未来，可以从这些事情开始</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {possibilities.map(({ icon: Icon, title, description }) => (
            <div key={title} className="min-w-0 rounded-card border border-line p-4">
              <Icon className="size-[18px] text-fg-secondary" strokeWidth={1.6} aria-hidden />
              <h3 className="mt-3 font-medium text-fg">{title}</h3>
              <p className="mt-1.5 text-caption leading-relaxed text-fg-secondary">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
