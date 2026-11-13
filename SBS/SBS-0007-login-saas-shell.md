# SBS 0007 苹果质感登录页与 SaaS 前端骨架

状态：ACCEPTED（实现、自测与独立验收全部通过；仅本地演示前端骨架）
日期：2026-10-18
产品负责人/执行包编写：Codex
实现者：Claude初始实现；Codex按用户新授权接续
独立验收：未参与代码修改的指定独立审查者
前置：[SBS-0006](SBS-0006-frontend-design-standard.md)已ACCEPTED。

## 用户授权与目标

用户明确要求编写精准提示词交给Claude执行，先做登录页面和登录后的SaaS骨架；视觉明确选择“很像苹果、很高级的极简主义、快速看懂优先、务实”。Codex先交付执行包，Claude随后完成初始工程；用户因Claude账户限额明确授权Codex接续实现。实现完成后仍须未参与修改的独立审查者验收。

本步最终目标是能本地启动、可操作的登录与工作台前端骨架。后端身份、真实业务数据、服务器部署和付费Agent不纳入首个骨架；执行包必须明确演示模式与后续接口边界，不把假登录当安全认证。

## 基线

根仓 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi`，分支 `main`，HEAD `5d888802504073bfa1f52f000848c6c18baabba4`，暂存区为空。

SBS-0005/0006的文档、导航、前端资源清单与证据尚未提交，均须保留。六个上游来源仓在`frontend/fronted-skill`，固定SHA见sources.lock.json，不作为业务实现目录。立项时`frontend`无应用；Claude初始工程与Codex接续均位于`frontend/mikoshi-web`。OpenBP实际主仓在`OpenBP/OpenBP`，仅作只读技术基线调查，不能为新骨架覆盖旧业务。

适用根AGENTS、Constitution/Frontend、当前交接与[SPEC v1.0](../Product/handoffs/SBS-0007/SPEC.md)。目标为根仓下`frontend/mikoshi-web/`独立应用，React/TypeScript/Next App Router/Tailwind，两个虚构演示身份。详细路由、编辑合同、技能配方与边界已在SPEC明确；前端规范v0.2记录用户已选方向，tokens沿用v0.1。

## 实施计划

1. Codex保存本计划，核对现有工程/技术边界，形成具体SPEC和可直接复制的Claude提示词。
2. 记录用户已选的苹果质感方向，落实为版式/材质/排版/动效规则；与当前Constitution的质量底线相容。
3. 给定登录、AppShell、首页初步定制、六业务入口与必要通用交互；定义本地演示数据与会话边界、未来adapter合同。
4. 明确每阶段需要读取/实际采用的skills、修改范围、依赖安装及本地运行授权、交付证据和验收。
5. 独立审查执行包，满足准入后将本步置READY；准备度通过不等于本步实现ACCEPTED。
6. Claude接手后核对基线、更新IN_PROGRESS，按SPEC实现、自测、保留截图与交互证据，交回VERIFYING。
7. Codex按实际产物独立验收；全部必需实现AC通过才ACCEPTED，不在提示词交付时提前通过。

## 实现验收（具体操作以SPEC第10节为准）

| AC | 实现结果 | 证据 |
|---|---|---|
| AC-01 | 工程在独立目标目录可安装、启动、构建，未破坏既有组件或参考仓 | 包/锁文件、命令、diff |
| AC-02 | 登录正常/错误/加载、演示会话、路由进入/退出正确；无真实认证声明 | 浏览器操作、状态测试 |
| AC-03 | AppShell、首页、六业务入口有真实路由与统一设计语言 | 页面/导航操作及截图 |
| AC-04 | 首页本地可编辑、保存/取消/重置/失败处理正确 | 浏览器刷新与状态测试 |
| AC-05 | 搜索/个人设置/主题等已展示控件有明确行为，数据与副作用边界真实 | 操作与网络证据 |
| AC-06 | 苹果质感、中文易读、响应式/键盘/减少动效符合本步视觉与质量要求 | 目标视口/主题截图、键盘与动效检查 |
| AC-07 | 关键异常、数据隔离、刷新/深链接/未保存改动覆盖 | 适用自动测试与人工复核 |
| AC-08 | 技能采用/覆盖记录、源码来源、实现回执与Git边界齐备 | 实际交付记录 |

## 当前范围与回退

最初Codex只修改执行包、治理/产品决定和导航；用户后来授权Codex接续Claude限额中断任务，可按SPEC第2节修改新应用、执行记录及状态。源仓和旧业务保留；不部署、不调用真实账号、模型、爬虫或发消息。新应用可独立回退；治理文档只回退本步diff，不覆盖前两步未提交资料。

## 当前记录

执行包与[可复制提示词](../Product/handoffs/SBS-0007/CLAUDE_PROMPT.md)曾经[独立准入审查](evidence/SBS-0007/readiness.md)PASS进入READY；该历史准备度不代替实现验收。现有应用与实际测试见[实现回执](../Product/handoffs/SBS-0007/DELIVERY.md)，原始失败、修复和复验见[独立报告](evidence/SBS-0007/implementation/independent-review.md)。后端认证/真实业务/部署等不适用项及原因仍按SPEC。

执行包阶段文档检查见[历史验证记录](evidence/SBS-0007/verification.json)。根HEAD保持`5d88880`，暂存区为空，未commit/push；现状见[Git记录](evidence/SBS-0007/implementation/git-final.json)。前两步成果与原组件继续保留。状态按顶部执行；实现自测齐备才VERIFYING，独立验收全部必要AC通过才ACCEPTED。

2026-10-18最终验收：[独立报告](evidence/SBS-0007/implementation/independent-review.md)对AC-01～08全部判定PASS，R-01～13全部关闭；独立重算81份应用文件SHA一致。完整流程37项、修复后8项定向、正式未配置模式12项、106项单元测试通过；25张视觉截图与最后设置页5状态定向复验通过。阶段按READY→IN_PROGRESS→VERIFYING→ACCEPTED完成。技术验收不代替用户的视觉意见，不启动下一份SBS或真实业务接入。
