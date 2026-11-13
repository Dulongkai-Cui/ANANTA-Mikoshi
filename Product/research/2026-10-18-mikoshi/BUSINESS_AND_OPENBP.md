# 无限大业务与 OpenBP 研究

状态：RESEARCH，供 SBS-0002 设计提案使用，不是已批准架构或开发任务。日期：2026-10-18。研究者：Codex 子任务 openbp_product。

结论：应把 Mikoshi 设计成承接共同业务对象、协作责任和执行证据的工作平台。三方号是其中一条运营链；当前 OpenBP 提供了可复用的工作台、资料空间、任务及 AI 工具执行基础，但尚不能直接认定为适合约 40 人长期使用、部门与供应商隔离、多个常驻 AI 持续工作的生产系统。

## 1. 方法与证据边界

- 本轮只读来源文件；未运行产品、测试、爬虫、模型、数据库迁移或服务器，未修改原件、工作盘点入口和阅读登记。
- 使用 documents 技能读取 DOCX 原始正文、表格及嵌图，使用 spreadsheets 技能读取工作簿全部非空内容、公式和对象结构。未重新导出或保存源 Office 文件。
- 下文“源码存在”是静态实现证据；历史 SBS 的“测试通过”是原记录，不能当作本轮运行验收。
- 来源分为用户需求原件、会议转写、用户补充摘录、整理入口、设计文档、源码、演示数据。相互引用不改变证据身份。
- 为防止伪造完整覆盖，全文阅读和源码抽查分开登记。未声称逐行读完全部代码，也未把扫描或哈希比对算作内容阅读。
- DOCX 坐标 B 是 `word/document.xml` 的 body 直接子元素序号，包含空段和表格；会议 P 是本轮非空正文段落序号。它们不是 Word 页码。

## 2. 原件与副本关系

- 当前主应用实际位置为 [OpenBP/OpenBP](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP>)；原项目为 [原 OpenBP](<D:/产品孵化器/OpenBP/OpenBP>)。外层 `OpenBP/frontend` 不是主应用。
- 2026-10-18 逐文件 SHA256 比较：Construction Specification 25、AI_Dev_Memo 57、SBS_Planandaccept 24、explanatory_memorandum 1、frontend/src 505、frontend/scripts 196，以上 808 文件同路径同内容，无单边文件。
- README、frontend/package.json、docker-compose.dev.yml、docker-compose.yml 另行比较，4 文件相同。总计比较 812 文件；没有因此声称整个目录或运行数据完全相同。
- 比对不含 `.git`、依赖、`.env`、真实本地数据、构建物和参考 Claude 源码。原件与副本今后仍可能分叉；真正开发前应明确唯一改动仓库与基准提交。
- 已查 OpenBP 两层入口及相关文档目录，未找到独立的 OpenBP `Constitution.md` 或适用的组件 `AGENTS.md`；现有顶层 Constitution 管当前工作区，旧 PRD/施工说明作为产品证据。
- [BPAI README](<D:/产品孵化器/BPAI/README.md:3>)明确面向工程组织；OpenBP README 明确继承 BPAI 工程协作快照并泛化。两者是演进关系，不能当两套独立业务能力重复计入。
- 原 `OpenBP_Game` 当前仅见 Assets 下 22 张 PNG，分家具、Office、Worker 概念及拆分图；未见 README、应用源码或运行说明。可以作为空间/员工视觉资产参考，不能称为已实现游戏化办公系统。
- `Claude源码` 是 Claude Code source recovery 参考目录；未将其当 OpenBP 产品实现或已接入 Claude 执行器。

## 3. 逐文件完整阅读清单

下列是本轮全文核读；OpenBP 原件因上述内容一致采用副本核读，不重复输出同一内容。

| 文件 | 实际覆盖与用途 |
|---|---|
| [三方号看板.docx](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/三方号看板.docx>) | 全部正文、2 张表、7 张嵌图；图为计划列表、效果汇总、日历、平台卡片、趋势和事件传播路径。远程腾讯文档未打开。 |
| [三方号上线项目进度管理.xlsx](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/三方号上线项目进度管理.xlsx>) | 全部 5 Sheet 非空单元格和公式；总、规划管理有业务内容，发布管理、内容规划、对标各种例子为空；0 嵌图、0 图表，未发现公式。 |
| [工作盘点 AGENTS](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/AGENTS.md>) | 全文；本轮明确只读要求优先，不回写其索引与登记。 |
| [工作盘点 Constitution](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/Constitution.md>) | 全文；事实/计划/建议、分工、费用和来源约定。 |
| [工作盘点 README](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/README.md>) | 全文；六块业务入口与当前成果导航。 |
| [业务全景](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/00_项目入口/业务全景.md>) | 全文 60 行；业务地图、协作边界及截至 10/16 的修正。 |
| [当前口径与待确认](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/00_项目入口/当前口径与待确认.md>) | 全文 62 行；新旧口径和证据缺口。 |
| [总时间轴](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/总时间轴/README.md>) | 全文；公共节点与条件节点，不将排期认作承诺。 |
| [KOL 入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/KOL相关/README.md>) | 全文；主题、采购、比稿、人选、锁档、跨渠道费用。 |
| [三方号入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/三方号相关/README.md>) | 全文；PGC/UGC、供应商、SOP、审核和历史离线看板边界。 |
| [伏羲入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/伏羲相关/README.md>) | 全文；采购/注册/可用号/百粉号区分、分平台采样、内容管线与最新报告。 |
| [上影元入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/上影元相关/README.md>) | 全文；授权范围、端内交付、监修、首发/春节及线下权益。 |
| [浙博入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/浙江省博物馆相关/README.md>) | 全文；合作意向、命名、法务、期限、产品与传播依赖。 |
| [费用入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/费用相关/README.md>) | 全文；测算/口头同意/审批/下单/付款及跨表去重。 |
| [关于无限大入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/关于无限大/README.md>) | 全文；游戏介绍和品牌研究资料身份，不等同版本交付。 |
| [盘点大表入口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/盘点大表/README.md>) | 全文；原表与历史成果关系，发现旧“当前版”指向与总入口不一致。 |
| [10/14 运营体系与看板会议](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/每日资料/2026-10-14/会议记录/三方账号运营体系与看板搭建讨论-转写结果.docx>) | 全部 210 个非空正文段落；0 表、0 嵌图。非正文页脚未用作事实依据。 |
| [10/15 多平台运营会议](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/伏羲相关/10月15日多平台账号运营相关规划-转写结果.docx>) | 全部 143 个非空正文段落；0 表、0 嵌图。 |
| [伏羲业务重启补充](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/每日资料/2026-10-16/伏羲业务重启与内容方向补充.txt>) | 全文；用户补充原话和整理口径分别识别。 |
| [伏羲图文汇报口径](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/每日资料/2026-10-16/伏羲图文汇报最新口径.txt>) | 全文；准确摘录身份、测算数据、功能与账号状态差异。 |
| [OpenBP README](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/README.md>) | 全文 160 行；继承关系、六模块、技术栈、运行入口及阶段边界。 |
| [施工总索引](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/Construction_ Specification/00_总索引与导航.md>) | 全文；当前 App Router/BFF/服务层、数据链路及文档事实/意图区分。 |
| [数据库模型与映射](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/Construction_ Specification/03_数据库模型_迁移_业务映射.md>) | 全文；旧日期文档，另用当前 schema 校验关键表。 |
| [当前功能盘点](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/Construction_ Specification/OpenBP_当前功能盘点与关联地图_2026-05-23.md>) | 全文 1–1459 行；实际更新至 5/30，不能覆盖 6 月后续实现。 |
| [用户角色与场景](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/AI_Dev_Memo/Project_skeleton/03_用户角色与核心使用场景.md>) | 全文 481 行；产品意图，非实际权限验收。 |
| [权限矩阵与回写规则](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/AI_Dev_Memo/Project_skeleton/15_权限矩阵与回写规则.md>) | 全文 646 行；模块/对象/回写三层以及建议层与正式层。 |
| [BPAI README](<D:/产品孵化器/BPAI/README.md>) | 全文 176 行；核对产品线来源，不读取运行时账号文件。 |

同会话此前完整核读并由本轮同版哈希支持复用：`AI_Dev_Memo/Project_skeleton/14_核心对象模型与跨模块关系.md`、`frontend/package.json`、页面主入口、`runtime-store/paths.ts`。本轮另全文阅读操作草稿 list API/page、员工 permissions API、login API、任务页及 `json-file-store.ts`，如下文定位。

## 4. 全业务分区与共同对象

| 业务分区 | 主要工作和责任 | 应共用的对象 |
|---|---|---|
| 总盘与项目节点 | 目标、周安排、跨模块依赖、卡点、阶段检查；负责人统筹，Lisa 协助倒排 | 项目、里程碑、任务、负责人、依赖、状态证据 |
| 产品事实与传播策略 | 真实玩法/版本/卖点、主题方向、品牌表达；产品事实与创意候选区分 | 版本、玩法事实、公开时间、主题、可用素材、引用 |
| KOL 与主题事件 | 人选、供应商比稿、创意、报价、锁档、制作、现场与扩散 | 合作方、达人、合作单、内容任务、档期、成本归属 |
| 三方号与供应商运营 | 账号台账、定位、月度量价、节点任务、审核、效果和整改 | 平台账号、供应商、具体运营人、计划、作品、指标规则 |
| 伏羲 AI 内容协作 | 方向/数量/标准由业务给，逐号定位/样稿/技术生产发布由伏羲完成 | 账号批次、设备/资源容量、生产任务、样稿、发布回执 |
| 上影元/IP 合作 | 权益、端内版本、素材需求、送审监修、首发/春节、线下履约 | 授权、素材版本、监修意见、批准范围、履约任务 |
| 浙博/外部机构合作 | 意向、名称、法务、授权期限、产品呈现、传播条件 | 合作事项、条款、审批意见、期限、产品交付、续期提醒 |
| 费用与采购 | 测算、报价、额度、审批、订单、支付、复盘；跨表不能重复加总 | 成本项、报价、采购单、费用分摊、支付证据 |
| 资料与工作记录 | 原件、会议、聊天摘录、表格、当前口径、历史版本、证据链接 | Source、Asset、Version、Decision、Claim、Evidence |

证据：[业务全景 7–27 行](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/00_项目入口/业务全景.md:7>)、[费用入口 3–38 行](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/费用相关/README.md:3>)和各业务入口。上述分区是视图与职责，不应各复制一套项目、人员、素材、成本和日期。

- 龙凯统筹并承担自己的方案，不等于所有执行归龙凯；佳雯的玩家向规划、KOC/媒体/部分活动传播与龙凯执行要分开表达。
- 供应商是组织，供应商运营人是人员，平台账号是资产；三者不能只用一个“负责人”文本框混存。10/14 原会 P151–152 明确供应商内部还有组和具体认领人。
- 产品、商务、法务、采购、IP 监修方分别给不同事实和决定。业务负责人可推进流程，不能由一份营销确认替代所有专业确认。
- 管理层需要跨域汇总；执行人需要自己的工作与依赖；供应商只应看到约定范围。系统管理员负责平台配置，不自动成为预算/内容审批人。
- 约 40 人是本次用户场景目标，不是当前资料证明已有 40 个已配置账号，也不是可直接换算成 40 个同时运行的模型进程。

## 5. 三方号原件的确定内容和差异

- DOCX B13/B16、B39–57：账号台账分伏羲/供应商视图，发布计划关联日历，定时回采效果，按分类 KPI 观察异常；账号状态为正常运营、待整改、已回收停用。
- 月度非节点方案通过后供应商自主选题，普通内容机审、初期可复核；重点与临时选题人工快审。审核政策应来自任务类型和已授权范围，不是每一步再问一次。
- DOCX B25 写“满足 KPI 就收回”，与 B41 及原会 P175–177 的“不满足、先换运营人再考虑供应商”矛盾；应保留原文并登记文字错误候选，不能直接编码该句。
- DOCX B41 是一个月统一试错期，原会 P191 是 1–2 个月调整期；试用起算、整改周期、哪些指标触发、谁决定回收尚需产品确认。
- DOCX B13 的两页视图与 B57 的“只需 B 站”存在范围差异；原会 P24–31 明确供应商 B 站与伏羲多平台。建议用业务线/平台过滤复用对象，首期接入范围另定。
- KPI 的更新频率、CPM、响应速度、互动量只是维度；供应商分类阈值、成本是否含加热、窗口和结算政策没有全部确定。机判异常不等于自动付款或自动回收。
- 工作簿“总”!B16/C16/C21/C25/C29/C31 记 300 与 80+70+50+50+50；表内未明确单位和审批状态，不在本报告升级为已批预算。
- “规划管理”!E3:E12 的 10 类参考数量合计 121；“总”!B33 说明这里是数量目标，具体账号看账号库。不能同伏羲 2000 全平台目标直接相加或相互替代。
- 伏羲 400 是已采购手机号的用户确认口径，700/2100 是计划与容量，2000 可用/1600 百粉是目标；采购、注册、可发布、持续更新、达标各需独立事实。[补充原文 7–21 行](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/工作盘点/每日资料/2026-10-16/伏羲业务重启与内容方向补充.txt:7>)。
- 伏羲分平台 D7 采样标准来自后续工作稿/建议规则；不能自动覆盖供应商分类合同 KPI。规则必须有对象范围、来源、版本、生效周期和缺样处理。
- 7 张示例图用于交互与展示参考。根 HTML 的 `localStorage`（1011–1012）、`seedMetrics`（1075/1221）及“重置演示数据”说明示例不能证明生产取数、机审或财务结果已接通。

## 6. OpenBP 实际基础和成熟度

| 能力 | 静态证据支持的现态 | Mikoshi 使用判断 |
|---|---|---|
| 应用与数据栈 | Next.js 16 / React 19 / TS，App Router API + server-only 服务，Drizzle/PG/PostGIS；OnlyOffice 协作 | 可以沿用应用骨架；并非独立后端微服务已完成 |
| 工程任务与团队 | work_orders、source_intakes、dispatch_executions、delivery_resources、missing_items、engineering_* 实表与服务 | 复用任务/责任/缺件/交付模式；不能把施工阶段直接重命名成营销业务全过程 |
| 资料空间 | 资产、文件夹、协作空间、上传、编辑回调、文本/二进制写入等实际路径 | 优先复用；需统一权限、版本冲突、素材授权与可引用解析 |
| BP Ask | 持久化会话/摘要/事实记忆/执行任务/结果，工具与协议调度、部分正式写入 | 适合作统一业务入口；现有巨大主服务不是所有新业务继续堆逻辑的位置 |
| 工作协议与工具 | catalog/plan/adapter/preflight/confirmation/receipt/recovery 已有；文档与工单部分 live adapter | 复用执行契约和回执；逐项核对权限，不假设所有 adapter 同一安全强度 |
| 员工与 Skill | 招募、绑定、目录、权限配置、安装、local_process、操作草稿、工作收件箱、自然语言委派相关实现 | 有交付工作基础；仍须补持久任务调度、权限一致性与运行隔离 |
| Blueprint/Builder | Active Blueprint 使用 `active_mock`，dryRunOnly/draftOnly；Builder 有 mock 生成 | 保留为业务模块配置/设计候选，不称为已自动生成企业系统 |
| Evidence/RAG | 安全文本摘要与 metadata/evidence 流程存在；Office/PDF/图片等默认阻断 | 当前不能完整理解用户这批 DOCX/XLSX/PPT/图片；需另建可引用解析链 |
| Hermes 与长期记忆 | 6/10 最后 SBS 明确 dry dispatch probe，实际任务执行/长期记忆网关待做 | 不将正式员工 badge 或 memoryPolicy 字段当常驻自主智能已实现 |

旧盘点的“没有员工 Work Inbox、没有联网 Skill 搜索”已过时：5/30 起后续 SBS 与 `/ai-dorm/skill-operation-drafts`、Skill discovery 相关文件存在。报告采用“已有入口与实现，生产适用性待验”表述。

## 7. 多人、权限、持久化的关键缺口

1. 身份模型已有用户/会话/工作区/成员关系；当前 user_role_key 只有 dispatcher、document_editor、comment_reviewer、system_admin。[schema 20–25、247–328](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/db/schema.ts:20>)。团队还大量使用 teamLabel/email，尚非完整组织职位与供应商授权体系。
2. AI 中枢配置权限把 dispatcher 与 system_admin 共同当可管理工作流、Skill、员工；它是粗粒度角色判断，不是部门、对象、工具、成本额度的完整授权。[ai-dorm/server.ts:848](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/ai-dorm/server.ts:848>)。
3. 已证实一个需要上线前修复的隔离缺口：操作草稿 GET 只校验登录，workspaceId 来自可选 query；page 也可无 scope 读历史；store 无 workspaceId 时返回所有记录。证据：[list route:45](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/app/api/ai-employee/installed-skills/operation-drafts/route.ts:45>)、[page:60](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/app/ai-dorm/skill-operation-drafts/page.tsx:60>)、[store:524](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/business-domain/ai-employee-skill-operation-draft-store.ts:524>)。这是静态链路结论，未尝试读取他人数据。
4. 文档服务列表默认当前工作区，但 getAssetById/readAssetBinary/overwrite 接口本身没有 actor 参数；不能凭服务名字认定每条调用链都做对象鉴权。需在网关和服务入口统一执行，并逐路由验证。[content/server.ts:309](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/content/server.ts:309>)、[467](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/content/server.ts:467>)。
5. BP Ask 工单 `shouldDirectApplyWorkOrderWriteback()` 恒 true，执行分支记录 autoApproved 后 apply。它不等于全部写入都危险，但证明不能宣称“所有正式写入都有人工确认”。将来应以授权策略区分低风险正常推进和高风险审批，不要假人审。[server.ts:1759](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/bp-ask/server.ts:1759>)、[12775](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/bp-ask/server.ts:12775>)。
6. auth readAppStore 合并 PG 与 raw store；session 写 PG 并异步 shadow，content 同样双路径。JSON store 的队列在进程内，临时文件替换不提供多进程事务；读失败/解析失败会回默认值。[auth/server.ts:551](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/auth/server.ts:551>)、[json-file-store.ts:61](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/work-protocol/json-file-store.ts:61>)。
7. 工作草稿 JSON MAX_RECORDS=500，属于有限历史存储，并非完整审计归档；工单/工程队当前 schema 也未统一携带非空组织租户键。长期服务器要先定数据主权、保留/归档和事务边界。
8. 登录页仍把 bootstrap 账号信息和口令作为预设展示；此报告不复制值。生产应采用独立账号入职/离职流程并关闭演示入口。[login/page.tsx:130](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/app/login/page.tsx:130>)。
9. local_process 确实创建目录和 input.json、调用 Node/Python、读 output.json；限制 env/cwd/超时不等于操作系统沙箱。运行不可信 Skill 需要明确文件、网络、secret、资源边界。[skill-runtime-local-process.ts:455](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP/OpenBP/frontend/src/lib/business-domain/skill-runtime-local-process.ts:455>)。
10. 以上不足是“约 40 人长期共享环境”上线前的验收问题；没有做负载测试，因此不能据此断言 40 人一定跑不动，也不能宣称容量已通过。

## 8. 跨域闭环建议

以下是研究建议，均需进入产品提案讨论；不是本轮已经授权实现或对外执行。

### A. 一个传播节点从需求到结果

- 节点目标/公开时间 → 可用玩法事实与已审母素材 → KOL、供应商和伏羲分工 → 内容草稿/重点审核 → 排期 → 发布回执 → 同窗效果 → 一次费用归属与复盘。
- 用同一个 nodeId/campaignId 关联，而不是 KOL 表、三方号表、IP 表各复制标题与日期；内容一份可有多个渠道版本和多次发布，作品不等于发布记录。
- AI 可自动整理缺件、生成任务草稿、汇总回执和异常；批准内容、外部发布、采购付款按各自权限处理。看板只呈现可追溯结果。
- 建议作为首条验证链：选一个已确认公开节点、一份素材包、一位 KOL/合作方和少量账号，证明跨域串联与权限。范围不要默认为全量三方号/2000 账号。

### B. IP 合作从授权到传播履约

- 合作范围/有效期 → 产品版本需求 → 素材提供 → 监修意见/返修 → 正式版本 → KOL/官媒/活动使用 → 权益履约证据 → 续期/失效处置。
- 上影与浙博复用 Partner、Agreement、AssetVersion、Review、Milestone、Delivery；播片、海报、角色改编、建筑呈现分别挂授权，不用单个“已合作”状态覆盖全部。
- 可验收例：素材已提供但未监修通过时，能继续内部制作，却不能被标为可对外发布；授权过期能列出受影响计划并交负责人处理。

### C. 供应商与内容质量从采购到调整

- 报价/承接范围 → 供应商与具体运营人 → 月度计划/任务 → 作品验收/发布 → 原始效果与规则版本 → 质量异常/整改 → 责任调整或结算建议。
- KOL 和三方供应商共享合作主体与采购基础；KPI 算法、交付类型和试错规则保持各自定义，避免把同一 CPM 门槛强套所有业务。
- 可验收例：某作品跨两个节点使用不重复计制作费；加热费与制作费分项，同一费用可分摊但总额不增；缺数据显示待核而不是 0 或达标。

### D. 会议证据到协作计划再回验

- 原始资料版本 → 带坐标的事实/意见/计划 → 冲突候选 → 当前决定 → 任务与依赖 → 实际交付证据 → 更新当前口径。
- 复用 OpenBP 资料、任务和 Evidence 概念；增加文档解析、版本和决定生效语义。相同对象只能有一个当前权威状态，历史和分视图保留引用。
- 可验收例：旧 2000 万与新 4000 万预算讨论不相加，旧“11 月才锁档”不覆盖新口径；补证已完成名称不会重新创建命名任务。

## 9. 复用与改造取舍

- **直接复用候选**：App Router/页面壳、PG/Drizzle 工程、资料空间与协作编辑、任务/结果/回执模式、员工与 Skill 目录、工作收件箱交互、测试组织方式。这里的直接复用仍含接入级验证。
- **保留概念、改造实现**：统一权限服务、业务对象范围、PG 主存储与历史事件、角色/部门/供应商协作、草稿到正式状态策略、素材版本和审核、跨域关联、AI 调度与预算。
- **参考而不继承为生产事实**：Blueprint mock、Builder demo、历史静态看板、工程领域阶段、OpenBP_Game 图片、Claude 源码参考。
- **补建能力**：Office/PDF/图片解析与引用；持久任务队列、可恢复计划与计时器、幂等回写、并发版本检查、外部发布/采集适配器、指标规则版本与原始采样、统一审计。
- **多 AI 的产品合同**：稳定 employeeId 与人类委托人、所属工作域、可用工具/资料、额度、任务输入输出、等待/恢复/失败状态、记忆写入策略、每次调用来源；模型/执行器是可换实现，不等于员工身份。
- **长驻的可验收含义**：服务重启后身份、待办、定时器、授权和记忆来源仍在；任务有租约/重试/去重，等待时不持续烧 token；不是把一个聊天窗口永久开着。
- **弱模型分工**：先将抽取、分类、草稿、审核证据分别定义 schema 和评价样本；低置信/缺证/权限问题退回补参或更强执行器，不能仅凭员工人格宣称会自主解决。
- **避免锁死架构**：先确定对象、契约、数据权威和权限验收，再决定是否抽服务。约 40 人可以从模块化应用起步；本报告未证明必须微服务，也未选定消息队列或向量库产品。

## 10. 仍需调查或产品确认

- 根 DOCX 的 B 站范围、供应商/伏羲视图、统一一个月还是 1–2 月调整期、分类 KPI、费用口径和结算决定者，仍不能擅自定为生效规则。
- 供应商是否直接登录、约 40 人的部门/角色名单、已有身份系统、哪些模块需要对合作方开放，需用户给产品口径；研究可先写建议权限矩阵供确认。
- 工作盘点多数入口是前轮整理成果。本轮未重新通读其全部六场会议、所有聊天、39 页 IP PPT、所有预算/合作工作簿、品牌词库或远程附件；涉及具体合作、金额、节点承诺必须继续回原件。
- OpenBP 历史理想设计、整体蓝图、核心模型和后端拓扑已按本轮所需章节参考；没有宣称全部历史施工巨文全文阅读。6 月 SBS 重点检查实际完成/遗留边界与对应代码，不把计划段当全部实现。
- 本轮没有 OnlyOffice 多人编辑冲突、账号隔离、重启恢复、负载容量、备份恢复、机审准确率或真实采集成功率的运行证据。这些应成为后续实现阶段的具体验收任务。
- 首个可执行产品任务应围绕上面的 A 或 D 纵向样本，由用户确认目标与结果；在该选择之前不承诺某个业务模块全量交付。
