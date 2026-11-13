# SBS 0006 前端设计规范与技能执行手册

状态：ACCEPTED
日期：2026-10-18
负责人/文档实施者：Codex；研究可并行，最终文档统一由主代理整合。
前置：SBS-0005 已 ACCEPTED，见 [验收](evidence/SBS-0005/acceptance.md)。
规格版本：本文件 v1。

## 授权和目标

用户要求仔细研究 emilkowalski-skills，解释其与苹果设计的关系，并在 Constitution 写完整的前端设计规范及这些 skill 的使用文档，作为未来正式施工依据。本步交付可执行的文档基线和 Claude 模板，不启动业务页面开发或安装工具。

用户授权制定规范和流程；用户尚未看过任何 Mikoshi 视觉样张，不能把“询问是否像苹果”记成已经批准照搬苹果、固定主题或整个平台技术选型。规范明确区分必须遵守的质量规则、v0.1 可调整设计默认值和待视觉原型确认的品牌表现；不因未定配色中断文档工作。总体产品提案仍保留原状态。

## 基线与已有改动

根：`D:\产品孵化器\OpenBP_ ANANTA Mikoshi`；`main`；HEAD `5d888802504073bfa1f52f000848c6c18baabba4`。暂存区为空。

上步未提交成果保留：`.gitignore`、README、REPOSITORIES、SBS/INDEX、Product/handoffs/CURRENT，及 SBS-0005 本文/三份证据、frontend 两份 README 和 sources.lock.json。本轮仅在其中相关导航上追加，不清除、批量提交或改写上步成果。

六份上游版本以 `frontend/fronted-skill/sources.lock.json` 为准，尤其 emilkowalski-skills `2d228630ba1446365f614a108cb8252f1feda202`。只读现有快照，不 pull、不改上游、不运行上游脚本。适用根 AGENTS、Constitution、SBS、Product 交接与当前设计提案。

## 范围与文件归属

- 主代理：`Constitution/Frontend/{README,DESIGN_STANDARD,SKILL_PLAYBOOK,ACCEPTANCE}.md`、`Product/templates/FRONTEND_EXECUTION_TEMPLATE.md`；Constitution 版本/变更/入口、Product BRIEF/DECISIONS/交接、根 CLAUDE/README 与 frontend 导航；本 SBS/索引/证据。
- emil 研究代理：仅 `Product/research/frontend-design/EMIL_RESEARCH.md`，完整读取该仓 Markdown/附属规范，记录范围、事实、引用与取舍。
- skills 研究代理：仅 `Product/research/frontend-design/RESOURCE_RESEARCH.md`，研究 ui-ux-pro-max、taste、impeccable 的当前真实入口/命令、冲突与启用方式。
- 标准研究代理：仅 `Product/research/frontend-design/STANDARDS_RESEARCH.md`，研究 shadcn/ui、DESIGN.md 样本、Apple/W3C 官方资料及 Mikoshi 场景要求。
- 研究完成后指定未编写最终规范的代理独立验收，只写本 SBS 的 review 证据；主代理统一 AC 结果。

## 实施计划

1. 保存 READY 计划与标准；核对版本/已有改动。
2. 并行细读来源并记录准确路径/完整 SHA，外部事实只采用官方资料；主代理统筹业务适配和规范结构。
3. 制定设计语言（语义 tokens、排版、密度、组件、动效）、首页定制与六板块模板、多人权限/并发、Agent 状态、可访问性与前后端合同要求。
4. 写六资源职责/启用条件/冲突处理/按需读取与 Claude 执行模板；落实输入、输出、检查点、版本绑定和交付证据，不宣称技能能保证完美。
5. 校验引用、文件链接、token 对比度等可离线验证规则；由独立审查者核查完整性和来源忠实度，修复后 ACCEPTED。
6. 同步 Constitution 版本/变更与交接，明确文档质量通过不等于视觉验收或系统实现。保留未提交状态，不替用户开始新 SBS。

## 验收标准

| AC | 必需结果 | 方法 |
|---|---|---|
| AC-01 | emil 全部现有 Markdown 阅读有清单/哈希，Apple 关系有原文入口；六资源引用绑定当前快照，来源事实与建议分开 | 阅读记录、Git SHA、官方引用、独立比对 |
| AC-02 | 规范可覆盖可定制首页、六业务板块、多人/权限/并发、长期 Agent、数据真实性，包含常规/异常/空/加载状态和前后端契约 | 场景追溯与状态表审阅 |
| AC-03 | 设计语言有可执行 token/排版/密度/组件/动效/响应式/可访问性规则，默认值与已证实标准区分 | 文档检查；示例配色对比度计算；官方标准核对 |
| AC-04 | 六资源用途、入口/条件/冲突、读取与安装区别、版本管理、Claude 执行包和客观验收齐备 | 主入口实查、模板演练/审阅；不运行上游安装 |
| AC-05 | 易读入口、详细规范、用法手册与验收文档互相可定位；状态无矛盾、无不存在的命令/路径或伪运行证据 | 链接校验、独立 review、问题闭环 |
| AC-06 | 上步未提交成果/六上游仓与既有业务组件保留；Constitution变更、SBS/INDEX/交接更新，真实 Git 状态记录 | status/diff/来源 SHA；最终证据 |

## 合同影响与非目标

文档约定未来界面行为及执行要求，不改数据库、接口实现、业务数据、身份配置或实际组件。业务首期范围、最终配色/主题和框架采纳保留明确状态；无需等待这些决定才能完成规范。没有部署、采集、付费调用、技能全局安装或通知外发。

## 风险、回退与验证资源

主要风险是把个人技能里的风格偏好、简化性能结论或移动端习惯当通用强制规则；通过来源/取舍矩阵与真实浏览器验收要求解决。文档可以按本步 diff 单独回退，不覆盖上步未提交内容。用 PowerShell/Python 和 Git 做静态/链接/对比度检查，浏览官方资料；无页面实现，实际 UI/性能运行验证不适用本步，明确写为未来门禁。

## 实施与验收

READY计划已先保存后执行。Emil的25份Markdown（15项技能）与LICENSE已全文阅读并保留哈希；另外五库按任务范围研究。已编写4份Constitution前端文档、Claude执行模板、3份来源研究并同步相关入口；默认配色76组实色对比度检查通过。独立审查发现的文字间距、自动更新、可访问认证覆盖项已补齐复核，AC-01至05 PASS；主代理完成治理/Git范围核对与AC-06，状态ACCEPTED，见 [统一验收](evidence/SBS-0006/acceptance.md) 和 [独立审查](evidence/SBS-0006/review.md)。实际页面、工具安装和运行测试未执行。根上步未提交成果继续保留，本轮也未提交/推送。
