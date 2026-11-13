# 前端组件、设计参考与可访问性标准研究

日期：2026-10-18。归属：SBS-0006。研究者：标准研究子代理。本文是来源与适配证据，生效要求以 Constitution/Frontend 为准；本次未安装依赖、运行上游命令、修改上游、制作业务页面或声明 WCAG 合规。

## 1. 基线与阅读范围

已读根 Constitution 入口、架构原则、反屎山规则，SBS 流程、索引及 SBS-0006 全文，Product BRIEF/CURRENT，以及 Mikoshi 提案 v0.2 的首页、六板块、身份、动作与 Agent 相关段落。提案的精确状态机、API、持久化方案仍是 PROPOSED；本文提取应覆盖的界面问题，不把候选技术变成已批准架构。

根仓：`main`，HEAD `5d888802504073bfa1f52f000848c6c18baabba4`。开始时有 SBS-0005 的未提交文件及主代理正在写的 SBS-0006，未覆盖或暂存。以下两仓 Git HEAD 与 [sources.lock.json](../../../frontend/fronted-skill/sources.lock.json) 一致，阅读时 `git status --short` 均为空。

| 资源 | 固定提交 | 本次读取入口/范围 |
|---|---|---|
| shadcn/ui | `d2fba50ee5b9113008b5bb908563527b7efd2f27` | README；`apps/v4/content/docs/(root)/index.mdx` 与 `theming.mdx`；`dark-mode/index.mdx` 的框架入口与 `vite.mdx` 的 provider；`components/radix/data-table.mdx` 的介绍、分页/排序/筛选/选择导航；`sidebar.mdx` 的结构、受控状态、快捷键；`field.mdx` 的 validation/accessibility；`forms/react-hook-form.mdx` 的表单结构、客户端验证与错误；`chart.mdx` 的 accessibility；`skills/shadcn/rules/forms.md` 与 `base-vs-radix.md` 的相关接口差异；核对 base/aria 表格文档入口存在。非整个 6,404 文件源码审计。 |
| awesome-design-md | `3b605329240ce735b510037cca322f1831fdd7f8` | README 的用途、格式、许可与免责声明；`design-md/linear.app/{README,DESIGN}.md` 的配色/排版/结构/组件/限制；`design-md/apple/{README,DESIGN}.md` 的营销界面模式、交互约束与 Known Gaps。没有逐个审查其余品牌。 |

本地入口：[shadcn 文档源](../../../frontend/fronted-skill/shadcn-ui/apps/v4/content/docs/%28root%29/index.mdx)、[主题](../../../frontend/fronted-skill/shadcn-ui/apps/v4/content/docs/%28root%29/theming.mdx)、[Linear 样本](../../../frontend/fronted-skill/awesome-design-md/design-md/linear.app/DESIGN.md)、[Apple 样本](../../../frontend/fronted-skill/awesome-design-md/design-md/apple/DESIGN.md)。括号路径经过 URL 编码，直接文件路径仍为 `(root)`。

## 2. shadcn/ui 可用边界

**定位：可获取、修改、组合的组件源码与分发体系，帮助项目建立自己的组件库。** 不是一次安装就获得权限、业务工作流、后端、多端同步或可访问性认证。上游介绍见 [Introduction](https://ui.shadcn.com/docs)，固定内容以本地快照为准。

| 主题 | 本地证据 | Mikoshi 可采用内容 | 实施时必须补的内容 |
|---|---|---|---|
| 语义主题 | `theming.mdx` 使用 background/foreground、primary/primary-foreground、muted、ring、sidebar、chart 等语义变量；明暗覆盖同一组名称 | 用统一语义 token 控制整个应用，不为六板块分别复制硬编码颜色 | 校验真实前景/背景组合；错误、告警、成功、待核实、模拟等产品语义另行定义；主题切换不改变状态含义 |
| 基础控件 | `components/{base,radix,aria}` 均存在；`base-vs-radix.md` 说明 render/asChild 等差异 | 在技术选型后选一组适配基础；保留已有稳定组件优先 | 锁定 registry/base/依赖版本，禁止混用不同体系 API；引入时保存来源和局部修改记录 |
| 表单 | `Field`、`FieldLabel`、`FieldDescription`、`FieldError`；`data-invalid` 负责样式，`aria-invalid` 负责状态 | 标签、帮助、错误放在统一位置；相关字段分组 | 服务端校验、权限变化、字段级错误关联、冲突差异、未保存草稿恢复；客户端 Zod 示例不代替业务校验 |
| 表格 | Data Table 明确是一份使用 Table/TanStack Table 构造具体表格的指南，当前快照注明 v9 | 公共列头、排序、分页、筛选、列显隐、行选择交互可以抽取 | 服务端分页/排序语义、全量选择与本页选择、导出权限、批量部分失败、远程变更、真实数据规模；不引入“万能表格”承载所有业务规则 |
| 导航 | SidebarProvider 支持受控 open/onOpenChange、移动宽度、折叠、触发器 | 一个应用外壳，六业务一致的一级导航、页面级操作和上下文切换 | 菜单权限由后台校验；折叠保留可访问名称；上游 Ctrl/Cmd+B 示例需避开编辑器/浏览器冲突，不能直接照搬为全局快捷键 |
| 图表 | chart 文档提供 `accessibilityLayer` 键盘与读屏入口 | 配色、图例、tooltip、键盘支持可作为组件起点 | 指标说明、真实/模拟标识、单位/窗口/来源、文本摘要与表格替代；不能仅因打开该 prop 就声明图表完整可访问 |
| 暗色/系统主题 | 暗色文档为不同框架提供路径，Vite 示例展示 light/dark/system 与 localStorage | 用户显式选择和系统偏好是主题功能候选 | 当前方案若要多端持久化需后端；SSR 闪烁、系统偏好运行时变化、存储不可用及高对比模式需要实测；不锁定 Vite/Next.js |

许可：本地 `LICENSE.md` 为 MIT。采用部分源码须保留适用许可/版权通知；组件的第三方依赖另核对，不把源码库 README 当全部依赖许可。上游命令（例如 `npx shadcn@latest ...`）在本次仅作来源阅读，未执行；未来执行包应固定可复现版本，先检查目标工程兼容性和生成差异。

## 3. DESIGN.md 样本的真实含义

awesome-design-md 是第三方对公开网站视觉的提取分析，不能称为被分析品牌官方设计系统。其 README 自述提取公开 CSS、按现状提供，未声称拥有品牌视觉身份。仓库 MIT 也不自动许可品牌 Logo、专有字体、摄影和产品截图。

### Linear 样本

样本明确写出 **marketing canvas**，来源为首页、`/intake`、`/pricing`、`/contact/sales`、`/build`。80px 展示标题、96px 章节间距、产品截图和 CTA 是营销结构。Known Gaps 明确说未覆盖表单验证错误、浅色主题，并指出实际产品还有更丰富的优先级/标签颜色。

- 可参考：语义化前景/背景成对定义、少量强调色、层级表面、间距与圆角阶梯、统一组件状态的表达方式。
- 不继承：禁止浅色、每节必须产品截图、80px 标题和96px章节空白、仅一种语义颜色、专有字体、半透明焦点圈的未验证数值。业务后台要有错误/警告/成功等语义，中文数据密度另验。
- 不执行其 `npx @google/design.md lint DESIGN.md` 示例；它是来源中的操作建议，不是项目授权或已安装工具。

### Apple 样本

描述 Apple 官网商品、商店与环境页，包括商品图片、全宽 tile、购买 CTA、磨砂子导航。Known Gaps 明确没有表单验证/错误和完整暗色业务卡片。它与 Apple 官方 HIG、macOS 应用布局、Emil 的设计工程技能不是同一个东西。

- 可参考：内容与操作的层次、谨慎的表面透明度、重复组件规则、一致按压反馈的思路。
- 不继承：所有按钮 `scale(.95)`、所有 CTA 胶囊形、所有正文17px、不用500字重、“Never document hover”、专有 SF 字体打包、商品官网的页幅和照片。这些都是特定样本判断，不能覆盖 Web 业务系统的完整状态和性能验收。
- 玻璃效果若进入 Mikoshi 原型，要求不透明回退、可读性/对比度和滚动性能验证；“像苹果”不能替代验收。

## 4. Web 标准、Apple 指导与项目默认值的区分

查阅日期：2026-10-18。W3C 成功准则属于标准；Understanding 是解释资料，APG 是实现指导；Apple HIG/WWDC 是其平台设计指导。以下是应被设计规范覆盖的规则摘记，不是完整 WCAG 2.2 审计表，也不是已通过认证。32/40/44px 控件、字体字号、动画毫秒、断点和最大宽度均应标成 Mikoshi 默认值，除非明确引用对应标准。

| 主题/级别 | 可操作规则 | 依据与验收方法 |
|---|---|---|
| 文本对比度 / 1.4.3 AA | 常规正文至少4.5:1；大字至少3:1。大字通常为18pt或14pt粗体（约24 CSS px或18.67 CSS px粗体），中文须考察等效字体实际大小。占位符和辅助文本也受约束；禁用、纯装饰、标志有特定例外，不能用低对比“弱化”仍需阅读的信息 | [SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。按真实合成背景计算，不四舍五入通过；明暗主题分别查状态 |
| 非文本对比度 / 1.4.11 AA | 识别控件/状态所必需的视觉信息与邻接色至少3:1，必要图形也适用；纯装饰边界无需一律3:1 | [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)。重点检查输入边界、选中/错误/焦点和图表必要线条；不要把所有细分割线误判为必需控件边界 |
| 颜色语义 / 1.4.1 A | 成功、失败、模拟、过期、待审批不能仅用红绿或色点；配可读文字、图标/形状或图案 | [SC 1.4.1](https://www.w3.org/WAI/WCAG22/quickref/#use-of-color)。去色后仍能判断状态 |
| 指针目标 / 2.5.8 AA | 目标至少24×24 CSS px；有间距、等价控件、行内、浏览器默认、必要呈现等例外。间距例外按目标中心24px直径圆及邻近目标的规则判断，不是简单写“间隔24px” | [SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)。直接测实际可点区域。Mikoshi 可默认触控44×44 CSS px、桌面32px以上，这是项目取舍；44×44属于WCAG增强规则的数字，不是AA普遍门槛 |
| 缩放 / 1.4.4 AA | 文本放大到200%不丢内容和功能（字幕、文字图像有范围例外）；不要禁用用户缩放 | [SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)。检查按钮、表单错误和长中文名称，不以仅截图缩放代替实际浏览器测试 |
| 重排 / 1.4.10 AA | 纵向内容在320 CSS px等效宽度仍能使用，通常1280宽视口400%缩放；除确需二维布局的部分，不需横竖同时滚动 | [SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)。数据表/地图可局部二维滚动；页面标题、筛选/表单不能跟着整页横向溢出，表格单元格仍须考虑文字重排 |
| 文字间距 / 1.4.12 AA | 用户覆盖行高1.5倍、段后2倍字号、字距0.12em、词距0.16em时不丢内容/功能；不适用某文字系统的属性有例外 | [SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)。这是覆盖后的适应要求，不规定默认页面必须采用全部这些值 |
| 键盘 / 2.1.1 A、2.1.2 A | 所有适用功能可键盘完成，无无法退出的键盘陷阱；Tab焦点顺序与语义顺序一致 | [APG Keyboard](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)、[WCAG Quickref](https://www.w3.org/WAI/WCAG22/quickref/#keyboard)。使用原生button/link/label，复合控件按对应APG模式；不在输入/中文输入法组合过程中劫持快捷键 |
| 可见焦点 / 2.4.7 AA、2.4.11 AA | 键盘焦点可见；获得焦点的组件不能被作者内容完全遮住。项目可要求整体可见，比2.4.11最低要求严格 | [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)。检查固定工具条、底栏、抽屉、toast遮挡；若用2px焦点圈，应标为项目默认或对应AAA要求的具体实现，不能说AA规定固定2px |
| 拖动 / 2.5.7 AA | 卡片移动、缩放、排序必须有单指针点击/轻触可完成的替代；键盘等价是另一项独立要求，仅加方向键不够 | [SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)。看板可提供“移动到位置”“上移/下移”“尺寸选择”按钮，支持鼠标点击/触屏/键盘三种路径 |
| 模态 / APG 指导 | 打开后将焦点放入；Tab/Shift+Tab在模态内循环；Esc关闭，提供可见关闭入口；关闭后回原触发点或逻辑后继；背景 inert，正确名称/角色 | [APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)。长内容可初始聚焦标题；重大不可逆动作可先聚焦较安全的选择；未保存退出需要明确处理，不悄悄丢稿 |
| 状态消息 / 4.1.3 AA | 已保存、搜索结果、失败、排队等状态可被辅助技术识别而不抢焦点 | [SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)。普通结果用适当status/live region；紧急错误慎用alert；Agent流式输出聚合为有意义的状态更新，不逐token轰炸读屏 |
| 减少动效 / 2.3.3 AAA + 项目规则 | 非必要交互动画可关闭。项目应尊重`prefers-reduced-motion`；取消大幅移动、缩放/弹簧、视差和持续装饰，保留等价文字/静态状态 | [SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)。明确这是AAA对应能力被项目主动采纳，不伪称所有reduce-motion条款都属于AA |
| 自动更新 / 2.2.2 A | 自动开始且与其他内容并行的持续移动/闪烁/滚动（>5秒）需暂停/停止/隐藏机制，必要情况例外；自动更新内容另需可控制暂停/停止/隐藏或更新频率 | [SC 2.2.2](https://www.w3.org/WAI/WCAG22/quickref/#pause-stop-hide)。长期监控看板勿无控制跳动；暂停视觉更新不能伪装成停止后端任务 |
| 登录 / 3.3.8 AA | 登录不依赖无辅助的记忆/抄写/解谜测试；可使用辅助机制或等价认证方式 | [SC 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)。允许密码管理器、粘贴和适当自动填充；会话过期后保护已输入内容，并安全恢复上下文 |

Apple 官方可借鉴的是目的性、即时反馈与适应偏好，而不是固定某种视觉皮肤：[HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion) 建议动画支持用户任务、频繁动作保持简短、尽可能可打断；[WWDC20 Make your app visually accessible](https://developer.apple.com/videos/play/wwdc2020/10020/) 演示在Reduce Motion下替换大动作并响应设置变化；[WWDC18 Deliver an Exceptional Accessibility Experience](https://developer.apple.com/videos/play/wwdc2018/230/) 讨论缩放、旋转、视差、周边运动的替代。将这些原则映射到Web的CSS/JS媒体查询是本项目适配判断，不是照搬Swift API。

[HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) 的控件尺寸分平台且使用pt，当前指导还区分默认/最小值；不能把“苹果44pt”直接换算成网页所有控件的强制最小CSS px。默认空间、交互密度和触屏尺寸仍由Mikoshi使用场景验证。

## 5. Mikoshi 必须覆盖的复杂场景

下表来自 [总体提案](../../../Constitution/Proposals/2026-10-18-MIKOSHI/DESIGN_PROPOSAL.md) 的问题与用户已提出的方向。表内行为是规范应表达的需求，不表示对应后端已存在；字段名、HTTP状态码、具体路由由后续执行SPEC定稿。

| 场景 | 规范/执行包必须写清 | 可验收的失败例子 |
|---|---|---|
| 个人可定制首页 | 浏览/编辑模式；添加/删除卡片、尺寸、排序、过滤、多看板、默认首页；保存中/已保存/失败；取消与模板恢复；服务器跨设备保存；单卡筛选覆盖全局筛选时有标记 | 重登丢配置；拖拽是唯一编辑方法；保存失败仍显示已保存；编辑布局改写业务事实 |
| 团队版看板 | 个人与团队范围、拥有者/编辑者、版本；并发保存冲突提供比较、合并或另存；模板升级不覆盖个人定制 | A保存悄悄抹掉B版本；布局共享让用户读到作者全部数据 |
| 数据权限 | 列表、卡片、详情、搜索提示、导出、缓存和分享按查看者授权；撤权即时清理不该继续可见的内容 | 隐藏按钮但URL仍返回数据；卡片标题/筛选候选泄漏无权对象 |
| 数据真实性 | 真实、计划、估算、人工备注、AI推断、模拟、未接入分开；指标单位、统计窗、时区、来源采样时间/页面刷新时间区分 | 无数据显示0；过期结果看起来实时；刷新卡片自动启动爬虫/付费模型 |
| 三方号 | 账号/运营周期/业务线；稿件版本、审批、排期、提交发布、外部确认、回收指标、整改分别有状态 | AI起草或HTTP202后直接显示已发布；同一账号无授权地二次发布 |
| KOL | 达人实体与合作单分开；报价/锁档/交付/真实效果/结算分别显示口径 | 推荐分当真人影响力；付款金额、报价、消耗混在一个“费用”数字 |
| 联动管理 | 权益适用范围/期限、素材版本与授权、监修意见、履约里程碑 | 旧素材审核通过覆盖新版；版权已撤仍可提交任务；不显示适用时间 |
| 创意管理 | 草案、比较、采纳/暂缓/淘汰、母版与渠道衍生版本、模拟与真人验证证据 | 创意草稿自动变生产任务；渠道改稿覆盖母版；模拟偏好直接晋升产品事实 |
| VPC虚拟社区 | 常驻虚拟标识；社区模式/冻结实验模式；样本、画像、模型、条件版本；虚拟玩家和执行工作Agent分开 | 虚拟活跃人数显示为真实玩家规模；实验中改样本仍称可比；玩家获得员工权限 |
| 整体业务中台 | 跨域节点、负责人、依赖、费用分摊、汇总与来源下钻；各域事实归原业务 | 同一成本各板块相加重复计入；总盘编辑产生另一份最终状态 |
| 长期工作Agent | 居民身份/岗位与当前模型、Run/尝试、实时状态分开；排队、运行、等待人审/外部、失败、对账、取消请求、已取消等可辨认；最后更新时间/断线/过期；浏览器关闭不终止任务 | “呼吸”动效冒充运行证据；取消请求立即显示取消完成；换模型等于换身份；持续烧token才能显示在线 |
| 人审与副作用 | 展示冻结目标、内容/版本、费用上限、授权期限和结果；变更载荷需重新审；提交后结果未知给核查路径 | 审批后Agent换账号/内容仍执行；超时按钮叫“再来一次”造成重复发布；批准一个模糊意图就扩大权限 |
| 多人在线/长会话 | 编辑期远程更新、版本冲突、撤权、会话过期、网络断开、重新连接与重复请求 | 自动刷新冲掉输入；断网误报成功；重连重复提交；缓存展示前一登录人的内容 |
| 大数据与批量 | 服务端分页/排序/查询合同；本页/全部筛选结果选择范围；批量进度与单项失败；搜索请求乱序处理 | “选全部”只处理当前页却显示全量成功；旧搜索响应覆盖新查询；导出越权 |

## 6. 给主规范的具体建议

1. 原型阶段至少同屏验证：一个高密度业务表格、一张可编辑首页、一份Agent任务详情。它们共享同套token、外壳、焦点/错误/权限规则；仅营销页漂亮不能通过。
2. 执行包附“状态×输入×权限×数据来源”矩阵，覆盖正常、加载、空、部分、失败、过期、无权、冲突和未知结果。缺少后端时只可标示为fixture/mock原型，绝不退回随机成功数据。
3. 设计规范写体验合同，不凭视觉资源仓决定React框架、Base/Radix/Aria、表格引擎、动效库、持久层或权限方案。先检查现有实现与版本，再明确采用/适配/暂缓。
4. 视觉默认值可以继续迭代；数据真实性、权限与版本、一致状态、可访问输入、减少动效、可恢复编辑不应因换皮而失效。
5. 自动检查适合发现部分对比度/标签/结构问题，不能代替键盘、屏幕阅读器、真实数据、触摸、网络失败和并发验收。文档研究没有运行页面，所有浏览器功能/性能证据留给实施SBS。

## 7. 本次验证边界

仅本文件新增。两份上游HEAD、干净状态和根仓状态已读取；上游资源未改动，示例命令未执行。没有实际页面，未验证主题对比度、浏览器行为、WCAG整体符合性、真实并发/权限/Agent能力。以上链接为官方/固定本地来源入口，网页内容可更新，后续工具升级应重新核查来源版本及适用范围。
