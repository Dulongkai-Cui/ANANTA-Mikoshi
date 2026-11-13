# 直接交给 Claude 的执行提示词

下方整段可直接复制。完整规格是[SPEC.md](SPEC.md)，当前步骤是[SBS-0007](../../../SBS/SBS-0007-login-saas-shell.md)。不要只执行摘要而跳过规格。

```text
你来负责 Mikoshi 第一版前端实现。项目根目录：D:\产品孵化器\OpenBP_ ANANTA Mikoshi。

先读根 AGENTS.md、CLAUDE.md、Constitution/README.md、SBS/README.md、SBS/INDEX.md、SBS/SBS-0007-login-saas-shell.md、Product/BRIEF.md、Product/handoffs/CURRENT.md，再完整阅读 Product/handoffs/SBS-0007/SPEC.md 和 Constitution/Frontend 的设计规范、技能手册及验收标准。确认 SBS-0007 为 READY，核对 Git 基线和现有未提交成果，保存执行计划后进入 IN_PROGRESS。用户已授权本步，无需重复询问已明确的风格和普通实现选择。

设计方向已定：Apple 生产力软件质感。参考 macOS 系统设置的清晰结构和精细控件，用银白/浅灰中性色、实色内容面、少量蓝色强调、准确的中文排版、统一的间距和短促自然的反馈。易读与务实是第一优先。登录页、侧栏、工作台、业务入口、设置及浮层必须像同一套经过认真打磨的产品。不要把苹果感等同于满屏玻璃、巨大留白或装饰动画，也不要只交默认组件拼装。

在 frontend/mikoshi-web 新建 React + TypeScript + Next.js App Router + Tailwind 应用，由根仓管理，不改旧 OpenBP。核实兼容版本并锁定依赖；按需使用同一原语体系的 shadcn/ui。语义 tokens、基础组件、Shell、业务配置、合同与 demo adapter 分开维护。

完成 /login 登录页，以及 /dashboard 可编辑首页、/third-party 三方号、/kol KOL、/collaborations 联动管理、/creative 创意管理、/vpc VPC虚拟社区、/business 整体业务中台、/settings 个人设置。首页优先，六业务页各有清楚职责、流程框架与未接入状态。做完整可运行骨架，暂不扩成六套业务CRUD。

登录采用明确标记的本地演示模式与两个虚构身份，完整实现校验、错误、pending、防重复、会话恢复、深链接回跳、退出和后退处理。密码不保存；正式身份未配置时不得悄悄变成演示登录。数据只用空态或持续标注的合成样例，不接旧账号、真实资料、模型或爬虫。

首页必须能添加/移除登记卡片、前后移动、选择宽度、保存、取消和恢复默认；按演示身份持久化，异常和冲突不丢草稿。点击/键盘操作齐全，本轮不要求自由拖拽。实现页面搜索、响应式侧栏、系统/浅/深主题、减少动效与个人设置；所有显示的按钮都有实际行为。

严格按 SPEC 第8节实际阅读并使用 frontend/fronted-skill 的资源：Emil apple-design + emil-design-eng 主导细节；Impeccable operate 主导后台结构；UI UX Pro Max 做定向问题检索；shadcn 提供必要组件；Taste minimalist 选用克制与层级规则；Awesome 的 Apple DESIGN.md 辅助视觉表达。收口使用 Emil break-ui/review-animations 和 Impeccable audit/harden/polish 的方法。项目规范优先，不自动安装全部技能或执行上游安装器。记录具体采用、代码落点和覆盖理由，不能只口头说“已使用”。

严格执行 SPEC 的 AC-01～08：真实运行构建、类型/lint、关键逻辑和浏览器测试；实际检查桌面/窄屏、浅深主题、键盘、减少动效、200%文字、中文长内容、存储失败与会话边界。截图和操作结果写入 SBS/evidence/SBS-0007/implementation。按 SPEC 交付 README、许可记录、技能采用记录和 Product/handoffs/SBS-0007/DELIVERY.md，给出本地启动命令、URL与真实测试结果。

仅修改本步允许范围，保留所有已有未提交成果；不部署、不自动commit/push、不改六个参考仓。范围内问题自行解决，不停在建议或半成品。确有阻塞记录具体原因并继续独立部分。完成后将 SBS 置 VERIFYING，交 Codex 独立验收；不要自称 ACCEPTED，不创建下一份 SBS。
```
