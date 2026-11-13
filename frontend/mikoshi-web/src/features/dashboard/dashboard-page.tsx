"use client";

import * as React from "react";
import { Check, LayoutGrid, Pencil, Plus, RotateCcw } from "lucide-react";

import { dashboardRepository } from "@/adapters";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notice } from "@/components/ui/notice";
import { WIDGET_TYPES, type DashboardLayout, type ExpectedRevision, type SaveError, type WidgetType } from "@/contracts/dashboard";
import { useCurrentUser } from "@/features/auth/session-provider";

import { useDraft, type LayoutDraft } from "./draft-provider";
import {
  addWidget,
  defaultWidgets,
  moveWidget,
  normalizeOrder,
  removeWidget,
  sameWidgets,
  setWidgetSize,
} from "./layout";
import { WidgetCard } from "./widget-card";
import { WIDGET_REGISTRY } from "./widgets";

type Loaded = {
  saved: DashboardLayout;
  /** 下次保存时携带的期望版本 */
  expectedRevision: ExpectedRevision;
  issue: null | "corrupted" | "unavailable";
};

type LoadState = { status: "loading" } | ({ status: "ready" } & Loaded);

const SAVE_ERROR_TEXT: Record<Exclude<SaveError["code"], "conflict">, string> = {
  storage_unavailable: "浏览器不允许写入本地存储，布局没有保存。草稿仍保留，可以稍后重试。",
  quota_exceeded: "本地存储空间已满，布局没有保存。草稿仍保留，清理浏览器数据后可重试。",
  write_failed: "写入本地存储失败，布局没有保存。草稿仍保留，可以重试。",
  invalid_layout: "布局数据不完整，没有保存。草稿仍保留，可以恢复默认后再保存。",
};

async function loadLayout(userId: string): Promise<Loaded> {
  const result = await dashboardRepository.load(userId);
  if (result.status === "ok") return { saved: result.layout, expectedRevision: result.layout.revision, issue: null };
  if (result.status === "corrupted") return { saved: result.fallback, expectedRevision: "corrupted", issue: "corrupted" };
  return { saved: result.fallback, expectedRevision: 0, issue: "unavailable" };
}

function formatToday(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

export function DashboardPage() {
  const user = useCurrentUser();
  const { draft: rawDraft, dirty, setDraft } = useDraft();
  const draft = rawDraft && rawDraft.userId === user.id ? rawDraft : null;
  const editing = draft !== null;

  const [load, setLoad] = React.useState<LoadState>({ status: "loading" });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<SaveError | null>(null);
  const [savedNotice, setSavedNotice] = React.useState(false);
  const [returnNotice, setReturnNotice] = React.useState(false);
  const [confirmReload, setConfirmReload] = React.useState(false);
  const continueReloadButton = React.useRef<HTMLButtonElement>(null);
  const [cancelled, setCancelled] = React.useState<LayoutDraft | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const savingRef = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const focusAfter = React.useRef<{ id: string; action: string } | null>(null);
  const editButtonRef = React.useRef<HTMLButtonElement>(null);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);

  // 首次进入：读取布局；若外壳里还保留着本人的未保存草稿（例如从浏览器后退回来），提示恢复
  React.useEffect(() => {
    let active = true;
    void loadLayout(user.id).then((loaded) => {
      if (active) setLoad({ status: "ready", ...loaded });
    });
    if (draft && !sameWidgets(draft.saved, draft.widgets)) setReturnNotice(true); // eslint-disable-line react-hooks/set-state-in-effect -- 仅挂载时判断一次
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在身份变化时重新读取
  }, [user.id]);

  // 移动/移除后把焦点放回合适位置
  React.useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    const card = document.querySelector<HTMLElement>(`[data-widget="${target.id}"]`);
    const button = card?.querySelector<HTMLButtonElement>(`[data-action="${target.action}"]`);
    if (button && !button.disabled) button.focus();
    else card?.querySelector<HTMLElement>("h2")?.focus();
  });

  if (load.status === "loading") {
    return (
      <div aria-busy="true">
        <PageHeader title="我的工作台" description="正在读取首页布局…" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-44 rounded-card bg-surface shadow-card ${i === 0 || i === 3 ? "lg:col-span-2" : ""}`} />
          ))}
        </div>
      </div>
    );
  }

  const widgets = normalizeOrder(editing ? draft.widgets : load.saved.widgets);
  const usedTypes = new Set(widgets.map((w) => w.type));

  const updateDraft = (fn: (d: LayoutDraft) => LayoutDraft) => {
    if (savingRef.current) return;
    setDraft((d) => (d ? fn(d) : d));
  };

  const startEditing = () => {
    setSaveError(null);
    setSavedNotice(false);
    setCancelled(null);
    setDraft({ userId: user.id, baseRevision: load.expectedRevision, saved: load.saved.widgets, widgets: load.saved.widgets });
    setAnnouncement("已进入编辑模式");
  };

  const cancelEditing = () => {
    if (savingRef.current) return;
    if (dirty && draft) setCancelled(draft);
    setDraft(null);
    setSaveError(null);
    setReturnNotice(false);
    setAnnouncement(dirty ? "已取消编辑，未保存的修改已丢弃，可以撤销" : "已退出编辑模式");
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  const undoCancel = () => {
    if (!cancelled) return;
    setDraft(cancelled);
    setCancelled(null);
    setAnnouncement("已恢复刚才取消的修改");
  };

  const save = async () => {
    if (!draft || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    const result = await dashboardRepository.save({ userId: user.id, widgets: draft.widgets, expectedRevision: draft.baseRevision });
    if (!mounted.current) return;
    savingRef.current = false;
    setSaving(false);
    if (result.ok) {
      setLoad({ status: "ready", saved: result.layout, expectedRevision: result.layout.revision, issue: null });
      setDraft(null);
      setReturnNotice(false);
      setSavedNotice(true);
      setAnnouncement("首页布局已保存");
      requestAnimationFrame(() => editButtonRef.current?.focus());
    } else {
      setSaveError(result.error);
      setAnnouncement(result.error.code === "conflict" ? "保存冲突：布局已在其他地方更新" : "保存失败，草稿仍保留");
    }
  };

  const reloadSaved = async () => {
    setConfirmReload(false);
    const loaded = await loadLayout(user.id);
    setLoad({ status: "ready", ...loaded });
    setDraft(null);
    setSaveError(null);
    setReturnNotice(false);
    setAnnouncement("已重新载入已保存的布局");
  };

  const keepMine = () => {
    if (saveError?.code !== "conflict") return;
    const current = saveError.currentRevision;
    updateDraft((d) => ({ ...d, baseRevision: current }));
    setSaveError(null);
    setAnnouncement("将以你的草稿覆盖较新的布局，请再次点击保存");
  };

  const add = (type: WidgetType) => {
    if (savingRef.current) return;
    updateDraft((d) => ({ ...d, widgets: addWidget(d.widgets, type) }));
    focusAfter.current = { id: `w-${type}`, action: "remove" };
    setAnnouncement(`已添加${WIDGET_REGISTRY[type].title}，位于最后`);
  };

  const editActions = (id: string, index: number, total: number) => {
    const title = WIDGET_REGISTRY[widgets[index]!.type].title;
    return {
      disabled: saving,
      index,
      total,
      onMove: (direction: -1 | 1) => {
        updateDraft((d) => ({ ...d, widgets: moveWidget(d.widgets, id, direction) }));
        focusAfter.current = { id, action: direction === -1 ? "up" : "down" };
        setAnnouncement(`${title}已移到第 ${index + 1 + direction} 位，共 ${total} 张`);
      },
      onResize: (size: "standard" | "wide") => {
        updateDraft((d) => ({ ...d, widgets: setWidgetSize(d.widgets, id, size) }));
        setAnnouncement(`${title}宽度设为${size === "wide" ? "宽" : "标准"}`);
      },
      onRemove: () => {
        const next = widgets[index + 1] ?? widgets[index - 1];
        updateDraft((d) => ({ ...d, widgets: removeWidget(d.widgets, id) }));
        focusAfter.current = next ? { id: next.id, action: "remove" } : null;
        if (!next) requestAnimationFrame(() => addButtonRef.current?.focus());
        setAnnouncement(`已移除${title}，保存后生效`);
      },
    };
  };

  const resetDefault = () => {
    updateDraft((d) => ({ ...d, widgets: defaultWidgets() }));
    setAnnouncement("草稿已恢复为默认布局，保存后生效");
  };

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={addButtonRef} disabled={saving}>
          <Plus aria-hidden />
          添加卡片
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>每种卡片最多添加一张</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WIDGET_TYPES.map((type) => {
          const def = WIDGET_REGISTRY[type];
          const used = usedTypes.has(type);
          return (
            <DropdownMenuItem key={type} disabled={used} onSelect={() => add(type)} className="items-start py-2">
              <LayoutGrid aria-hidden className="mt-0.5" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{def.title}</span>
                <span className="text-caption text-fg-secondary">{used ? "已在首页，不能重复添加" : def.description}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
      <PageHeader
        eyebrow="MY WORKSPACE"
        title="我的工作台"
        description={editing ? "正在编辑首页布局。修改只影响你自己的首页，点击保存后生效。" : "关心的业务入口与状态集中在这里。可以按需调整卡片。"}
        meta={
          <>
            <span className="tabular text-caption text-fg-secondary">{formatToday()}</span>
            <span aria-hidden className="text-fg-muted">·</span>
            <span className="text-caption text-fg-secondary">{user.displayName}（演示身份）</span>
            {editing && <Badge tone="info">编辑中{dirty ? " · 有未保存修改" : ""}</Badge>}
            {!editing && savedNotice && (
              <Badge tone="success">
                <Check aria-hidden />
                布局已保存
              </Badge>
            )}
          </>
        }
        actions={
          editing ? (
            <>
              {addMenu}
              <Button onClick={resetDefault} disabled={saving}>
                <RotateCcw aria-hidden />
                恢复默认
              </Button>
              <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                取消
              </Button>
              <Button variant="primary" onClick={save} pending={saving}>
                {saving ? "正在保存…" : "保存布局"}
              </Button>
            </>
          ) : (
            <Button ref={editButtonRef} onClick={startEditing}>
              <Pencil aria-hidden />
              编辑首页
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-3 empty:hidden">
        {returnNotice && editing && dirty && (
          <Notice
            tone="info"
            title="还有未保存的布局"
            actions={
              <>
                <Button size="sm" variant="primary" onClick={() => setReturnNotice(false)}>
                  继续编辑
                </Button>
                <Button size="sm" variant="danger" onClick={cancelEditing} disabled={saving}>
                  放弃更改
                </Button>
              </>
            }
          >
            你离开首页前的修改仍然保留，保存后才会生效。
          </Notice>
        )}
        {load.issue === "corrupted" && (
          <Notice tone="warning" title="已保存的布局无法读取">
            本地布局数据已损坏或版本不兼容，现在显示默认布局。原数据没有被改动；编辑并保存后才会替换它。
          </Notice>
        )}
        {load.issue === "unavailable" && (
          <Notice tone="warning" title="无法访问本地存储">
            浏览器不允许读取本地存储，现在显示默认布局，保存可能会失败。
          </Notice>
        )}
        {saveError?.code === "conflict" && (
          <Notice
            tone="warning"
            title="布局已在其他地方更新"
            actions={
              <>
                <Button size="sm" onClick={() => setConfirmReload(true)}>
                  重新载入已保存布局
                </Button>
                <Button size="sm" onClick={keepMine}>
                  保留我的草稿并覆盖
                </Button>
              </>
            }
          >
            你开始编辑后，同一身份在另一个窗口保存了新布局。你的草稿仍然保留，请选择如何处理。
          </Notice>
        )}
        {saveError && saveError.code !== "conflict" && (
          <Notice
            tone="danger"
            title="布局没有保存"
            actions={
              <Button size="sm" onClick={save}>
                重试保存
              </Button>
            }
          >
            {SAVE_ERROR_TEXT[saveError.code]}
          </Notice>
        )}
        {cancelled && !editing && (
          <Notice
            tone="info"
            title="已取消编辑，修改已丢弃"
            actions={
              <>
                <Button size="sm" onClick={undoCancel}>
                  撤销
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCancelled(null)}>
                  知道了
                </Button>
              </>
            }
          >
            首页恢复为上次保存的布局。
          </Notice>
        )}
      </div>

      {widgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {widgets.map((w, index) => (
            <WidgetCard key={w.id} widget={w} edit={editing ? editActions(w.id, index, widgets.length) : undefined} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-card bg-surface px-6 py-14 text-center shadow-card">
          <LayoutGrid className="size-6 text-fg-muted" aria-hidden />
          <p className="mt-3 font-semibold text-fg">首页还没有卡片</p>
          <p className="mt-1 max-w-sm text-fg-secondary">
            {editing ? "用“添加卡片”选择要显示的内容，或恢复默认布局。" : "进入编辑后可以添加卡片或恢复默认布局。"}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {editing ? (
              <>
                {WIDGET_TYPES.map((type) => (
                  <Button key={type} size="sm" onClick={() => add(type)} disabled={saving}>
                    <Plus aria-hidden />
                    {WIDGET_REGISTRY[type].title}
                  </Button>
                ))}
              </>
            ) : (
              <Button onClick={startEditing}>
                <Pencil aria-hidden />
                编辑首页
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <Dialog open={confirmReload} onOpenChange={setConfirmReload}>
        <DialogContent showCloseButton={false} onOpenAutoFocus={(event) => {
          event.preventDefault();
          continueReloadButton.current?.focus();
        }}>
          <DialogHeader>
            <DialogTitle>放弃草稿并重新载入？</DialogTitle>
            <DialogDescription>重新载入会显示最新保存的布局，你当前草稿中的修改会丢失。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="danger" onClick={reloadSaved}>
              放弃草稿并重新载入
            </Button>
            <Button ref={continueReloadButton} variant="primary" onClick={() => setConfirmReload(false)}>
              继续编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
