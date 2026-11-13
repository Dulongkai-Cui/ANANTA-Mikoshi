"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { ACCOUNT_STATUSES, GROUPS, type AccountInput, type Editor, type FieldErrors } from "./model";
import { usePublication } from "./publication-provider";

export const selectClass = "min-h-10 w-full min-w-0 rounded-control border border-control bg-surface px-3 py-2 text-body text-fg";
const fields: { key: keyof AccountInput; label: string; max: number; hint?: string }[] = [
  { key: "uid", label: "B站 UID", max: 20, hint: "主页 space.bilibili.com/ 后的数字；入库后作为账号唯一标识。" },
  { key: "name", label: "账号昵称", max: 80 },
  { key: "supplier", label: "供应商", max: 120 },
  { key: "manager", label: "供应商管理人员", max: 120 },
  { key: "phone", label: "手机号", max: 40, hint: "选填；仅在本机当前演示身份保存。" },
  { key: "settlement", label: "结算方式", max: 120 },
  { key: "category", label: "账号类型", max: 120, hint: "例如杂谈、搬运、攻略、二创。" },
  { key: "persona", label: "账号人设", max: 120 },
];

export function AccountEditor() {
  const { editor } = usePublication();
  const pathname = usePathname();
  if (editor?.kind !== "account" || pathname !== editor.originPath) return null;
  return <AccountEditorForm key={`${editor.id ?? "new"}:${editor.initial}`} current={editor} />;
}

function AccountEditorForm({ current }: { current: Extract<Editor, { kind: "account" }> }) {
  const { setEditor, closeEditor, saveEditor } = usePublication();
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const form = React.useRef<HTMLFormElement>(null);
  const update = (key: keyof AccountInput, value: string) => {
    setEditor(previous => previous?.kind === "account" ? { ...previous, value: { ...previous.value, [key]: value } } : previous);
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
    setError(null);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving) return;
    setSaving(true);
    const result = await saveEditor();
    setSaving(false);
    if (!result.ok) {
      setError(result.error); setErrors(result.fields ?? {});
      requestAnimationFrame(() => {
        const invalid = form.current?.querySelector<HTMLElement>("[aria-invalid=true]");
        (invalid ?? form.current?.querySelector<HTMLElement>("[role=alert]"))?.focus();
      });
    } else { setError(null); setErrors({}); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) closeEditor(); }}>
    <DialogContent className="max-w-[46rem]" showCloseButton={!saving} onEscapeKeyDown={event => { if (saving) event.preventDefault(); }} onPointerDownOutside={event => { if (saving) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{current?.id ? "编辑账号资料" : "账号入库"}</DialogTitle><DialogDescription>B站账号的管理资料。归属标签与供应商分别记录，入库后可直接安排发布。</DialogDescription></DialogHeader>
      {current && <form ref={form} onSubmit={save} noValidate className="grid gap-5">
        {error && <Notice tone="danger" role="alert" tabIndex={-1}>{error}</Notice>}
        <fieldset disabled={saving} className="grid min-w-0 gap-x-5 gap-y-4 sm:grid-cols-2">
          {fields.map(({ key, label, max, hint }) => <div key={key} className="min-w-0 space-y-1.5">
            <Label htmlFor={`account-${key}`}>{label}{(key === "uid" || key === "name") && <span aria-hidden className="text-danger"> *</span>}</Label>
            <Input id={`account-${key}`} name={key} value={current.value[key]} maxLength={max} inputMode={key === "uid" ? "numeric" : key === "phone" ? "tel" : undefined}
              required={key === "uid" || key === "name"} readOnly={key === "uid" && Boolean(current.id)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `account-${key}-error` : hint ? `account-${key}-hint` : undefined} onChange={e => update(key, e.target.value)} />
            {errors[key] ? <p id={`account-${key}-error`} className="text-caption text-danger">{errors[key]}</p> : hint && <p id={`account-${key}-hint`} className="text-caption text-fg-secondary">{hint}</p>}
          </div>)}
          <div className="min-w-0 space-y-1.5"><Label htmlFor="account-group">归属标签</Label><select id="account-group" className={selectClass} value={current.value.group} onChange={e => update("group", e.target.value)}>{GROUPS.map(g => <option key={g}>{g}</option>)}</select></div>
          <div className="min-w-0 space-y-1.5"><Label htmlFor="account-status">账号状态</Label><select id="account-status" className={selectClass} value={current.value.status} onChange={e => update("status", e.target.value)}>{Object.entries(ACCOUNT_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><p className="text-caption text-fg-secondary">人工标记，不代表系统已完成 KPI 判断。停用后已有排期仍保留供核对。</p></div>
        </fieldset>
        <div className="space-y-1.5"><Label htmlFor="account-notes">备注</Label><textarea disabled={saving} id="account-notes" className={selectClass} rows={3} maxLength={2000} value={current.value.notes} onChange={e => update("notes", e.target.value)} /></div>
        <DialogFooter><Button type="button" disabled={saving} onClick={closeEditor}>取消</Button><Button type="submit" variant="primary" pending={saving}>保存账号</Button></DialogFooter>
      </form>}
    </DialogContent>
  </Dialog>;
}
