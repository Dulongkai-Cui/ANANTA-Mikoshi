# 前端资源研究：UI/UX Pro Max、Taste、Impeccable

日期：2026-10-18；步骤：[SBS-0006](../../../SBS/SBS-0006-frontend-design-standard.md)。本文是固定快照的来源研究和适配建议，不是已运行工具的回执，也不改变业务授权。三仓只读；本轮没有运行上游脚本、安装包、启动浏览器检查、创建技能链接或开启 hooks。

## 1. 固定版本与阅读范围

以下 HEAD 已逐仓用 Git 核对，三仓工作树均为空白状态；与 [sources.lock.json](../../../frontend/fronted-skill/sources.lock.json) 一致。

| 资源 | 本次完整提交 SHA | 类型 / 许可 | 核心判断 |
|---|---|---|---|
| [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/56ea9cf174ed86786187daa9de0e6247cb0747e4) | `56ea9cf174ed86786187daa9de0e6247cb0747e4` | 本地设计知识检索与候选方案生成；MIT | 适合作为研究助手，结果必须经产品语境筛选 |
| [taste-skill](https://github.com/leonxlnx/taste-skill/tree/f624f37a8c650b9cc550253104925efe4c8de246) | `f624f37a8c650b9cc550253104925efe4c8de246` | 多套视觉技能及营销页检查脚本；MIT | 主技能明确不面向后台；子技能也需要条款级取舍 |
| [impeccable](https://github.com/pbakaus/impeccable/tree/08d5b470495d242ca0470f4aeae1956c3a074f83) | `08d5b470495d242ca0470f4aeae1956c3a074f83` | 技能、设计检查与原生执行引擎；Apache-2.0，保留 NOTICE | Operate 模式与后台契合；读取、安装、执行引擎、hooks 必须分开 |

阅读记录按实际范围列出，未声称通读全部数据集、全部组件或全部测试：

| 仓库 | 完整阅读的主要入口 | 定向阅读 / 核对的补充路径 |
|---|---|---|
| UI/UX Pro Max | `.claude/skills/ui-ux-pro-max/SKILL.md`、`cli/README.md`、`cli/package.json`、`cli/src/index.ts` | `README.zh.md` 的概览、生成机制和目录；`src/ui-ux-pro-max/scripts/search.py` 参数与分支；`core.py` 导入、CSV 配置和数据路径；`cli/src/commands/init.ts` dry-run、legacy 和默认模板安装分支；技能 `references/quick-reference.md`、`references/pro-rules.md` 的规则及适用范围 |
| Taste | `README.md`、`skills/taste-skill/SKILL.md`、`skills/minimalist-skill/SKILL.md`、`skills/soft-skill/SKILL.md`、`skills/redesign-skill/SKILL.md` | `install.sh` 安装目标及链接机制；`skills/taste-skill/scripts/lint.mjs`、`inspect.mjs` 的参数、依赖、读写与扫描规则入口 |
| Impeccable | `AGENTS.md`、`skill/SKILL.src.md`、`package.json`、`skill/reference/operate.md` | `README.md` 安装与命令表；生成的 `.claude/skills/impeccable/SKILL.md`；`skill/reference/{shape,audit,critique,harden,hooks,polish}.md`；`docs/{CLI-CONTRACT,ENGINE}.md` 的运行约定；`cli/bin/cli.js`、`skill/scripts/impeccable.cmd`；`crates/cli/src/main.rs`、`crates/skills/src/commands.rs`、`crates/detect/src/cli.rs` 实际分派和参数；`ENGINE_VERSION` |

## 2. UI/UX Pro Max：按问题检索，不把生成器当规范权威

### 已核实的事实

- [技能入口](../../../frontend/fronted-skill/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md) 描述了产品、样式、配色、排版、图表、UX 和技术栈检索。`search.py` 使用本地 CSV 数据及 Python 标准库；检索入口本身不要求 npm 安装、模型 API key 或联网。
- `.claude/skills/...` 与 `src/ui-ux-pro-max/` 均有脚本和数据。研究直接使用固定源码目录即可，无需先把技能安装进 Claude 或 Codex。
- [实际参数](../../../frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py) 包含 `--domain`、`--stack`、`-n/--max-results`（1–20）、`--full`、`--json`、`--design-system`、`-p/--project-name`、`-f/--format`（ascii/markdown）、`--persist`、`--page`、`--output-dir`、`--force`；三个可选方向参数 `--variance`、`--motion`、`--density` 均为 1–10。
- `--motion` 会附加 GSAP 示例。获得示例不代表项目需要增加 GSAP 依赖。`--density` 调整建议间距，不能替代实际数据密度与可访问性验收。
- `--design-system` 聚合内容包含 landing 模式，后台查询也必须检查返回的产品分类和结构是否合适，不能把 hero / 证明 / CTA 自动搬进工作台。
- `--persist` 创建 `design-system/<project-slug>/MASTER.md` 以及可选页面文件。已有 MASTER 默认跳过，`--force` 会覆盖；有页面配置时页面文件的优先级是该工具内部规则，不是 Mikoshi 的规范优先级。
- [安装 CLI 源码](../../../frontend/fronted-skill/ui-ux-pro-max-skill/cli/src/index.ts) 版本来自 `cli/package.json`，当前为 2.5.0。`uipro init --ai claude --dry-run` 是真实存在的预览参数；`--global` 写用户目录，`--force` 替换已有文件。默认 init 用已安装包内的模板生成，`--offline` 当前是兼容参数。下载 release 的旧代码位于 legacy 分支，不能据此误称普通 init 总会拉最新 GitHub 数据。
- 安装 CLI 本身、`uipro versions`、`uipro update` 的网络和文件行为，与运行本地 Python 检索是不同动作。不要把“Python 检索无外部依赖”推广成“整库所有功能都离线”。

### Mikoshi 推荐用法

已固定平台风格后，按单一问题检索，例如表格排序、拖拽替代操作、指标图表、错误反馈、长中文标签。每次输入保持一个主要意图；有已确定技术栈再用 `--stack`，不借检索工具替项目选栈。

下面是未来可执行的本地检索示例，**本轮未运行**。从项目根目录执行，`python` 替换为已确认可用的 Python 3 路径：

```powershell
python "frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py" "dragging movements" --domain ux --json
python "frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py" "time series comparison" --domain chart -n 3 --full
python "frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py" "internal analytics dashboard" --design-system --variance 2 --motion 2 --density 8 -p "Mikoshi candidate" -f markdown
```

最后一个例子只用于探索阶段，数值是本研究的候选设置，不是用户已选视觉方案。默认不加 `--persist`；需要留档时放在当前 SBS 的研究/证据目录，明确标为候选，再经人工取舍进入 Constitution。不能生成第二套自称全局权威的 MASTER，并让 Claude 同时服从两套冲突规范。

未来若执行包明确需要保存候选，可用下面这条有写入的示例；三个方向参数都必须是整数 1–10，不能写 `dense` / `compact` / `subtle`：

```powershell
python "frontend/fronted-skill/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py" "internal analytics dashboard" --design-system --variance 2 --motion 2 --density 8 -p "Mikoshi candidate" -f markdown --persist --output-dir "D:\产品孵化器\OpenBP_ ANANTA Mikoshi\Product\research\frontend-design\candidates"
```

其输出位于指定目录的 `design-system/<project-slug>/MASTER.md` 下；再次执行前先读已有文件，默认不使用 `--force`。本轮没有创建此输出目录或运行命令。

推荐从 [quick-reference](../../../frontend/fronted-skill/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/references/quick-reference.md) 挑对应项。`pro-rules.md` 的交付清单明确偏 native/mobile；Web 后台不能照搬所有平台尺寸与 safe-area 条款。上游简表中的“零时长状态变化不允许”“禁止水平滚动”“所有正文 16px”等，需要回到具体语境：Mikoshi 的即时状态更新、受控表格横向滚动、桌面紧凑 UI 与触屏目标分别定义，不以一句通用建议否决已验证设计。

## 3. Taste：选择性参考，默认营销技能不进入后台主链

### 已核实的事实

[当前 README](../../../frontend/fronted-skill/taste-skill/README.md) 和 [主技能](../../../frontend/fronted-skill/taste-skill/skills/taste-skill/SKILL.md) 明确：默认 `design-taste-frontend` 是公开页面的艺术方向技能，不面向 dashboards / app screens。当前默认版本是 v2；旧 v1 与 v2-experimental 仍保留各自安装名。默认 v2 **没有**旧版三项 dials，不能继续用旧教程的 DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY 解释它。

| 入口 / 安装名 | 可借鉴部分 | 不直接采纳部分 |
|---|---|---|
| `skills/taste-skill/SKILL.md` / `design-taste-frontend` | 按真实内容做方向、先静态成立再增加动效、实际浏览器截图检查 | 主技能要求图片数量、运动元素数量、每区不同构图、超大字号与营销结构；不用于业务后台门禁 |
| [minimalist-skill](../../../frontend/fronted-skill/taste-skill/skills/minimalist-skill/SKILL.md) / `minimalist-ui` | 克制色彩、清楚层级、统一组件、等宽数字、reduced motion | 指定暖灰、强制 1px 边框、排除字体/图标库、超大留白、所有内容滚动入场；只能作为待选视觉方向 |
| [soft-skill](../../../frontend/fronted-skill/taste-skill/skills/soft-skill/SKILL.md) / `high-end-visual-design` | 圆角嵌套关系、按压反馈、有限的空间层次 | 随机选风格、每次不同布局、所有卡片双层结构、巨型圆角、浮动玻璃导航、800ms+ 入场、禁用普通回退，不适合后台默认约束 |
| [redesign-skill](../../../frontend/fronted-skill/taste-skill/skills/redesign-skill/SKILL.md) / `redesign-existing-projects` | 先扫描诊断、保留既有栈与功能、长文本/加载/空/错误/焦点/折叠侧栏检查 | 为了区别常见 UI 而换字体/图标、添加纹理和图片、随机业务数值/日期、全局平滑滚动、装饰性运动，需剔除 |

“Apple-esque / Linear-tier”直接出现在 **soft-skill** 的自我描述中；它是作者的视觉偏好，不能证明来自 Apple 官方，也不能说明其强制玻璃、大间距和弹簧就是 Apple 通用规范。用户询问 emil 是否像苹果，由独立 [Emil 研究](EMIL_RESEARCH.md) 核实，不把两个库混为一谈。

### 当前命令和运行边界

- README 中 `npx skills add https://github.com/Leonxlnx/taste-skill` 默认面向整个技能集；选择一个时使用 `--skill "minimalist-ui"` 等真实安装名。它通过外部 skills CLI 获取/写入技能，未经核实不宣称与本地固定 SHA 一致。
- `install.sh` 需要 Bash，默认把**全部**技能链接到用户级 `$HOME/.claude/skills`；`--codex` 指向 `$HOME/.codex/skills`，`--all-agents` 指向两处。它不是默认项目内安装，不能在 PowerShell 下当作原生命令照抄运行。
- 符号链接使后续 `git pull` 立即影响已启用行为，因此 Mikoshi 不能链接可随意更新的工作副本后再宣称“已固定版本”。
- 主技能脚本：`draw.mjs` 生成方向；`assets.mjs` 联网检索/下载图片并记录许可；`lint.mjs` 静态扫描；`inspect.mjs` 启动已安装 Chrome/Edge/Chromium 并写 `.taste-skill/inspect/`。默认完整流程需要 Node 22+ 和浏览器，README 标明图片检索需要网络；静态 lint 的回退最低版本另写为 Node 18+。
- 当前 `inspect.mjs` 真实支持 `<url|file.html>`、`--out DIR`、`--widths 1440,768,390`、`--allow rule,rule`、`--json`。本地 HTML 会通过临时 loopback HTTP 服务打开。这个脚本测的是该作者的营销风格门禁，不能因为它能截图就直接成为平台验收工具。

主技能强制至少四张图片、至少八个运动元素，禁 thin rules / pill navigation / 多种常见排版等。这些规则放到数据后台会制造错误激励。Mikoshi 不运行它来逼迫列表、表格或 Agent 日志“通过”。未来真的制作独立宣传页时，再在该页执行包里单独选用。

## 4. Impeccable：采用 Operate 方法，按能力层级启用

### 来源入口与版本差异

- [源码技能模板](../../../frontend/fronted-skill/impeccable/skill/SKILL.src.md) 含 `{{scripts_path}}` 等构建占位符，适合研究，不直接当已安装技能调用。
- Claude 的可读生成入口是 [`.claude/skills/impeccable/SKILL.md`](../../../frontend/fronted-skill/impeccable/.claude/skills/impeccable/SKILL.md)，其中 Operate 的生成资料是 [`.claude/skills/impeccable/reference/operate.md`](../../../frontend/fronted-skill/impeccable/.claude/skills/impeccable/reference/operate.md)；`plugin/skills/impeccable/SKILL.md` 和其他 harness 目录也是当前提交的生成分发件。
- 当前技能及 npm 包显示 4.6.0，`ENGINE_VERSION` 及 npm optional dependency 固定引擎为 0.1.15。二者独立记录；拿 npm 包版本代替 engine 版本会丢失执行证据。
- README 的 craft 描述仍写 shape-then-build，但当前 SKILL.src 把 `craft` 标为 deprecated alias。Mikoshi 新手册应直接用明确的规划、审查与精修命令，不建立 craft 主链。
- `docs/CLI-CONTRACT.md` 保留 3.6.0 / 旧 JS 实现的历史段落；例如旧段落写 CLI 无 live，但当前 Rust `main.rs` 已分派 `live*`。本研究以当前源码参数和具体 reference 为准，不整段复制旧合同。

### 对 Mikoshi 的适配

后台页面使用 [Operate 模式](../../../frontend/fronted-skill/impeccable/skill/reference/operate.md)，说明文档使用 Read。Operate 明确允许系统字体、标准顶部/侧边导航、面包屑、标签和密集表格；一致性与任务完成优先。建议采用的内容：

1. 固定 rem 层级与相对克制字号差，正文阅读宽度与数据表格宽度分开。
2. 语义状态齐全：hover / focus / active / disabled / loading / error / warning / success / selected。
3. 标准控件、侧栏和表格按用户已有经验组织，不为新奇重造滚动、表单或弹窗行为。
4. 浮层脱离会裁切它的滚动容器，处理焦点与层叠；空状态教用户下一步操作。
5. 多数过渡 150–250ms，动效解释状态；不编排整个工作台的入场动画。

“所有加载都必须 skeleton”等上游绝对措辞仍需按任务判断。表单按钮提交可以局部 pending；未知任务时长显示阶段而不假造百分比。`harden.md` 的通用 fluid clamp 与 Operate 的固定 rem 存在语境差异，后台默认以 Mikoshi 自己的排版规范为准。

### 会话命令与 CLI 不混用

| 用法 | 发生在哪里 | 说明 |
|---|---|---|
| `/impeccable shape <目标>` | 已安装并加载技能的 AI 会话 | 输出设计 brief；不写实现代码；已有需求先复用，不重复访谈 |
| `/impeccable audit <目标>` | AI 会话 | 技术审查与报告，不自动修复；不能替代完整 WCAG 合规评估 |
| `/impeccable critique <目标>` | AI 会话 | 设计判断与检测/浏览器证据分开；保持评审独立性 |
| `/impeccable harden <目标>` | AI 会话 | 长中文、边界数据、权限、错误、网络与并发等补强 |
| `/impeccable polish <目标>` | AI 会话 | 保持已定风格和行为，按缺陷优先级打磨 |
| `impeccable detect ...` | 已就绪的原生 CLI / launcher | 执行确定性检测；不是 LLM critique 的别名 |
| `impeccable context --target ...` | 原生 CLI / launcher | 读取工具识别的产品/设计上下文；不等于上层授权 |
| `impeccable install/link/update` | 安装 CLI | 写入或链接技能，有版本与作用域影响 |

`npx impeccable audit`、`npx impeccable shape` 不是当前技能命令的正确终端写法。当前 CLI 对 `init` 特别报错，引导使用会话里的 `/impeccable init`。独立 `/audit` 等短命令要经过 pin 创建，不能假设已有。

### 安装、下载、hooks 与检查

- 只读 Markdown 无需运行环境。当前源码收藏目录不是当前 Mikoshi 的技能安装目录；没有工具加载证明时，不声称 slash 命令可用。
- [Windows launcher](../../../frontend/fronted-skill/impeccable/skill/scripts/impeccable.cmd) 优先找显式二进制、随附二进制和版本缓存，缺失时可能联网下载到用户 `.impeccable` 缓存。启动一次 context 或 detect 也可能触发下载，不能视为纯文本读取。
- [npm shim](../../../frontend/fronted-skill/impeccable/cli/bin/cli.js) 也可能下载固定 engine，校验 SHA256 sidecar；包声明 Node >=18.19.0。直接已就绪 engine 不需要 Node；源码构建则是 Rust/Bun 等另一工作流。
- install 默认可以安装 provider hooks。当前 [Rust 安装参数](../../../frontend/fronted-skill/impeccable/crates/skills/src/commands.rs) **确有** `--providers=...`、`--scope=project|global`、`--no-hooks`、`--force`。未来采用自动安装时可在明确目标项目范围内先 `--providers=claude --scope=project --no-hooks`；本轮不执行。
- `link --source=<path> --providers=claude` 会连接编译分发目录，不能假设仓库中的 `dist/` 已存在；复制当前生成分发件时也要按实际 harness 入口操作并核对版本。不得用未经检查的整目录覆盖 `.claude` 或 `.codex`。
- 手动扫描可先于 hooks 评估。`detect --json <file-or-directory>` 是源码证据；`detect --json --viewport 390x844 <url>` 是浏览器扫描，需要可用 Chromium 系浏览器和可达服务。源码扫描通过不证明渲染、键盘路径或手势通过。
- `--scope type,layout` 只筛选部分规则，不是完整审查。退出 0 表示无 primary findings，仍可能有 advisory；1 是至少一个扫描目标未能完成；2 是存在 primary findings。完整记录退出码、目标、实际版本和配置。
- URL 扫描默认可能隐藏 consent / tour / preloader 等覆盖层；需要按真实首次进入状态验收时，当前存在 `--no-consent-hiding --no-overlay-hiding`，并以实际浏览器路径再核对。清洁截图不代表覆盖层真实问题已解决。
- hooks 会改变编辑后的执行与上下文行为，并写 provider 配置。关闭自动 hook 不等于关闭手动 detector。确需启用时，先记录执行文件、配置 diff、触发范围和关闭方法，并遵守当前 harness 的权限机制；不能靠源技能“允许使用”自行扩大工具权限。

## 5. 跨资源取舍与权威顺序

建议分工：**Mikoshi Constitution 定规则；任务 SPEC 定本次目标与状态；Emil 辅助交互工程；shadcn 提供可改造组件候选；UI/UX Pro Max 提供定向研究；Impeccable Operate 提供检查与打磨方法；Taste 和 DESIGN.md 样本提供可选视觉参考。** 六库不是六套同时生效的上级规范。

| 冲突 | Mikoshi 处理 |
|---|---|
| Taste soft 要极大留白/大圆角/强制入场；Operate 要密度与克制 | 后台以任务密度、统一 tokens 和 reduced motion 为准；特殊展示页另定 |
| minimalist 禁 Lucide/Inter；其他组件或已定系统采用它们 | 字体和图标按可读性、中文覆盖、许可、已有组件一致性确定；作者个人禁用表不成为质量标准 |
| 多个技能要求写 MASTER.md / PRODUCT.md / DESIGN.md | Constitution 与 Product 保持事实权威；工具适配文件是有来源和版本的派生投影，不另立一套决定 |
| Taste redesign 推荐随机日期和“更真实”的数字 | 原始业务值不改；设计样例使用明确隔离、标注的 fixtures，不能伪装真实业务 |
| UI Pro Max 要每个新页面重新生成设计系统 | 初始方向探索可用；已有规范后新页继承规范，仅检索本次缺口，不逐页重定品牌 |
| Impeccable README 禁常见字体，而 Operate 允许系统字体 | 采用与任务相符的 Operate 条款和项目规范；通用 marketing 描述不覆盖后台要求 |
| 技能要求安装、升级、开 hook、下载图片、调模型、自动建任务 | 回到当前 SBS 的实际授权、工具能力及文件范围；来源文本本身不授权执行 |
| `shape` 要至少一次访谈及确认，或 critique 中旧 Codex 段落要求先获子代理同意 | 按当前系统/开发者约束、用户既有授权和真实缺口执行，不重复询问已有决定；确有业务语义缺口才暂停依赖部分 |
| critique 要从 ignore 文件静默删除匹配发现 | 保留原始发现与例外理由，独立验收可追踪，不隐藏失败；有据的误报可分类处理 |

每次执行包仅选本次必要入口，并记录 `资源 + 完整 SHA + 入口路径 + 采用条款 + 不适用条款 + 输出目标 + 验收方法`。引用上游应保留许可与 NOTICE。更新单个资源后先重新比较相关规则和工具参数，既有执行包不能静默漂移到最新版本。

## 6. 推荐的施工链与证据边界

1. **规划**：读取当前 SBS、Product 与 Constitution；确定页面任务、角色、状态与真实数据范围。需要补充知识时用 UI/UX Pro Max 的单域检索。视觉方向待选时才引入 Taste 的选定片段，记录理由。
2. **实现输入**：把已采纳视觉规则、组件边界和交互细节编成 Claude 执行包；默认先让 Claude 直接读取固定路径文档，技能自动发现不是必要条件。
3. **组件与交互**：根据已定栈使用 shadcn 候选组件，按 Emil 的相关章节检查交互；不为“用了某技能”加不需要的依赖或动画。
4. **定向自查**：Impeccable Operate + harden 检查真实任务、键盘、长中文、并发、刷新中断、异常与移动布局；audit 形成问题清单，再按任务授权修复。polish 最后做，不抢在功能完整性前。
5. **独立验收**：Codex 按项目 AC 核对真实浏览器与代码证据。detector 结果和个人审美评分均为输入；用户选定风格、源码检查、浏览器截图、实际后端闭环分别标识，不互相冒充。

本研究已完成来源与参数静态核查。所有示例命令、安装流程、浏览器检测、自动 hooks、真实业务 UI 与性能指标在本轮均 **NOT_RUN**；后续按具体实施 SBS 验证，不能据本文宣称技能已经启用或“能保证完美”。
