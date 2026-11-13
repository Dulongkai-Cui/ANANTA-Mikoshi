# 前端技能、组件与设计参考库

收集日期：2026-10-18。状态：源码待选，尚未安装或启用技能。

Mikoshi实际使用方法见 [前端规范](../../Constitution/Frontend/README.md) 与 [技能手册](../../Constitution/Frontend/SKILL_PLAYBOOK.md)。本页管理资源位置/来源，生效规则在Constitution，不复制上游全部偏好。

这里按用户给出的六个 GitHub 地址克隆，保留每仓自己的 `.git`、origin 和原始源码。准确分支/提交见 [sources.lock.json](sources.lock.json)，本轮完整性检查见 [验收记录](../../SBS/evidence/SBS-0005/acceptance.md)。

## 怎么挑

| 本地目录 / 上游 | 类型与用途 | 建议先读 |
|---|---|---|
| [ui-ux-pro-max-skill](ui-ux-pro-max-skill/) · [来源](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 设计方案、样式、配色及 UX 规则检索技能；可辅助形成设计规范候选 | [中文说明](ui-ux-pro-max-skill/README.zh.md)、[技能入口](ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md)、[数据与脚本](ui-ux-pro-max-skill/src/ui-ux-pro-max/) |
| [taste-skill](taste-skill/) · [来源](https://github.com/leonxlnx/taste-skill) | 视觉方向、改版与多种风格技能；默认主技能主要面向公开营销页面 | [说明](taste-skill/README.md)、[克制界面](taste-skill/skills/minimalist-skill/SKILL.md)、[柔和风格](taste-skill/skills/soft-skill/SKILL.md)、[现有界面改版](taste-skill/skills/redesign-skill/SKILL.md) |
| [impeccable](impeccable/) · [来源](https://github.com/pbakaus/impeccable) | 设计构思、审查与打磨工具，含交互、视觉和可访问性相关指导 | [说明](impeccable/README.md)、[技能源文件](impeccable/skill/SKILL.src.md)、[技能资料](impeccable/skill/) |
| [shadcn-ui](shadcn-ui/) · [来源](https://github.com/shadcn-ui/ui) | 可修改的界面组件、registry 和 CLI 源码，作为组件实现候选 | [说明](shadcn-ui/README.md)、[组件源码](shadcn-ui/apps/v4/registry/)、[本地文档源](shadcn-ui/apps/v4/content/)、[官方文档](https://ui.shadcn.com/docs) |
| [awesome-design-md](awesome-design-md/) · [来源](https://github.com/voltagent/awesome-design-md) | 对品牌网站设计语言的分析与 DESIGN.md 样本，适合比较排版、配色和视觉规则 | [案例清单](awesome-design-md/README.md)、[设计样本](awesome-design-md/design-md/)、[Linear 分析样本](awesome-design-md/design-md/linear.app/DESIGN.md)；当前快照的 design-md 下没有 HTML 预览文件 |
| [emilkowalski-skills](emilkowalski-skills/) · [来源](https://github.com/emilkowalski/skills) | 设计工程与动效技能，辅助细化交互反馈、动画与性能检查 | [说明](emilkowalski-skills/README.md)、[设计工程技能](emilkowalski-skills/skills/emil-design-eng/SKILL.md)、[技能集合](emilkowalski-skills/skills/) |

建议先用设计样本比较方向，再评估设计技能如何辅助规范、shadcn/ui 如何承载组件，最后挑选审查与动效工具。以上是阅读建议，未作技术选型决定。一个页面执行包应明确采用哪些规则及其优先级，避免把六套偏好全部叠加。

## 当前收集方式

- 六仓均采用 `git clone --depth 1 --no-tags`，当前提交的跟踪文件完整保留，历史只有浅克隆边界内的内容；不是 ZIP 快照或裁剪版。
- 没有安装依赖、构建应用、运行上游脚本、创建技能链接或启用 hooks。源码可读与功能可运行分别验收。
- 这六个目录被根 `.gitignore` 精确排除，是独立来源仓库，未注册为 submodule。根仓保存本页和版本清单，克隆根仓不会自动取回这些源码。
- 原始 README、LICENSE/NOTICE、锁文件及上游配置均留在各仓内；不直接修改上游快照来承载 Mikoshi 业务。后续需要改造时明确分支/补丁和引用关系。

## 版本恢复与更新

`sources.lock.json` 记录 URL、相对目录、默认分支和本次完整提交 SHA。换机器时按清单逐项克隆到相同目录；**已有目标目录先核对，不覆盖、不 reset、不 clean**。

示例（在本项目根目录运行，仅当目标目录不存在）：

```powershell
git clone --depth 1 --no-tags https://github.com/shadcn-ui/ui.git frontend/fronted-skill/shadcn-ui
```

这条命令取得执行时的分支最新版本。要恢复本次确切版本，从清单复制对应 `commit`，在该新建且干净的仓库中执行 `git fetch --depth 1 origin <commit>`，然后 `git checkout --detach <commit>`，核对 HEAD。若上游不再提供该提交，需要另行寻找上游保留引用或已有副本；版本清单不是独立备份。

需要完整历史时，在对应仓库执行 `git fetch --unshallow origin`，需要标签再显式取回。后续更新应先核对工作树、阅读上游变更，再明确更新单个资源及版本清单；不一键更新全部或覆盖本地改动。

## 许可与启用边界

| 仓库 | 本次快照许可入口 |
|---|---|
| ui-ux-pro-max-skill | [MIT](ui-ux-pro-max-skill/LICENSE) |
| taste-skill | [MIT](taste-skill/LICENSE) |
| impeccable | [Apache-2.0](impeccable/LICENSE) 与 [NOTICE](impeccable/NOTICE.md) |
| shadcn-ui | [MIT](shadcn-ui/LICENSE.md) |
| awesome-design-md | [MIT](awesome-design-md/LICENSE) |
| emilkowalski-skills | [MIT](emilkowalski-skills/LICENSE) |

实际复用时保留相关许可/版权说明，具体文件的第三方声明继续适用。awesome-design-md 是社区分析样本，不等于相应品牌官方规范或品牌素材授权。impeccable 的安装/运行还涉及 provider hooks、engine 获取和部分网络能力；本轮只克隆源码，后续选用时按执行包界定这些动作。

各仓内部 AGENTS/CLAUDE/SKILL 文档仅在相应范围内阅读和评估。它们不自动覆盖 Mikoshi 的 Constitution、当前 SBS、用户要求或工具权限。挑选后再确定项目级接入方式，不默认安装到用户全局目录。
