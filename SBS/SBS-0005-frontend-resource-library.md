# SBS 0005 前端技能与组件资源库

状态：ACCEPTED
日期：2026-10-18
负责人/实施者：Codex
独立验收者：frontend_sources_review
前置：SBS-0004 已 ACCEPTED，见 [验收](evidence/SBS-0004/acceptance.md)。
需求/执行包：本文件 v1；用户本轮明确要求将指定六个 GitHub 仓库克隆到 `frontend/fronted-skill/`，之后再挑选用于前端的技能与组件。

## 授权、目标与基线

从“本地没有统一前端候选资源库”到“六个上游源码仓库均可本地查看，有用途/入口和准确版本记录”。这是用户直接授权的资源准备，不是业务开发或技术选型批准。

根仓：`D:\产品孵化器\OpenBP_ ANANTA Mikoshi`，分支 `main`，HEAD `5d888802504073bfa1f52f000848c6c18baabba4`；开始时暂存区/工作区干净。`frontend` 尚不存在。根 AGENTS、Constitution 反屎山规则/协作规则、SBS 流程、当前交接已阅读。旧组件仓库及业务资料不在修改范围。

## 范围与非目标

- 按用户拼写创建 `frontend/fronted-skill/`，六个独立 Git 工作目录保留上游 origin。
- 用户指定来源：`nextlevelbuilder/ui-ux-pro-max-skill`、`leonxlnx/taste-skill`、`pbakaus/impeccable`、`shadcn-ui/ui`、`voltagent/awesome-design-md`、`emilkowalski/skills`。
- 默认分支浅克隆（depth 1、no tags），保留该版本全部跟踪源码；不删减仓库内容，不安装 node_modules、不运行上游安装/构建/技能脚本、不自动启用任何全局或项目技能。
- 根仓精确忽略六个源码目录，仅管理本地导航、版本清单与治理记录；不是 submodule。
- 可改：本 SBS/INDEX/验收证据、`frontend/` 新目录、根 `.gitignore`/README/REPOSITORIES、Product 当前交接。
- 不改变业务数据/接口/权限；不启动页面实现、部署或发布。无需新建产品 PRD，本文件即资源准备规格。

## 实施计划

1. 先保存本 READY 计划与验收标准，更新唯一活动索引。
2. 建目录和精确忽略项；克隆六个来源（已有目录绝不覆盖，失败保留现场后诊断）。
3. 阅读上游说明，记录默认分支、完整 HEAD、origin、浅克隆状态、许可和主要入口。上游规则作为参考，不提升为本项目生效规则。
4. 写易读用途索引和机器可读版本清单，说明恢复方式与后续挑选方法；更新根入口和当前交接。
5. 核验六仓来源/工作树完整性/干净状态、根忽略边界和文档链接。子任务只读核实分类并独立验收，主代理统一收口。

## 验收标准

| AC | 预期 | 证据 |
|---|---|---|
| AC-01 | 指定目录下六个独立 Git 仓库齐全，origin 与六个用户来源一一对应 | 实际路径、remote、HEAD/branch、git status |
| AC-02 | 工作树完整且干净，上游许可及主要入口保留；下载错误不会被记作完成 | ls-files/文件存在、diff/status、git fsck（浅边界内） |
| AC-03 | 有用途分类、入口、固定版本与恢复说明；明确源码备选不等于技能安装/运行集成 | README、sources.lock.json 与独立核查 |
| AC-04 | 根仓忽略六个源码仓，导航和记录可跟踪；无旧组件/业务文件修改 | git check-ignore、root diff/status |
| AC-05 | 独立审查完成，当前 SBS/INDEX/交接同步真实结论及 Git 边界 | acceptance.md、review.md |

## 验证、风险与回退

使用本机 Git 的 clone、remote、rev-parse、ls-files、diff/status、fsck 只读校验和文件/链接检查。克隆是用户授权的 GitHub 公共来源读取，不进行 push、包安装、模型调用或真实业务操作。无运行代码变化，不做无关全量构建测试。

源码目录不由根提交备份，以来源 URL 和完整 SHA 恢复；浅克隆不包含完整历史，未来如需可单独 deepen/unshallow。上游各技能可能有风格冲突，后续执行包明确选择才启用。原始 LICENSE/NOTICE 保留，具体采纳时核对相应许可。若失败，不删除或覆盖已有成果；新增目录的移除必须另做路径核对，通常保留并报告即可。本轮无依赖外部业务决定的阻断项。

## 实施与验收记录

READY 计划已先落盘后执行。六仓 clone 完成，11,414 个跟踪文件存在、六仓干净、fsck 通过；用途导航与固定版本已保存。沙箱网络失败后经获准的联网执行完成，细节见 [验收](evidence/SBS-0005/acceptance.md)。独立审查 AC-01 至 AC-04 全 PASS，无返工；最终同步 INDEX/当前交接与 AC-05，状态 ACCEPTED。见 [独立报告](evidence/SBS-0005/review.md)。根文档仍未提交/推送，不把六个上游 clone 称为 Mikoshi 已完成备份。
