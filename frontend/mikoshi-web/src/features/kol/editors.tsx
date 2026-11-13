"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKINGS, CHOICES, PLATFORMS, SELECTIONS, STAGES, TALENT_STATUSES, type Editor, type FieldErrors } from "./model";
import { useKol } from "./kol-provider";
import { ScheduleActions, selectClass } from "./shared-ui";

type Field = { key: string; label: string; kind?: "textarea" | "date" | "time" | "number"; max?: number; required?: boolean; hint?: string; options?: { value: string; label: string; disabled?: boolean }[]; readOnly?: boolean };
const options = (values: Record<string, string>) => Object.entries(values).map(([value, label]) => ({ value, label }));
export function KolEditors() {
  const { editor } = useKol(), pathname = usePathname();
  return editor && pathname === editor.originPath ? <EditorForm key={`${editor.kind}:${editor.id ?? "new"}:${editor.initial}`} current={editor} /> : null;
}
function EditorForm({ current }: { current: Editor }) {
  const { data, setEditor, closeEditor, saveEditor } = useKol();
  const [errors, setErrors] = React.useState<FieldErrors>({}), [error, setError] = React.useState<string | null>(null), [saving, setSaving] = React.useState(false);
  const [extraOpen, setExtraOpen] = React.useState(false);
  const form = React.useRef<HTMLFormElement>(null), busy = React.useRef(false);
  let main: Field[], extra: Field[] = [];
  if (current.kind === "talent") {
    main = [
      { key: "platform", label: "平台", required: true, options: PLATFORMS.map(p => ({ value: p, label: p })), readOnly: Boolean(current.id) },
      { key: "externalId", label: "平台账号标识 / B站 UID", required: true, max: 80, readOnly: Boolean(current.id), hint: "入库后不可更换；同平台同标识只保留一份达人档案。" },
      { key: "name", label: "达人昵称", required: true, max: 80 }, { key: "profileUrl", label: "主页链接", max: 500 },
      { key: "category", label: "内容领域", max: 120 }, { key: "tier", label: "达人层级", max: 120 },
      { key: "selection", label: "初筛状态", options: options(SELECTIONS), hint: "初筛通过不代表已签约。" }, { key: "status", label: "达人状态", options: options(TALENT_STATUSES), hint: "停用会禁止新合作和排期，已有计划保留待核对。" },
    ];
    extra = [{ key: "tags", label: "标签", max: 240 }, { key: "owner", label: "内部负责人", max: 120 }, { key: "supplier", label: "供应商 / 推荐来源", max: 120 }, { key: "contact", label: "联系人", max: 120, hint: "选填，仅保存在当前身份的本机浏览器。" }, { key: "followers", label: "粉丝数", kind: "number", hint: "人工登记，未知留空，不自动抓取。" }, { key: "referencePrice", label: "参考价（元）", kind: "number", hint: "历史或参考金额，不等于本次合作报价。" }, { key: "notes", label: "达人备注", kind: "textarea", max: 2000 }];
  } else if (current.kind === "collaboration") {
    main = [
      { key: "talentId", label: "合作达人", required: true, readOnly: Boolean(current.id), options: [{ value: "", label: "请选择已入库达人" }, ...data.talents.map(t => ({ value: t.id, label: `${t.name} · ${t.platform}${t.status === "archived" ? " · 已停用" : ""}`, disabled: t.status === "archived" && t.id !== current.value.talentId }))] },
      { key: "title", label: "主题 / 合作名称", required: true, max: 160 }, { key: "wave", label: "传播波次", max: 120 }, { key: "choice", label: "人选安排", options: options(CHOICES) },
      { key: "owner", label: "内部认领人", max: 120 }, { key: "supplier", label: "执行供应商", max: 120 },
      { key: "stage", label: "合作阶段", options: options(STAGES), hint: "人工进度登记；不生成平台发布结果。取消合作后已有排期保留待核对。" },
      { key: "booking", label: "档期状态", options: options(BOOKINGS), hint: "口头预留与正式锁档分开记录，不代表系统完成采购。" },
      { key: "deadline", label: "交付日期", kind: "date" }, { key: "nextStep", label: "下一步", max: 1000 }, { key: "blocker", label: "当前阻碍", kind: "textarea", max: 1000 },
    ];
    extra = [{ key: "creative", label: "创意方向", kind: "textarea", max: 2000 }, { key: "sellingPoint", label: "产品卖点", kind: "textarea", max: 2000 }, { key: "quote", label: "合作报价（元）", kind: "number", hint: "未知留空；不是预算、消耗或结算。" }, { key: "quoteScope", label: "报价范围 / 制作说明", max: 1000 }, { key: "scriptDate", label: "脚本日期", kind: "date" }, { key: "draftDate", label: "回稿日期", kind: "date" }, { key: "productionCycle", label: "制作周期", max: 120 }, { key: "latestOrderDate", label: "最迟下单日", kind: "date", hint: "人工计划节点，不执行下单。" }, { key: "notes", label: "合作备注", kind: "textarea", max: 2000 }];
  } else {
    main = [{ key: "collaborationId", label: "关联合作", required: true, options: [{ value: "", label: "请选择达人合作" }, ...data.collaborations.map(c => { const t = data.talents.find(t => t.id === c.talentId); return { value: c.id, label: `${c.title} · ${t?.name ?? "达人未知"} · ${t?.platform ?? ""}${c.stage === "cancelled" || t?.status !== "active" ? " · 不可新增" : ""}`, disabled: (c.stage === "cancelled" || t?.status !== "active") && c.id !== current.value.collaborationId }; })] }, { key: "title", label: "排期标题", required: true, max: 160 }, { key: "date", label: "计划日期", required: true, kind: "date" }, { key: "time", label: "计划时间", required: true, kind: "time", hint: "上海时间 · UTC+8" }, { key: "review", label: "人工确认", options: [{ value: "pending", label: "待确认" }, { value: "confirmed", label: "人工确认" }] }, { key: "content", label: "内容说明", kind: "textarea", max: 4000 }, { key: "notes", label: "排期备注", kind: "textarea", max: 2000 }];
  }
  const update = (field: Field, raw: string) => {
    const value = field.kind === "number" ? (raw === "" ? null : Number(raw)) : raw;
    setEditor(previous => previous?.kind === current.kind ? { ...previous, value: { ...previous.value, [field.key]: value } } as Editor : previous);
    setErrors(previous => { const next = { ...previous }; delete next[field.key]; return next; }); setError(null);
  };
  const fieldView = (field: Field) => {
    const id = `kol-${current.kind}-${field.key}`, value = (current.value as unknown as Record<string, string | number | null>)[field.key];
    const props = { id, required: field.required, "aria-invalid": Boolean(errors[field.key]), "aria-describedby": errors[field.key] ? `${id}-error` : field.hint ? `${id}-hint` : undefined, value: value ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(field, e.target.value) };
    return <div key={field.key} className={`min-w-0 space-y-1.5 ${field.kind === "textarea" ? "sm:col-span-2" : ""}`}><Label htmlFor={id}>{field.label}{field.required && <span aria-hidden className="text-danger"> *</span>}</Label>{field.options ? <select {...props} disabled={saving || field.readOnly} className={selectClass}>{field.options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select> : field.kind === "textarea" ? <textarea {...props} className={selectClass} maxLength={field.max} rows={3} /> : <Input {...props} readOnly={field.readOnly} type={field.kind ?? "text"} maxLength={field.max} min={field.kind === "date" ? "2000-01-01" : field.kind === "number" ? 0 : undefined} max={field.kind === "date" ? "2100-12-31" : undefined} step={field.kind === "number" ? "any" : undefined} />}{errors[field.key] ? <p id={`${id}-error`} className="text-caption text-danger">{errors[field.key]}</p> : field.hint && <p id={`${id}-hint`} className="text-caption text-fg-secondary">{field.hint}</p>}</div>;
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy.current) return;
    busy.current = true; setSaving(true);
    const result = await saveEditor();
    busy.current = false; setSaving(false);
    if (!result.ok) { setError(result.error); setErrors(result.fields ?? {}); requestAnimationFrame(() => { const invalid = form.current?.querySelector<HTMLElement>("[aria-invalid=true]"); (invalid ?? form.current?.querySelector<HTMLElement>("[role=alert]"))?.focus(); }); }
  };
  const names = { talent: ["KOL 入库", "编辑达人资料", "保存达人"], collaboration: ["新建 KOL 合作", "编辑 KOL 合作", "保存合作"], schedule: ["新增 KOL 发布排期", "编辑 KOL 发布排期", "保存排期"] };
  const savedSchedule = current.kind === "schedule" && current.id ? data.schedules.find(s => s.id === current.id) : undefined;
  return <Dialog open onOpenChange={open => { if (!open && !saving) closeEditor(); }}><DialogContent className="max-w-[52rem]" showCloseButton={!saving} onEscapeKeyDown={event => { if (saving) event.preventDefault(); }} onPointerDownOutside={event => { if (saving) event.preventDefault(); }}><DialogHeader><DialogTitle>{names[current.kind][current.id ? 1 : 0]}</DialogTitle><DialogDescription>{current.kind === "talent" ? "先建立达人档案，再创建每一次合作。入库不代表签约。" : current.kind === "collaboration" ? "把主题、负责人、档期与交付放在一条合作里，阶段由人工维护。" : "关联已有合作并安排具体发布。保存计划不会自动发帖。"}</DialogDescription></DialogHeader><form ref={form} onSubmit={save} noValidate className="grid gap-5">{error && <p role="alert" tabIndex={-1} className="rounded-control bg-danger-soft p-3 text-body text-danger">{error}</p>}<fieldset disabled={saving} className="grid min-w-0 gap-x-5 gap-y-4 sm:grid-cols-2">{main.map(fieldView)}</fieldset>{extra.length > 0 && <details className="rounded-control border border-line p-3" open={extraOpen || extra.some(f => errors[f.key])} onToggle={event => setExtraOpen(event.currentTarget.open)}><summary className="cursor-pointer py-1 text-body font-medium">{current.kind === "talent" ? "补充分类、联系资料与参考指标" : "创意、报价与交付节点"}</summary><fieldset disabled={saving} className="mt-4 grid min-w-0 gap-x-5 gap-y-4 sm:grid-cols-2">{extra.map(fieldView)}</fieldset></details>}{savedSchedule && <div className="border-t border-line pt-4"><p className="mb-2 text-caption text-fg-secondary">对已保存的计划执行操作；本窗口未保存的修改不会保留。</p><ScheduleActions item={savedSchedule} inEditor /></div>}<DialogFooter><Button type="button" disabled={saving} onClick={closeEditor}>取消</Button><Button type="submit" variant="primary" pending={saving}>{names[current.kind][2]}</Button></DialogFooter></form></DialogContent></Dialog>;
}
