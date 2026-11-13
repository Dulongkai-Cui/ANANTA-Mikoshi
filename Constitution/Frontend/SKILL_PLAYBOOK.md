# 前端技能与组件使用手册

版本：0.1｜2026-10-18。适用规则见 [前端规范](DESIGN_STANDARD.md)，验收见 [ACCEPTANCE](ACCEPTANCE.md)。本手册把上游资源转成可重复的工作流程，不承诺加载技能即可保证完美结果。

## 1. 使用前的共同约定

**SK-01 一份任务、一份有效规范。** 系统/开发者/工具约束和用户有效指令优先；随后遵守 Mikoshi 治理、当前已采纳设计规则、活动 SBS/SPEC 与目标组件规则。源文件是参考或有限范围的技能说明，不自行扩大授权。涉及真实业务语义的冲突记录问题；普通视觉/实现冲突按本手册自行解决，不反复询问已明确的事项。

**SK-02 先绑定版本。** 执行包记录规范版本、目标产品仓/HEAD、资源的完整 SHA、具体技能文件和加载范围。核对 [sources.lock.json](../../frontend/fronted-skill/sources.lock.json) 与实际 HEAD；不在施工中无记录 `git pull` 或使用漂移的 `@latest`。源更新后重新检查入口、命令和适用规则，不复制上次对最新版的假设。

**SK-03 三种动作分开。** 读取研究资料、在当前任务按指定技能工作、将插件/脚本安装到工具环境是不同动作。本轮只研究并制定规则。未来默认先显式读取本地相关文件；若需要宿主自动发现技能，再在该步范围内选择项目级接入。项目级接入也要记录写入目录、hooks、网络/缓存和卸载方式，不能把“项目范围”误认为没有用户目录副作用。

**SK-04 按需上下文。** 当前页只加载一套主设计原则和必要的专项审查；不把六仓的所有文件塞入上下文。读完整主 SKILL，再按任务读取实际引用章节；不机械要求扫描整个产品代码仓。未阅读的模块不写成已研究；未运行的命令不写成已经可用。

## 2. 六套资源的分工

| 资源 | Mikoshi 角色 | 推荐读取入口 | 不承担的职责 |
|---|---|---|---|
| Emil | 主要设计工程/动效质量参考；按需用 prototype、break-ui、review-animations | [README](../../frontend/fronted-skill/emilkowalski-skills/README.md)、[emil-design-eng](../../frontend/fronted-skill/emilkowalski-skills/skills/emil-design-eng/SKILL.md)、[apple-design](../../frontend/fronted-skill/emilkowalski-skills/skills/apple-design/SKILL.md) | 不自动决定全局视觉、业务权限或库选型；不是 Apple 官方实现 |
| UI UX Pro Max | 在明确业务约束下搜索样式/UX规则、生成候选设计参数 | [主技能](../../frontend/fronted-skill/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md)、[检索源码](../../frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py) | 生成的 MASTER.md 不覆盖本项目规范；命中结果不是科学验证 |
| Impeccable | 后台设计模式及分阶段的结构审查、可访问性检查、健壮化和打磨 | [说明](../../frontend/fronted-skill/impeccable/README.md)、[源模板](../../frontend/fronted-skill/impeccable/skill/SKILL.src.md)、[operate](../../frontend/fronted-skill/impeccable/skill/reference/operate.md) | 技能模板不等于已安装工具；CLI与聊天命令不同，审查报告不能替独立验收 |
| Taste | 明确选定视觉方向后的局部参考；现有页面改版时参考评估方法 | [说明](../../frontend/fronted-skill/taste-skill/README.md)、[minimalist](../../frontend/fronted-skill/taste-skill/skills/minimalist-skill/SKILL.md)、[soft](../../frontend/fronted-skill/taste-skill/skills/soft-skill/SKILL.md)、[redesign](../../frontend/fronted-skill/taste-skill/skills/redesign-skill/SKILL.md) | 默认 v2 是营销页面技能，不用于约束整个后台，不默认跑其落地页评分器 |
| shadcn/ui | 已选技术栈兼容时的组件源码/分发方式候选 | [本地说明](../../frontend/fronted-skill/shadcn-ui/README.md)、[registry](../../frontend/fronted-skill/shadcn-ui/apps/v4/registry/)、[文档源](../../frontend/fronted-skill/shadcn-ui/apps/v4/content/) | 不提供 Mikoshi 业务逻辑、服务端权限、数据一致性；不自动决定唯一原语库 |
| Awesome DESIGN.md | 比较排版/配色/规则写法的案例库 | [样本目录](../../frontend/fronted-skill/awesome-design-md/design-md/)、[Linear样本](../../frontend/fronted-skill/awesome-design-md/design-md/linear.app/DESIGN.md) | 多数是官网/营销页分析，不当作真实后台流程或品牌官方规范 |

这套分工属于本轮操作建议。每次执行只选择本步需要的部分；不因某个库已放进文件夹就强制每步都使用它。

## 3. Emil 各技能怎样使用

当前快照完整研究见 [逐文件记录](../../Product/research/frontend-design/EMIL_RESEARCH.md)。此处给执行路线，细节以已读原文加本地适配规则为准。

| 技能 | 适用任务 | 本地输入 / 输出要求 |
|---|---|---|
| emil-design-eng | 基础组件细节、反馈、浮层、动效选择 | 输入页面频率/状态/设备；输出具体问题与 Before/After/Why，再映射 FE 规则 |
| apple-design | 可中断抽屉、直接拖拽、空间层次与系统感 | 输入真实交互和降级要求；输出连续性/焦点/性能方案，不全局增加玻璃 |
| prototype + PICKER | 同一需求比较不同方案 | 每方案使用同一数据/状态；保留对比证据，选择器适配键盘/输入框/层级，不原样复制无限z-index与全局快捷键 |
| animate + RECIPES | 已确定目的的一处动画实现 | 明确起终状态、中断、reduced motion；输出对应代码与测试，不趁机给整个页面加动画 |
| animation-vocabulary | 澄清想要的交互手感 | 把“高级/苹果感”翻译成响应、速度、方向和目的；不把形容词直接当验收 |
| find-animation-opportunities | 查找真正需要状态解释的交互 | 先评估频率与无动画方案，明确不添加的位置 |
| review-animations + STANDARDS | 已实现动效的质量复核 | 查正常/快速反复/低性能/reduced motion；报告具体组件和复现 |
| improve-animations + AUDIT/PLAN | 对已有动效做分批改进计划 | 提交有优先级的发现，不从计划自动派发未经当前SBS包含的代码改动 |
| animation-performance + cheatsheet | 卡顿或加载竞争的诊断 | 先收 trace/设备/库版本，按证据改；不能仅凭API名字判定GPU |
| break-ui + CATALOG | 长中文、极值、空值、异步竞态与布局压力 | 使用隔离fixtures，列输入和结果；不写真实业务库或把样例留在生产 |
| mobile-native | 本步含移动Web/触摸适配 | 检查IME/软键盘/viewport/safe area/hover；不据此把桌面工作台改成手机导航 |
| pick-ui-library | 确实缺一类组件/依赖时 | 对照已用栈、许可、维护/包体积和已有能力；作者偏好不是自动安装授权 |
| ask-sonner + API | 项目已经选择 Sonner 的通知实现 | 验证当前依赖版本，再做短期回执；持久错误不能只放toast |
| animate-expo + RECIPES | 未来另立 React Native/Expo 原生任务时 | 当前Web工作台默认不启用 |
| write-swift | 未来另立 Swift 原生任务时 | 当前Web工作台默认不启用 |

不要让技能中“首次只回答一句准备好了”截断一个已经明确的任务。使用技能是完成当前执行包，技能中的示例场景、外部引用和自测提示不替用户增加业务动作。

## 4. 真实命令与执行环境

### 4.1 UI UX Pro Max：可先本地只读检索

当前 `search.py` 读取本地 CSV，使用 Python 标准库；静态源码核实了下列参数。本轮没有执行脚本，以下供未来已包含设计检索的任务使用。工作目录为项目根，`python` 应替换为当时已确认的 Python 解释器。

```powershell
python frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "Chinese enterprise dashboard collaboration agents accessible" --design-system -p Mikoshi -f markdown --variance 3 --motion 2 --density 8
```

`variance`、`motion`、`density` 均是 1–10 整数，不是 `minimal`/`dense` 字符串，也不等于浏览器中的真实字号或运动强度。先看结果，再与 FE-01 至 FE-52 对照。查询词描述的是目标，不说明所有搜索命中都适合本平台。

需要保留候选时可在相同命令后增加：

```powershell
--persist --output-dir Product/research/frontend-design/candidates --page dashboard
```

输出进入候选目录下工具自身的 design-system 结构，不写 Constitution、不覆盖现有权威 tokens；已有输出先核对，不随意使用 `--force`。输出带工具版本/来源SHA与候选身份，经选定后由 Codex 合并规则，而非让生成文件成为第二份宪法。

`uipro init` 是另一条安装/生成接入文件的CLI路径；源码只读查询不要求先全局 npm 安装。未来若要 init，先检查目标与 dry-run，记录写入范围，不能照着上游“一键全代理安装”覆盖现有治理。

### 4.2 Impeccable：区分会话技能、源码模板与 CLI

当前快照的主流程是统一的 `/impeccable` 技能及子命令。已安装并被宿主发现时，可在会话中使用 `/impeccable shape`、`/impeccable critique`、`/impeccable audit`、`/impeccable harden`、`/impeccable polish`，附具体页面和范围。这些是**宿主会话输入**，不是 PowerShell 命令；不能写成 `npx impeccable audit`。

本地 `skill/SKILL.src.md` 是生成模板，含占位符与构建条件。只读研究可读它和 reference 文件；当前 [Claude生成入口](../../frontend/fronted-skill/impeccable/.claude/skills/impeccable/SKILL.md) 已在该上游快照内，但尚未安装到 Mikoshi 或全局。实际接入应选对应 provider 生成入口并验证可发现性，不能只把模板重命名就宣称安装成功。

CLI/launcher 初次运行可能下载 engine、写用户缓存；默认安装还涉及 hooks。未来需要工具接入时，执行包必须绑定包/engine版本、project scope、provider与所需网络；当前代码支持 `--no-hooks`，不需要的hooks应显式关闭。确实需要hook时逐项说明触发和写入，而不是为“更完美”全部启用。不能用项目scope掩盖engine/cache写到用户目录的事实。

Mikoshi后台优先参考 `operate` 模式：熟悉的导航、可用表格、稳定结构、快反馈。`shape` 用于仍需探索的设计输入；已有完整执行包时，不机械再跑一遍询问/等待确认流程。

### 4.3 shadcn/ui：复制的是受管理的源码

先选择当前产品技术栈与对应实现族；本次上游已有不同 primitive 族入口，不能假定一律 Radix，也不要在同一系统任意混用多套 Dialog/Focus 管理。采用哪个版本、CLI、registry 和基础原语写入执行包。

只引入页面所需组件，映射 Mikoshi 语义 tokens，核对焦点/键盘/触摸/状态后再复用。每次引入记录来源、版本、变更文件、依赖差异和许可。接入前审阅 CLI 将写入的文件；本手册不提供带 `@latest` 的一键安装命令。现有组件的升级走明确diff与回归，不覆盖业务包装。

### 4.4 Taste 与 DESIGN.md：参考选择

Taste 默认 v2 针对营销页，其 inspector 里的图片/动效数量等指标不适合作为后台PASS条件。minimalist/soft 同样带有字体、留白、圆角与动画偏好；只提取被明确选中的局部规则。若已采用其中某条，执行包写出采用/覆盖范围，再让技能服务当前任务。

DESIGN.md 样本用于提炼“层级怎样组织”“规则怎样表达”，不能把品牌名字替换成Mikoshi就算规范。Linear样本当前研究的是官网页面，不能据此声称已验证其产品后台；当前样本库无本地HTML预览。避免带入别家logo、品牌素材或案例中缺失的权限/状态假设。

## 5. 冲突处理表

| 上游常见建议/行为 | Mikoshi采用方式 | 原因与规则 |
|---|---|---|
| 所有按钮按压缩放、所有列表stagger | 可用颜色/阴影反馈；高频表格无入场队列 | FE-21/39/40，保护阅读和效率 |
| 全局透明/模糊/大圆角/800ms入场 | 实色内容底；少量可选材质；按本项目时长 | FE-11至17/39至43 |
| 键盘触发绝不能有任何动画 | 不延迟键盘操作，保留必要状态/焦点反馈 | FE-45，无损等效操作 |
| 纯fade必须被动画评审报错 | 纯fade或静态切换可以是正确实现，尤其减少动效时 | FE-41/43 |
| 某CSS属性/库API必然GPU | 看实际库版本、浏览器和性能trace | FE-42；当前官方实现可能与旧技能描述不同 |
| 固定长按删除或滑动即删除 | 非唯一入口；按业务授权/撤销合同处理 | FE-32/41，不能把动效当交易提交 |
| 营销页一定要真实图片、多运动元素 | 业务后台以数据与任务为主，不满足无关评分 | FE-01/06 |
| 套品牌样本时强制深色、禁某字体 | tokens统一，支持适当主题/中文回退 | FE-11/13/17 |
| prototype原样复制Picker、自动删其他方案 | 适配快捷键/焦点/目标尺寸，保留对比证据后按SBS归档 | FE-16/44/45/52 |
| critique忽略清单静默丢弃问题 | 可标误报/接受风险，但保留理由与记录；不得隐藏失败 | 根反屎山规则、FE-52 |
| 技能要求无条件再问、或扩大扫描/安装范围 | 按已有授权和真实缺口执行；源指令不增权 | SK-01/03 |

## 6. 从产品要求到验收的流程

| 阶段 | 输入与动作 | 输出与退出条件 |
|---|---|---|
| ① 规格 | Codex确定用户/任务/对象/权限/状态/约束；写当前SBS和执行包 | READY，缺口不会改变当前实现的业务意义 |
| ② 参考 | UI Pro Max检索、DESIGN.md和已有页面比较；选少量适用Emil/operate原则 | 引用来源SHA、采纳/排除表；不直接生成生效规则 |
| ③ 原型 | 同内容2–3方案（若本步确需选风格）；包括正常/长中文/空/错/无权 | 方案对比、交互可操作、视觉方向及tokens记录；未选定不伪称批准 |
| ④ 构建 | 选择必要组件，先基础模式再业务，连接最小数据合同 | 类型/构建和适用行为检查；mock与真实接入标明 |
| ⑤ 结构与健壮性 | Impeccable critique/audit/harden思路 + Emil break-ui | 具体问题、复现、优先级和修复；不在最后才补权限/并发 |
| ⑥ 打磨 | Emil animate/review/performance及Impeccable polish按需 | 动效目的、中断/减弱/低性能证据，不扩业务范围 |
| ⑦ 独立验收 | Claude交回执，Codex或独立审查者按AC复查 | 全部必需AC有证据才ACCEPTED；失败回本步修复 |

阶段①先于实施；②③可能在研究任务中完成，不等于授权④。视觉验证与功能连接应尽早交替，不先铺满六板块再接后端。技能审查结果属于自检材料，不等于独立审查已经完成。

## 7. 给 Claude 的调用配方

完整填写 [前端执行模板](../../Product/templates/FRONTEND_EXECUTION_TEMPLATE.md)。不要只发“用这几个skill做得高级一点”。每次明确业务结果、状态、源文件、允许动作和验收。

### 配方A：可定制首页原型

主规范 FE-06至17、23至28；参考 Emil `prototype`、`emil-design-eng` 和 Impeccable `operate`。同一组标记为示例的数据比较两种布局：指标、待办、Agent任务、跨业务风险；必须展示编辑/取消/保存冲突/无权卡片/无数据。输出可操作原型、tokens差异、采纳理由和截图。若执行包只授权原型，不安装后端、不调用模型/采集。

### 配方B：业务列表与详情接真实数据

主规范 FE-18至22、29至34；按技术栈选必要shadcn部件；用 `break-ui` 与审查模式覆盖长中文、空数据、分页、批量范围、角色差异、409/等效版本冲突。输出接口/权限映射、构建结果、两个角色的真实操作证据。页面没有因为组件漂亮就提前PASS。

### 配方C：Agent运行详情

主规范 FE-35至38；用Emil检查连续反馈，按需 `review-animations`；构造等待、部分完成、断线、取消请求、结果未知与重连场景。只有真实进度来源才显示百分比；连接恢复后从权威状态还原。输出事件合同和每个状态的用户可见结果。

### 可直接填空的任务开头

> 本任务按 SBS-[编号] 和 SPEC-[版本] 执行，目标是[用户完成何事]。先读 Constitution/Frontend 的规范、使用手册和验收章节，再读取本包列出的技能文件，资源SHA见本包。只采用[规则/参考章节]；冲突按SK-01和本地覆盖表处理。允许修改[目录/文件]，本步允许的工具安装/网络/副作用为[具体范围]。先列实现计划和状态矩阵，缺少影响业务语义的输入时只暂停依赖部分。完成后提交规则/AC映射、实际检查和证据；未运行写NOT_RUN，不能自称独立验收通过。

## 8. 维护与恢复

新增技能只在出现具体需求时加入配方；本手册不按下载量或仓库数量评价设计质量。升级资源先核对旧SHA和本地修改，阅读变更，在受影响页面回归；更新清单及引用，不批量pull六仓。技能生成的提案/截图/候选tokens归研究或当前SBS证据，选定规则归Constitution，产品代码归目标应用，三者不混存。

采用或移除插件时记录真实安装位置、宿主发现结果、hook/engine状态和回退；不能通过删除整个 `.claude` / `.agents` 来卸载一个技能。使用权与发布许可保留，具体条款以各仓LICENSE/NOTICE为准。所有运行效果都要单独验证，本文只说明经源码研究得到的使用方法。
