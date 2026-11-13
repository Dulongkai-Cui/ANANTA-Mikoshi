# Emil Kowalski skills 完整研究与 Mikoshi 适配

研究日期：2026-10-18。所属步骤：[SBS-0006](../../../SBS/SBS-0006-frontend-design-standard.md)。本文是来源研究和采纳建议；执行权威由 Constitution 前端规范及当前执行包确定。

## 结论

它确实包含 Apple 风格设计方法，尤其是及时反馈、连续手势、可中断的弹簧运动、空间关系和层次。仓库整体是 Emil Kowalski 的设计工程经验及专项技能集合，README 将经验来源描述为 Vercel、Linear 等工作经历。它不是 Apple 官方发布的设计系统，也不是一套拿来就能覆盖 Mikoshi 六板块的业务组件库。

`apple-design` 是作者对 Apple WWDC 内容的整理和 Web 转译，主入口 `emil-design-eng` 更偏组件细节、动效选择与性能意识。Mikoshi 可以借鉴这种细致、克制、响应明确的交互质量；不能据此认定用户已经批准全站苹果外观、大面积玻璃、移动端布局或某个框架。

本研究实际全文读取 **25 个 Markdown，其中 15 个 SKILL.md**，另读取 LICENSE 和三个根配置文件。初次枚举的“26?”预估已经按真实文件清单纠正。长文件分段读取，工具输出出现截断的段落重新单独读取；没有把文件哈希或关键词扫描当成全文阅读。逐文件清单及 SHA-256 见文末。

## 来源与验证边界

- 上游：[emilkowalski/skills](https://github.com/emilkowalski/skills)。本地：[资源目录](../../../frontend/fronted-skill/emilkowalski-skills/)；[README](../../../frontend/fronted-skill/emilkowalski-skills/README.md)。
- 完整锁定提交：`2d228630ba1446365f614a108cb8252f1feda202`；以现有本地快照阅读，没有拉取更新。
- 读取前子仓 `git status --short` 为空。仓内没有额外 AGENTS.md。根仓 `main` / `5d888802504073bfa1f52f000848c6c18baabba4`，根有 SBS-0005 和本步未提交文档，不改变它们。
- [LICENSE](../../../frontend/fronted-skill/emilkowalski-skills/LICENSE) 为 MIT，Copyright (c) 2026 Emil Kowalski。复用实质内容时保留许可及版权声明；本文为归纳分析，没有复制整份技能。
- 本次未安装技能/依赖，没有运行示例，没有执行“Initial Response”“写代码”“删除原型”“创建 plans”等来源指令。没有验证示例代码在某个实际运行版本中可用。
- Swift、Expo、Sonner 的版本/API 表已完整阅读，但当前未选择这些技术用于 Mikoshi，本次不背书其中每个版本敏感的技术断言；日后采纳时须对照已锁定依赖和官方文档验证。

## Apple 关系的直接证据

[apple-design/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/apple-design/SKILL.md) 开头说明从 Apple WWDC 设计讲座提炼并转译到 Web，重点引用 2018 年 Designing Fluid Interfaces；内部还包含材料、字体、可访问性和 2026 设计原则。

本次独立核实的 Apple 官方来源：

1. [WWDC18 — Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/)：官方主题是 iPhone X 的流畅手势界面，涵盖快速响应、连续反馈、可改变方向与中断的运动、交互原型。它支持技能的核心思路，不能证明作者全部 CSS、Motion API 或固定数字都是 Apple 的 Web 规定。
2. [WWDC26 — Principles of great design](https://developer.apple.com/videos/play/wwdc2026/250/)：官方确有 Purpose、Agency、Responsibility、Familiarity、Flexibility、Simplicity、Craft、Delight 八个章节。个人控制、恢复错误、清晰命名、适配不同情境这些原则与可定制工作台契合。

因此“类似苹果的感觉”可以作为探索方向：反应明确、行为连贯、层次清楚；最终品牌、主题、信息密度和视觉样张仍需单独选定。

## 全部 15 个技能的使用路由

| 技能与完整入口 | Mikoshi 何时使用 | 必须一起读取 | 何时不适用/限制 |
| --- | --- | --- | --- |
| [emil-design-eng](../../../frontend/fronted-skill/emilkowalski-skills/skills/emil-design-eng/SKILL.md) | 组件实现前理解细节原则；评审按钮、弹层、反馈与交互一致性 | 本地设计 token、当前组件规范 | 不能替代业务规则、权限和整体信息架构；下文冲突表优先适配 |
| [apple-design](../../../frontend/fronted-skill/emilkowalski-skills/skills/apple-design/SKILL.md) | 首页卡片拖动、抽屉、可中断手势、层次和排版探索 | 本地动效/可访问性/品牌规则 | 不强制玻璃、不照搬 macOS 关闭位置、不把物理参数直接移植到其他库 |
| [animate](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate/SKILL.md) | 已批准场景确有必要增加 Web 动效时逐个实现 | [RECIPES](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate/RECIPES.md) 对应章节 | 研究阶段不写业务代码；不为淡入装依赖；不能把所有状态变化动画化 |
| [review-animations](../../../frontend/fronted-skill/emilkowalski-skills/skills/review-animations/SKILL.md) | 对具体动效 diff 做独立审查 | [STANDARDS](../../../frontend/fronted-skill/emilkowalski-skills/skills/review-animations/STANDARDS.md)、本地例外表、浏览器证据 | 专项审查不能代表页面、权限或全系统通过；原规则的绝对禁令需适配 |
| [improve-animations](../../../frontend/fronted-skill/emilkowalski-skills/skills/improve-animations/SKILL.md) | 已有较多界面后做动效盘点并生成有优先级的修复建议 | [AUDIT](../../../frontend/fronted-skill/emilkowalski-skills/skills/improve-animations/AUDIT.md)、[PLAN-TEMPLATE](../../../frontend/fronted-skill/emilkowalski-skills/skills/improve-animations/PLAN-TEMPLATE.md) | 默认只读审计；上游 `execute <plan>` 是工作流变体，不是仓内可保证存在的 CLI 命令；不得绕过 SBS 执行门禁 |
| [find-animation-opportunities](../../../frontend/fronted-skill/emilkowalski-skills/skills/find-animation-opportunities/SKILL.md) | 已存在可用界面，寻找少数能解释状态/空间关系的动效 | 当前操作频率、业务关键性与本地 token | 输出建议即可；没有适合动效的位置是有效结果，不凑够 5～7 项 |
| [animation-performance](../../../frontend/fronted-skill/emilkowalski-skills/skills/animation-performance/SKILL.md) | 卡片拖动、列表滚动、切换导航出现实际卡顿时定位 | [performance-cheatsheet](../../../frontend/fronted-skill/emilkowalski-skills/performance-cheatsheet.md)、真实 Performance trace | “改成 transform”本身不是性能通过；先证实原因、设备和依赖版本 |
| [animation-vocabulary](../../../frontend/fronted-skill/emilkowalski-skills/skills/animation-vocabulary/SKILL.md) | 用户描述动效时建立中文/英文共同术语 | 需要命名的具体示例 | 只是沟通词表；不因能命名就认定应该做；原文“必须逐字引用”不妨碍本地中文解释 |
| [prototype](../../../frontend/fronted-skill/emilkowalski-skills/skills/prototype/SKILL.md) | 用户授权风格/交互探索后，同一组件构建约 3 个有实质差异的方案 | [PICKER](../../../frontend/fronted-skill/emilkowalski-skills/skills/prototype/PICKER.md) 以及本地原型验收 | 上游是单组件探索，不能替代全平台 IA；选中方案才进入批准范围；不自动删除比较证据 |
| [break-ui](../../../frontend/fronted-skill/emilkowalski-skills/skills/break-ui/SKILL.md) | 每类页面/组件完成后，用真实上限、异常数据和容器宽度检验 | [CATALOG](../../../frontend/fronted-skill/emilkowalski-skills/skills/break-ui/CATALOG.md)、字段与接口合同 | dev fixture 必须隔离；不得写入真实业务数据；文字截断/金额口径等语义按执行包决定 |
| [pick-ui-library](../../../frontend/fronted-skill/emilkowalski-skills/skills/pick-ui-library/SKILL.md) | 具体组件需求出现时评估已有依赖与候选库 | package.json/锁文件、组件选型决定 | 作者候选表不等于全量安装；不因偏好替换既有依赖；分页也不是应一律替代的“hack” |
| [ask-sonner](../../../frontend/fronted-skill/emilkowalski-skills/skills/ask-sonner/SKILL.md) | 已采用 Sonner 时统一 toast 封装、去重、主题和故障定位 | [API](../../../frontend/fronted-skill/emilkowalski-skills/skills/ask-sonner/API.md)、锁定包类型 | toast 不能成为 Agent 任务结果或关键错误的唯一记录；promise resolve 不代表业务执行成功 |
| [mobile-native](../../../frontend/fronted-skill/emilkowalski-skills/skills/mobile-native/SKILL.md) | 已批准移动 Web 支持时处理触控、软键盘、安全区和视口 | 目标浏览器/设备矩阵、本地响应式规则 | 不把全局禁止选择、滚动、浏览器高亮当默认；保留缩放和内容复制；无真机只能记未验证 |
| [animate-expo](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate-expo/SKILL.md) | 将来确立 React Native/Expo 客户端后处理 worklet、手势、导航与触觉反馈 | [RECIPES](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate-expo/RECIPES.md)、实际 SDK 与发布构建 | 当前 Web 规范不加载；pt/dp、RN UI runtime、Expo 路由不能混成 Web CSS 标准 |
| [write-swift](../../../frontend/fronted-skill/emilkowalski-skills/skills/write-swift/SKILL.md) | 将来确立 Swift 原生端后阅读值类型、隔离、并发、性能与测试指导 | 真实 Swift/Xcode toolchain、对应官方语言资料 | 当前 Mikoshi Web 前端不适用；文中标记未发布特性不能因出现于 skill 就直接落地 |

## 可吸收的原则

1. 每个动效先说明用途与操作频率；日常读表、筛选、切换记录和命令输入应立即可操作。
2. 组件要提供即时且清楚的反馈，空间上与触发源相符；用户改变意图时能够中断、取消或恢复。
3. 优先已有组件和统一 token，简单过渡先选 CSS；确有手势/布局需求才评估额外库。
4. `transition` 明确属性；在实际性能问题中避免逐帧 React 重渲染，评估继承变量失效范围、绘制面积与多元素并发；仅在测量支持时局部使用 `will-change`。
5. reduced motion 从第一版配套，hover 只作增强；保留键盘、触摸和辅助技术可操作路径。
6. 方案在可交互原型中比较；评审既看正常流程，也看中文长标签、金额、时间、空集合、失败、权限拒绝和真实规模。
7. 代码审查、浏览器实测、设备实测分开记录；静态推断不能充当流畅性、可访问性或运行成功证据。

## 必须改写或限制的来源规则

下表是研究建议，供 Constitution 的本地适配条款采纳。不要回写上游文件，也不要让 skill 的措辞悄悄改变本地规则。

| 来源规则/问题 | Mikoshi 适配 | 原因与验证 |
| --- | --- | --- |
| 主技能、animate、review 将所有键盘触发动画列为禁止 | 高频焦点/导航立即生效；必要且短暂的空间/状态提示可按场景保留，不让动画阻塞下一次输入 | 键盘是输入方式，不能抹去键盘用户必要反馈；检查重复输入、焦点可见和 reduced motion |
| 主技能要求所有 pressable 缩放至约 0.97 | 保证 active 反馈；可选择颜色、边框、阴影；密集表格、复选框、工具栏不默认缩放内容 | 防止文字/数字抖动、命中目标变小和视觉疲劳；具体缩放为可调整默认值 |
| GPU-only/所有 CSS 或 WAAPI 都自动硬件加速；Motion x/y/scale 绝不加速 | 优先 transform/opacity，按实际库版本、属性与浏览器 trace 判断；不要机械替换所有 shorthand | [Motion 官方 performance](https://motion.dev/docs/performance) 当前说明独立 transforms 可以加速，同时强调浏览器仍可拒绝加速，不能普遍保证 |
| `animation-performance` 说 padding 与 scale 外观相同且 scale 无缺点 | 按布局目的选择。真实尺寸、文档流、文字清晰度、命中区域和可访问性先满足，必要布局动画局部且测量 | transform 不重新排布邻接元素，会缩放文字，不能通用替代尺寸变更 |
| apple-design 回避所有 gesture-driven CSS transition；主技能又推荐 transition 可中断 | 确定性状态切换可用 transition；需要持续速度衔接的手势选择支持该能力的库，实测反向与取消 | 不把“CSS 完全不可中断”写成事实，关心连续性与操作结果 |
| 原表存在“全部 UI <300ms”与 drawer 500ms、toast 400ms 的冲突 | 统一由本地 motion token 与组件规范给默认时长；延长须有场景理由和验证 | 本地规则不能同时强制两组矛盾数值；长时后台任务的真实等待不等于动画时长 |
| Apple damping ratio 1.0、response 与 Motion `damping`/`duration`近似混用 | 每种库参数分开建适配；比例与物理阻尼系数不能直接互填，毫秒/秒和 px/s 要明确 | 参数名称相似不代表同一量纲；不得把示例公式当无需测试的统一物理引擎 |
| `Math.abs(distance)/elapsedMs > 0.11` 便 dismiss | 使用具体组件已验证的手势算法；同时检查方向、最近速度、距离、取消、滚动冲突和设备 | 起止总平均速度会丢失最后反向信息；不让甩动误触删除或丢失编辑 |
| 长按两秒作为删除/确认范式 | 普通可撤销变更提供撤销；不可逆动作明确对象、影响和确认；长按只能是辅助方式并提供等价键盘操作 | 长按难发现，也不能替代服务端权限、幂等或审批 |
| review-animations 把纯 fade 视为需报错，其他章节推荐 reduced-motion fade | 静态变化或纯淡入均可成为合适解法；reduced motion 不被审查器误判 | 不强制加入 scale 来“通过”技能评审 |
| 多处要求组入口加入 stagger | 高频业务列表、仪表盘实时数据、虚拟列表默认不逐项入场；罕见引导才考虑且总时长有上限 | 不能让第 100 行等待累计延时，或滚动回收时反复闪现 |
| apple-design 要求导航/工具栏/抽屉使用透明材料 | 业务阅读面优先稳定可读表面；材料是可选品牌方案，覆盖最差背景、低性能和减少透明度/高对比路径 | 大面积模糊会增加绘制成本并影响文字对比，不将装饰升级成通用质量标准 |
| blur<20px、固定 easing、tracking -0.02em 直接成为硬规则 | 数值是作者经验/示例；按面积、设备、语言与本地 token 校准，中文不套用英文字距规则 | 19px blur 也可能昂贵，单个数值不能代替测量或中文排版验收 |
| prototype 要求 picker 逐字照抄，选中后删除原型 | 可借鉴同尺寸逐个切换；本地键盘/焦点/对比度/命中区优先；归档已选/未选截图和决定后按 SBS 处理原型 | picker 含 28px 按钮、极高 z-index、全局左右/数字/R 热键和 width 动画；避免干扰表格编辑、组合输入与浮层 |
| 原型/压力测试默认某些阶段停下来等人选；improve-animations 默认写 plans/ | 依已有用户授权和当前 SBS 决定动作；建议留在 Product 研究或当前执行包，不另开平行编号计划体系 | 用户授权不被低层 skill 重置；也不能据 skill 自动扩展实施范围 |
| ask-sonner 的 promise 状态与 headless 推荐 | 单一封装/主题/去重；任务完成以服务端业务结果为准，关键错误和 Agent 任务在页面中持续可查 | toast 只提供辅助反馈；不得将 resolve、动画结束或 toast 自动消失视为业务完成 |
| mobile-native 全局移除 tap 高亮/overscroll 等基线 | 每条只在明确适用的容器与目标浏览器中采用；替代反馈先存在，文档滚动、复制和缩放保留 | 尊重上游“where why applies”的原则，不机械复制末尾 baseline |

## 为 Mikoshi 补齐的业务场景

这些来自本项目要求，不能声称 Emil 已提供完整方案。

- **首页看板**：编辑/查看明确分开；拖动和调整尺寸有非拖拽操作；个人布局、共享模板、保存失败/版本冲突/撤销各有行为；卡片隐藏不扩大数据权限。
- **六业务板块**：共用导航、筛选、表格、详情、审批和附件模式；业务术语与状态不被风格统一吞掉。
- **多人协作**：字段权限、无权限、会话过期、记录被别人改动、部分操作失败都要有明确可恢复状态。
- **长期 Agent**：排队、运行、等待输入/审批、重试、取消中、取消、失败、部分完成、结果未知和完成应按接口合同呈现。动画和 toast 不替代持久状态；有权限才提供重试/停止等动作。
- **数据真实**：金额/单位/时区/采样范围/更新时间明确；零、空、未知、失败区分；演示数据显式标记；指标不为动画平滑而生成不存在的中间业务事实。
- **中文和高密度**：CJK 长标题、混合字母数字、长账号/链接、极端金额、表头扩展、缩放后布局、数据行重用都是必测边界。

## 建议的实际调用顺序

1. 执行者先读本地 Constitution、有效 SBS、任务包、组件仓规则与已有 tokens；核对本技能锁定 SHA。
2. 只加载当前任务的一种主技能和必需附录。例如制作已批准的抽屉动效：`animate/SKILL.md` + `animate/RECIPES.md`；同一阶段不同时塞入全部 15 个技能。
3. 先记录本地覆盖条款；参考代码结合已锁定依赖 API 编写，不复制未验证接口，不擅自换组件基础库。
4. 在批准范围实施、自测。`break-ui` 用脱敏或合成 fixture；原型、对比控件、假服务和 worst-case 切换留在开发空间。
5. 独立验收者按本地标准阅读 `review-animations` 的相关部分；核对截图、运行录像、键盘与性能证据，输出具体问题和真实未测项。
6. 记录使用技能/附录/快照 SHA、改动文件、采用/覆盖规则和证据；审查通过范围不外推到整个产品。

## 逐文件全文阅读与哈希清单

清单包含 25 个 Markdown 与 LICENSE；所有行 `READ_FULL` 表示全文已阅读，不表示示例已执行。哈希绑定本地文件字节。三个附带配置 `.pl`（空文件）、`.gitignore`、`.gitattributes` 另作只读检查，不含技能正文。

| 文件 | 全文阅读 | SHA-256 |
| --- | --- | --- |
| [performance-cheatsheet.md](../../../frontend/fronted-skill/emilkowalski-skills/performance-cheatsheet.md) | READ_FULL | `b23a27f543f12eb05d0f7ca8ab83751b5528d2e41d29fa2fc05255bb34e9b0b5` |
| [README.md](../../../frontend/fronted-skill/emilkowalski-skills/README.md) | READ_FULL | `365de44b29552f363806724cca8de99d2adda5cc52062c855d0f7f7c00ad354d` |
| [skills/animate-expo/RECIPES.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate-expo/RECIPES.md) | READ_FULL | `c8ffbd6233744e045ec67b7f80b15a2b67303a23ad45c0b40d823ecc87c68d03` |
| [skills/animate-expo/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate-expo/SKILL.md) | READ_FULL | `7a3dd553e23e15959ce8b3ec8cd4c1605c0d2e576c3a484a13b989e0700a48dc` |
| [skills/animate/RECIPES.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate/RECIPES.md) | READ_FULL | `7b835d46748f13e05048ef1a7f3b49587a1b7fee4a72854c788992e184af9cf5` |
| [skills/animate/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/animate/SKILL.md) | READ_FULL | `6e7a0d28864bd9cb658913049df6944ce320a3646ac0e339ba8c7d99a9e764e5` |
| [skills/animation-performance/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/animation-performance/SKILL.md) | READ_FULL | `15220ebda30a5db60f14331769ef28b756f10924463791fb096d2f396a8d1571` |
| [skills/animation-vocabulary/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/animation-vocabulary/SKILL.md) | READ_FULL | `bd473dae686e85f6f82799aa7ef2aa11d357ddf3625de000fd8f28ea747562a4` |
| [skills/apple-design/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/apple-design/SKILL.md) | READ_FULL | `bcab965ec01d05101b817714f8ccaf68632d1697b822f65718e811119a77c049` |
| [skills/ask-sonner/API.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/ask-sonner/API.md) | READ_FULL | `5d85db5cbd0d4f3b0c68259e897b8d6d3c6518bdadaca0b0fb830176a44f4038` |
| [skills/ask-sonner/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/ask-sonner/SKILL.md) | READ_FULL | `bc59ef252d11095cb7722be0ed6c0b882dcd4ae06cd64b3842709a89ab868c1a` |
| [skills/break-ui/CATALOG.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/break-ui/CATALOG.md) | READ_FULL | `437fb3047e3e1f8620583744e5e48298764a5ce8cc762b647f056ba22d8aa23c` |
| [skills/break-ui/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/break-ui/SKILL.md) | READ_FULL | `c162e1a2f0ce720cc774b336089c7c4af01bb141bdca8dd7491b8727193ad11c` |
| [skills/emil-design-eng/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/emil-design-eng/SKILL.md) | READ_FULL | `a2ee9da0840c23b509a27e742edbc8f8fdb4416ca7d6ffde67d79023bfb8a5bf` |
| [skills/find-animation-opportunities/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/find-animation-opportunities/SKILL.md) | READ_FULL | `59646cf5cde38dd146334ae791501d335d049a57c436c0eb8b895b68db96fb70` |
| [skills/improve-animations/AUDIT.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/improve-animations/AUDIT.md) | READ_FULL | `4c7e350c639564b4e572c9f0e20bab2d427f5c9c469daa8aa9b7ac5275728ea1` |
| [skills/improve-animations/PLAN-TEMPLATE.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/improve-animations/PLAN-TEMPLATE.md) | READ_FULL | `886e54b73ac550749b434eebe928df7be0683684f5a66a1bf0cf8326e09fe50b` |
| [skills/improve-animations/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/improve-animations/SKILL.md) | READ_FULL | `4c57bd88188834434022b8ea0ea47f361963db5746198a7ce752eaef9ac221db` |
| [skills/mobile-native/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/mobile-native/SKILL.md) | READ_FULL | `0952ba031c849ba11dcefa4755f178457b9bca6a794e9bb6fc725aa1c1cc0dea` |
| [skills/pick-ui-library/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/pick-ui-library/SKILL.md) | READ_FULL | `6a3532136cf7f2a82dcfd8f7edd84787739749d8a9c1a8081534ee549d284de4` |
| [skills/prototype/PICKER.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/prototype/PICKER.md) | READ_FULL | `e04b8ceb7686888f05eefc301dc1197963cfa699189c95966e5a39b1f1cf6c24` |
| [skills/prototype/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/prototype/SKILL.md) | READ_FULL | `c7e70974979da914e45040a3ce31865fb94e7faef09c2cf188d19881a46eda42` |
| [skills/review-animations/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/review-animations/SKILL.md) | READ_FULL | `5b2a8f5986d19514abef830d178ead49f21d254fee137b45aa0ca7cad4f80efd` |
| [skills/review-animations/STANDARDS.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/review-animations/STANDARDS.md) | READ_FULL | `ca2b681e825638ea78cb8b6adc76234d849663cc3774eb2ad8d47181bad3098f` |
| [skills/write-swift/SKILL.md](../../../frontend/fronted-skill/emilkowalski-skills/skills/write-swift/SKILL.md) | READ_FULL | `7ff7bdc61fe95535b2be82af72e5e948599b72ccf189a6ac9038c6297bd934f5` |
| [LICENSE](../../../frontend/fronted-skill/emilkowalski-skills/LICENSE) | READ_FULL | `d24da413cccbc3d844929a1cc08e5ba79385139c0c47c9d5bd0dd2df24ffe15c` |
