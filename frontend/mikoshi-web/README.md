# 当前协作入口（2026-11-13）

**启动、真实身份服务和当前边界以 [根 README](../../README.md) 为准。** 下文是按日期保留的历史过程，包含已被后续功能替代的“未接入”或旧业务入口，不代表当前功能状态。

# Mikoshi 工作台

2026-11-07 当前范围由 SBS-0021 / DEC-029 覆盖：KOL侧栏12项直接显示，不折叠；工作室9页（撤下资料与数据，保留策划排期），合作进度，以及发布效果首页/全局透视。旧发布计划/日历/入库独立页已撤；合作资料和已建计划在合作进度同页管理。upstream原件、数据库、顶栏导出备份保留；三方号不变。下文十模块/旧四管理页是历史接入说明。

SBS-0015新增KOL入库、合作进度、发布计划和发布日历，按“达人→多项合作→具体排期”区分资料。七个KOL分析页与三方号一样从零展示，保留图表和筛选结构。47历史档案/65作品及完整原DATA已保全，见[KOL资料档案](../../Data/kol/README.md)。新资料按演示身份保存本机，不自动转为已发布数据；取消/撤下均保留恢复入口。当前实施与验收见[SBS-0015](../../SBS/SBS-0015-kol-workspace.md)。

SBS-0014在三方号初始化基础上恢复七个分析页的完整零数据展示：图标、筛选、指标、坐标/图例、分布与对比、账号/作品卡片及横表字段。没有记录时计数/合计为0，分母缺失的比率为“—”；占位不进入数据目录或本机仓储。默认empty生成策略、账号入库和计划/日历功能保持，清零前历史记录不会因补回界面而自动恢复。当前实施与验收见[SBS-0014](../../SBS/SBS-0014-third-party-zero-dashboard.md)。

前置SBS-0013将三方号恢复为无账号、作品和排期的初始工作区。历史85账号/374作品及浏览器原资料保存在[本地资料档案](../../Data/third-party/README.md)，默认生成不再回填历史；当时KOL保留快照，现由SBS-0015独立初始化。账号入库/计划/月历功能保留，新建资料写入独立新代次并可刷新恢复。取消计划保留记录；撤下计划从默认列表和日历隐藏，在“已撤下”筛选中可查并恢复。计划编辑窗口也有取消/撤下入口。撤下不涉及撤回外站内容。

以下SBS-0012为功能来源，其历史目录默认加载已被SBS-0013初始化策略替代。

SBS-0012最初增加三方号账号入库（`/third-party/accounts`）、发布计划（`/third-party/plans`）、发布日历（`/third-party/calendar`）。先入库或从当时的历史目录补充资料，再安排具体发布；计划表/月历同源，支持改期、取消/恢复。归属预置蘑菇/伏羲，历史账号当时也可直接排期。旧账号与作品有卡片/横表切换。保存仅在本机当前身份，不自动发布或生成实时效果。见[组件说明](src/features/third-party/README.md)及[历史验收](../../SBS/SBS-0012-third-party-publishing.md)；下文为既有外壳基线。

SBS-0010在已验收骨架上接续：保留深蓝导航、浅色数据区、小狐狸与MIKOSHI品牌。顶部为MIKO、我的工作台、三方号、KOL、联动管理、创意管理，采用带图标的按钮外观。VPC归入创意管理，整体业务中台撤下，工作台暂空。没有真实身份服务、实时数据接口或Agent执行器。

## 启动

Node满足`package.json`的`>=22.12.0`，npm安装精确锁定依赖。在本目录执行：

```powershell
npm ci
npm run dev
```

默认地址为`http://127.0.0.1:3100/login`。端口被其他服务占用时使用`npm run dev -- --port 3107`，不要停止不明进程。控制台Ctrl+C停止自己启动的预览。绑定本机回环地址，未部署到服务器。

生产构建本地检查：

```powershell
npm run build
npm run start
```

不要同时让不同构建写入同一`.next`；运行测试前确认所连服务对应当前源码。当前使用地址以[当前交接](../../Product/handoffs/CURRENT.md)为准。

## 演示账号与使用

登录页提供“填入”按钮；两个身份为虚构，公开演示密码是`mikoshi-demo`。

| 身份 | 邮箱 |
|---|---|
| 林序 | linxu@mikoshi-demo.invalid |
| 许澄 | xucheng@mikoshi-demo.invalid |

默认登录仍进入我的工作台。按用户要求当前页面视觉留空，不再显示卡片或编辑入口。既有布局localStorage原串不读取、重置或迁移；旧组件/合同/仓储作为复用资产保留，详见[保留组件说明](src/features/dashboard/README.md)。账户菜单仍可切换虚构身份。

顶部切换工作区，侧栏仅显示当前业务的真实子页面；手机顶部仍可切业务，抽屉显示当前页面，收起侧栏后子页图标仍可访问。KOL和三方号保留原有图表与筛选结构；当前无记录，详情和导出明确禁用。创意侧栏含“创意总览”和“VPC虚拟社区”；VPC新路径`/creative/vpc`，旧`/vpc`自动跳转，`/business`为404。MIKO `/miko`只展示AI入口预览，输入/发送禁用，无会话/任务/模型请求；未来可能接OpenBP_Harness，但本步没有接入验证。Ctrl/Cmd+K只搜索页面名称，子页附归属提示；个人设置支持系统/浅/深主题和减少动效。

会话在sessionStorage，密码不存储；偏好与既有个人布局保存在localStorage。浏览器恢复标签页可能恢复sessionStorage，本地演示会话没有生产安全保证；退出会尝试清除并核实结果。当前不加载布局，因此不会校验或修复旧布局；认证/偏好存储错误仍按各自合同处理。

## 认证模式与未来接入

默认显式构建为`demo`。正式身份服务未实现，选择production时必须失败关闭，不回落演示账号。可在独立检查时运行：

```powershell
$env:NEXT_PUBLIC_MIKOSHI_AUTH_MODE = 'production'
npm run build
npm run start -- --port 3109
```

检查后停止该进程，`Remove-Item Env:NEXT_PUBLIC_MIKOSHI_AUTH_MODE`，再`npm run build`恢复默认demo构建。公开的构建模式变量不是凭据；不要向本项目加入真实密码或API密钥。

`src/contracts`定义认证/首页/偏好合同，`src/adapters/demo`承担演示存储。真实服务接入应新增适配器并另行验证服务端会话、授权、多人并发与运行任务；前端路由门禁不代替这些能力。

## 验证与结构

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

浏览器测试需要Playwright Chromium，可用`npx playwright install chromium`安装其对应版本。`MIKOSHI_E2E_PORT`指定验收端口；测试会新建隔离浏览器上下文，不使用你的日常账号/浏览器资料。截图脚本、适用用例变更映射及实际结果见[本步实施证据](../../SBS/evidence/SBS-0010/)。

`styles`是唯一token来源，`components/ui`是按需改编的Radix系shadcn控件，`components/shell`负责导航，`features`按职责组织功能。来源仓`frontend/fronted-skill`不被运行时导入。[第三方许可](THIRD_PARTY_NOTICES.md)说明组件来源。最终逐项结果看交付回执，不以本README列出命令代表命令已通过。

## 历史工作台与品牌资产

- 原始数据：`../../References/BilibiliDashboard/无限大B站数据系统.html`，只读；与用户新复制的根目录同名HTML逐字节一致。原件SHA为`bb7e6abaf6e8cd14041e6bf29ff313966c0cbb56e75f587d9fbcbecac9bae5bf`。
- `npm run sync:legacy`按 `scripts/legacy-data-policy.json` 生成工作区与摘要，当前三方号与KOL均为empty；dev/build前自动同步。生成器包含完整输入/产物hash验证，缺失或损坏自动重建为空态，不从旧缓存重种。`public/legacy/`是本地生成产物，不提交；缺少原件会明确失败，不能自行下载或用假数据替代。历史验证可显式 `--thirdparty-mode=snapshot --kol-mode=snapshot --out-dir=<隔离目录>`，也可仅恢复其中一个板块，不得污染当前public。
- `scripts/legacy-bootstrap.js`、`legacy-bridge.js`、`legacy-frame.css`是过渡适配层；`src/features/legacy`维护导航与消息合同。原业务逻辑留在来源HTML，尚未拆成原生React组件。后续替换应逐项核验口径、筛选和导出，不能直接丢弃既有能力。
- 每个工作台首次访问才加载，切换后保留当前浏览器会话中的上下文。页面地址含白名单片段，支持刷新和回退。修改的个人本地状态按演示身份隔离；退出/切换卸载旧iframe。历史数据本身由本机用户共享，演示身份不是访问授权。
- 快照时间、发布范围和数据覆盖分别显示。原工作台部分卡片可切换到含抖音/起飞的组合口径，不能直接混比；旧首页汇总组件目前不挂载。API、外部字体/图片等自动联网被离线策略阻止；原业务页面明确外链仅在主动点击后另开。
- `public/brand/mikoshi-fox.png`是用户选定原图，已落项目；来源及SHA见[品牌说明](public/brand/README.md)。侧栏/折叠/手机导航/登录/网页图标共用，不再依赖Codex临时缓存。

当前包含真实历史业务资料。仅作授权的本机预览；静态文件可被直接访问，本地演示登录不保护它们。本轮未部署或上传快照。服务器版应另行设计真实身份、权限和数据服务。

