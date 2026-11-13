# Agent Runtime 与群体研究调查

状态：研究与提案；对应 SBS-0002；2026-10-18。本文不修改任何组件宪法、不授权集成实现。
对象：OpenBP_Harness、独立上游 OpenHarness-main、OpenBP_Kiroshi、VCPAI，并补读 Torpedo Super Librarian 架构全文。
“已实现”指源码或既有验收记录支持；“目标”指设计承诺；“建议”是本轮平台提案，均非本轮运行验证。

## 1. 核心判断

1. “很多长期好 Agent”应实现为稳定身份、版本化能力、受治理记忆、任务履历与唤醒机制；不是很多永不退出的模型进程。
2. 该思想已有明确资产：Torpedo Super Librarian 设计定义 ResidentAgent、Roster、分层 AgentMemory、SkillLoadout；应扩展适用范围，不另造同义体系。
3. OpenBP_Harness 是 Codex 衍生引擎加自有 Studio 桌面产品；OpenHarness-main 是独立 HKUDS Python 项目。两者名称相近，来源、协议、许可和成熟度不同。
4. Studio 当前是单用户本地执行体验，不能把其回环 HTTP 服务直接暴露为 40 人共用后端。
5. VCPAI 已有有价值的玩家画像、群体模拟和受审计研究资产；模拟结论不是实际市场预测，当前应用也尚不能据此宣称服务器隔离与灾难恢复完备。
6. 推荐约 40 人阶段采用模块化业务核心、独立 Worker 和单一跨域 Mission 编排；Temporal 为首选待验证方案，部署/托管成本与团队运维能力须先完成小规模验证。
7. Torpedo 继续拥有知识域 Job/Run、lease、fencing、结果与发布事实；平台编排不能重建或双写同一套领域执行状态。
8. Kiroshi、CF1 等桌面能力属于受控 Windows 节点；服务器接收强类型事件和执行回执，不持有任意远程桌面操作权。

## 2. 原件、副本与证据基线

原件根目录为 `D:/产品孵化器`；工作副本根目录为 `D:/产品孵化器/OpenBP_ ANANTA Mikoshi`。
只读取得以下提交；原件使用显式 `--git-dir` 查询，未执行 fetch、checkout、hook 或应用启动。

| 项目 | 原件 HEAD | 当前副本 HEAD | 解释 |
| --- | --- | --- | --- |
| OpenBP_Harness | `c0d26949be4144c751894ae96e28d3db2208b764` | `2c31fa0239c061bf2b711a2b36fdfb7dc82c90e5` | 提交不同；所选产品/架构文件一致 |
| OpenBP_Kiroshi | `c2c7f026efe2de099cf9a5f62edf76eef4937b98` | `f87f3317970c024e67f2b3d9e2d05fd1e5823106` | 提交不同；所选规范/研究文件一致 |
| VCPAI | `a8abc7556d20e5e14ff06804f4d3ce67320aa498` | `8f186ce5198d98adb50fb998ab04861a0d7acb17` | 副本已完成 SBS-0001 历史去敏/大文件处理；不可据 SHA 差异推断业务重写 |
| OpenHarness-main | 无 `.git` | 当前工作区无对应 Git 副本 | 原件 `pyproject.toml` 标记 0.1.7，README/CHANGELOG 是另一独立上游项目 |

按副本受 Git 跟踪清单选择 `.md/.py/.js/.ts/.json/.toml`，排除运行产物与环境文件；逐文件 SHA256 比较。
Harness 的 Constitution、SBS、Studio 范围共 165 个所选文件，Kiroshi 的 Constitution、SBS、docs 共 31 个，VCPAI 的 docs、experimental/src、backend/src 共 103 个，均与原件逐字节相同。
该比较不是全仓等价证明：未覆盖全部后缀、二进制、个人运行状态、原件未跟踪文件或大数据集。
原件 `git status` 在当前沙箱中失败，故不宣称原件工作区干净；当前副本所查 tracked 状态干净。
VCPAI 副本另有 209 个本地未跟踪研究产物，7 个大文件留在本机并被精确忽略；本轮未纳入报告内容或上传。
Torpedo Super Librarian 原件/副本全文 SHA256 相同；全文 1030 行，本文已读完。

## 3. OpenBP_Harness：可用执行资产与服务器边界

架构事实：Electron → 本机 Python 服务 → Codex app-server → DeepSeek；推理、工具、引擎历史由 Codex 管理，Studio 管 UI、提交账本、审批呈现和本地投影。
来源：`OpenBP_Harness/Constitution/02_ARCHITECTURE.md`；该宪法要求发布 Studio 前不实际接其他 OpenBP 产品，不建设自己的 Skills 运行体系。
本轮只研究未来平台；不能用本文建议绕过该产品约束。实际抽取 adapter 必须先经过明确的产品边界变更。
`apps/openbp-studio/service.py:31–37` 初始化内存 pending approvals 与单一 active turn；`:232–267` 提交去重、拒绝第二个活动回合并设 600 秒截止。
`:242–259` 用 client request ID、输入指纹和持久 submission ledger 防重复提交；`:308` 将可能已发出的请求记为 ambiguous，而非静默重试。
`store.py:14–30` 使用 SQLite WAL，保存 threads/items/diffs/submissions/user messages；这不是组织级用户/ACL 模型。
`store.py:43–51` 启动时将未决提交标 ambiguous、运行线程标 interrupted，诚实保留不确定性；并没有重启后自动续执行任务。
`service.py:394–439` 审批绑定当前待处理引擎请求、线程/回合、预览完整性与 digest；旧记录不能复活为有效授权按钮。
`service.py:332–347` 停止会拒绝待决审批、请求 interrupt，并只终止与存储归属匹配的后台命令。
`service.py:450–506` 有工作区路径边界、危险别名检查和补丁预览完整性约束，值得复用为有证据的 Worker 边界设计。
`server.py:80,102–106,449–451` 是单实例 session/CSRF、loopback Host/bind 限制；不是公司员工账号体系。
`events.py:7` 有界内存事件重放不能替代持久事件历史；断线重连与进程重启是不同故障等级。
`runtime_config.py:15–17,304–354` 当前固定模型配置、Responses wire API、禁 web search、禁 multi_agent；源码显示的模型标签不能证明供应商实际 revision。
`:256–276,367–369` 当前已验证路径依赖 portable Linux 引擎/WSL 与私有 CODEX_HOME；源码 checkout 与实际引擎二进制版本必须分别记录。
`service.py:284–294` 本次抽查的 turn/start 构造为文本输入；不能从上游协议支持图像推断产品视觉能力已闭环。
当前 `SBS/STATUS.md`：v0.3 开发阶段，SBS-0003 IN_PROGRESS；B2b1 合成 Provider 门禁片段通过，B2b2 停止/迟到/背压等仍待推进。
25 项能力账本为 12 PARTIAL_VERIFIED、3 IMPLEMENTED、10 PLANNED、0 ACCEPTED；这是严格发布验收状态，不等于“没有任何功能”。
C20 长期调度仍 PLANNED；C13 多代理、C09 MCP 产品闭环、C08 视觉等不能由庞大上游代码量推定已可交付。
建议复用：提交意图账本、ambiguous 处理、精确审批、受限文件预览、引擎协议转换与诊断证据。
建议包装：每个 Worker assignment 独立运行身份、目录、能力上限、凭据引用和取消关联；不要共享 Studio cookie 或用户私人 CODEX_HOME。
不直接搬上服务器：Electron UI、一个全局 active turn、内存审批回调、开发 WSL 路径和当前本机 HTTP 认证。

## 4. OpenHarness-main：独立 Python 上游，不是我们的 Harness

原件 `README.zh-CN.md`/`README.md` 指向 HKUDS/OpenHarness；`pyproject.toml` 为 0.1.7，MIT 许可；OpenBP_Harness 则保留 Codex 上游与 Apache 许可链。
该上游提供 agent loop、工具、权限模式、MCP、skills/plugins、会话、memory、multi-agent，以及 ohmo 个人助手入口；这些是可评估的上游资产，不是 OpenBP 已验收功能。
`src/openharness/services/session_storage.py:54–98` 以工作目录 hash 分区并原子写 JSON 会话；保存消息/system prompt/usage 与部分工具状态。
`:18–29` 持久 metadata allowlist 含 permission mode、async agent state、task focus 等；会话快照仍不等同外部副作用事务提交记录。
`tasks/manager.py:50–58` 活动任务/进程/waiters 主要在内存字典；`:21` 已明确重启不能保留之前交互上下文。
`services/cron.py:22–34,53,104` 使用 JSON cron 清单与文件锁，执行后计算下次时间。
`services/cron_scheduler.py:150–229` 先 shell 执行、后 mark_job_run/append history；进程在中间崩溃可能遗留未被账本确认的副作用。
`:78–83,261–286,318` 使用 PID、轮询与 fork daemon；本次未见这一条链路具备分布式租约、fencing 或外部效果对账。
`ohmo/gateway/router.py:8–18` 按 channel/chat/thread/sender 分 session；`gateway/runtime.py:79–159` 会话池共享配置工作目录并存 bundle。
“不同聊天有不同会话”不能证明多个公司员工的文件、工具、模型预算、私密记忆已经隔离。
`ohmo/memory.py:19–54` memory 是可持久 Markdown 与有限条目加载；soul.md/identity.md 是角色与偏好配置，不是模型权重成长。
`permissions/checker.py:100–144` 有 allow/deny/read-only/full-auto 等权限逻辑；仓库还存在 Docker sandbox 选项，不能把局部审计写成“完全没有沙箱”。
但服务器使用必须另外验证工具许可优先级、宿主挂载、网络、秘密、每个 principal 的资源边界；本轮未完成该安全证明。
`CHANGELOG.md` 记录 OpenAI-compatible API、DeepSeek 等兼容路径及 Docker 支持，属于本地版本声明，未用真实 Provider 验证。
README 中个人 Claude/Codex 订阅登录与本地凭据复用方式不应成为公司服务器共享认证方案。
建议作为比较样本与协议/工具实现参考；不再增加另一套全平台 cron、memory authority 或 Mission scheduler。

## 5. Kiroshi：感知边缘设计较完整，生产值守尚未实现

当前仓库主要为规范、研究和探针记录；Constitution 为 0.1.0-draft.2，不能把目标流程当产品代码。
目标是授权范围内 Windows 桌面观察、结构化事件、受控动作与反馈学习；微信是第一适配器，不是无限屏幕监视权限。
`docs/architecture/SYSTEM_BLUEPRINT.md` 分控制面、观测热路径、感知慢路径、Policy/Action、证据存储；高频采集不能等待模型。
`docs/architecture/ASYNC_RUNTIME.md` 提出 lease/attempt/idempotency、队列背压、冻结 ActionIntent、审批 digest、恢复与 UNKNOWN_OUTCOME。
这些契约值得并入平台边缘节点规范，但源码尚不支持将其列为现成生产队列或无人值守系统。
`SBS/INDEX.md` 当前 SBS-002 VERIFYING；`SBS/SBS-002-gemma4-e2b-visual-feasibility-probe.md` 完整记录一次本地截图评测。
该探针仅针对 RTX 5070 Ti Laptop 12GB 与给定微信截图，没有操作微信、接 DeepSeek 或验证完整 OCR 链路。
结果建议停止 E2B 作为独立主 OCR/结构化消息引擎：未读数幻觉、说话人错配、置信度不可靠；并非证明所有小模型或其他机器不可用。
建议顺序：专用 OCR/几何/UIA 先给证据，视觉模型只承担有明确增益的补充解释；窗口/会话身份不确定时停止动作。
反馈学习应生成版本化规则、反例、回放样本与待评测 Skill；不能让一次“纠正”直接扩大权限或自改模型权重。
服务器只下发 scope、policy version、任务与短期能力；本机节点持有设备/Windows 会话/应用账号定位与动作验证。
CF1 Windows 节点的保留建议来自平台调查分工；本文未独立审计 CF1 实现，不把 Kiroshi 研究结论外推为 CF1 已实现能力。

## 6. VCPAI：可复用研究资产与必须诚实保留的限制

VCPAI 具有 PostgreSQL 应用层、JWT 登录、项目/会话/玩家组织、AI 导航、问答与群体模拟；不是只有 prompt 和静态原型。
旧 `docs/README.md`、`docs/开发计划_总览.md` 的随机锚点/目标分布等历史方向，应以 2026-10-07 upgrade-report 的实际修正为准。
`docs/research/2026-10-07-upgrade-positioning/upgrade-report.md` 说明统一 persona resolver/context、区分语气与偏好、删除 ID 哈希意见与强造分布。
2741 份增强画像有来源 hash、证据、未知项与推断标记；产品 QA 修订层与冻结 v1 研究基线分离，避免重写实验历史。
`services/personaEnhancementDataset.js:157–184,190–221` 校验来源引用/历史时间/推断标记，并禁止模型增强覆盖冻结原始证据。
`services/promptBuilder.js:66–110,156–171` 保留来源、unknown/conflict、推断与适用域；语言风格不自动决定偏好强度。
`services/llmProtocol.js:41–94,103–130` 分离请求构造、模型选项与响应校验；只接受正常结束的最终 content，不以 reasoning 文本顶替答案。
`services/generationRunControl.js:3–35` 用进程内 Map/AbortController 控制单 session 生成；不是跨 Worker 持久任务注册表。
`services/groupChatService.js:828,929,1286` 与 route 的状态锁/检查减少停止后的迟到写入；重启后对未完成外部请求的恢复仍需专门设计。
`middleware/auth.js:4–20` 已校验 JWT 并设置 user/org/session；不能说系统没有认证。
明确部署缺口：`services/websocketService.js:22–34` 当前连接路径只判断 token/sessionId 非空，注释也承认应验证 JWT，随后加入 session 连接集合。
对象授权缺口：`routes/groupChat.js:587–630` 用传入 session ID 读取；`groupChatService.js:1443–1495` SQL 仅按 id/session_id，未带组织/成员约束。
本次同时检查 `db.js`、`agentSettingsContext.js` 与 SQL 目录，未见这些查询的 per-request RLS context/策略；应以跨账号负例作为上线阻断验收。
这是静态审计发现，未连接数据库、未尝试利用；实际部署若有外置防护，仍不能替代应用对象级授权证明。
正式研究报告：5482 主实验 +1536 稳健性 +288 独立检查 =7306 有效响应；7308 请求含 2 次技术性重试，均保留记录。
`final-independent-audit.md` 用冻结 JSONL 重算 schema、映射与统计，不新增模型调用；本轮只是阅读其证据，未重跑该审计。
报告同时承认增强版 90.8%“信息不足”、表述同质化、选项顺序敏感；全部 ±5pp 稳健性等价门槛未通过。
可用于生成假设、比较方向、找追问；不能把虚拟玩家比例当真实市场份额、真实用户意见或因果预测。
模拟 Agent 是有版本来源的人群代理；平台工作 Agent 是有权限和责任的执行主体，两种身份不能混为一张“人格表”。
值得复用：证据画像、来源 hash、统一上下文、最终答案校验、错误分母、取消控制、冻结实验及独立复算流程。

## 7. Torpedo 已有 Resident 设计应如何接入

证据为 `OpenBP_Torpedo/docs/super_librarian_agent_architecture.md` 全文；其页首含 B28、正文含 B22 累计边界，不覆盖主调查更新的 Current B34。
L224–245：ResidentAgent 是稳定逻辑身份，具备 profile/Space/能力/roster/memory/SkillLoadout/履历；更换模型不等于更换 Agent。
L264–287：dormant/available/assigned/working/reporting/reflecting 等是组织可用性视图；执行事实复用已有 Job/Run，禁止再造 lease/retry/cancel 状态机。
L304–337：private/squad/leader-visible/enterprise memory 分层；上级读的是授权结构化履历，不是隐藏思维链；Skill 自改必须走评测与激活门禁。
L339–356：Salvo 并发应由任务独立性、容量、成本、风控和合并成本计算；不固定全局 3，也不无限 spawn。
L464–482：通用 ResidentAgent/AgentProfile/AgentRoster/AgentMemory/SkillLoadout 标注 target only，不能作为既有生产 schema。
L915–938：已有窄 Bookboy 评测 roster snapshot、稳定 Folder Steward 归属、严格 Steward→Bookboy 委派与聚合；缺通用 registry/activation/capacity/memory repository。
L939–956：无通用 delegation scheduler、Dream/maintenance runtime、完整自动知识编译；已有窄真实 Hermes adapter 也不能被说成全部未实现。
Harness 是执行 runtime 候选，Hermes 是 Torpedo 当前 Primary Librarian adapter 实现；两者都不应拥有企业身份、知识发布或跨域授权真相。
建议平台只设唯一全局 agent_id/principal、owner 与停用 authority；Torpedo 持有知识域角色资格、roster 证据与 domain assignment，二者通过版本引用关联。
企业扩域须先定义同一 Agent 在多个域的 membership/授权，不复制“平台 Agent 生命周期”和“Torpedo Agent 生命周期”并双写冲突状态。
Dream 可对应离线复盘、记忆整理与 Skill 候选生成；必须限预算、限证据、经过测试/批准，不能无人审查地自我强化错误。

## 8. 40 人平台的具体提案

推荐：一个模块化业务核心承担人/组织/项目/授权/审批/Agent Registry；独立 Worker 承担模型、代码、采集和领域计算。
跨域 Mission 统一由 Temporal 承担持久等待、调度和恢复协调；本轮只提出选择，官方语义与部署依据由平台主提案提供。
采用前的小规模验证必须覆盖部署/托管成本、服务升级、备份恢复、Worker 崩溃、审批等待、取消、队列公平性和预算消耗；不能仅展示正常 happy path。
不立即把业务拆成大量微服务；Worker 隔离按权限、依赖、资源和故障边界决定，模块边界先于服务数量。
中央 Mission 创建/引用 Torpedo domain Job，记录 association 和领域结果引用；领域 Job ID 的命名空间与 platform Mission ID 明确区分。
Temporal Activity 重试若重新入域，只能以相同 admission/idempotency key 查询或续接原 Job；不能再创建一个相同副作用的新 Job。
Torpedo 独占其内部 lease/fencing/retry/commit；跨域编排只决定阶段依赖、等待、取消请求和结果接受，不执行内部每个步骤。
工具执行前冻结 action parameters、input versions、principal/scope/policy、approval digest、预算与 idempotency key；过期审批不能自动沿用。
外部调用在“已发送但未确认”崩溃时进入 UNKNOWN_OUTCOME，通过可验证回执/查询对账；未知效果不能当普通失败自动重试。
不承诺端到端 exactly-once：平台用幂等、唯一约束、outbox/inbox、fencing 和效果对账减少重复，并诚实暴露无法确认的边界。
任务恢复依据持久事实与 immutable artifact refs，不依据聊天摘要或模型“我上次做到……”的叙述。
Agent 身份长期存在；每个 assignment 获得有限 runtime session。身份可用性、任务执行状态、模型会话状态分表/分契约，避免互相冒充。
最小 Agent profile 包括 role、owner、version、能力评测、允许工具/数据域/Provider、成本上限、停止条件、反馈与退役策略。
记忆分事实、任务 checkpoint、已验收经验、交流风格；每条有来源/版本/时间/权限/撤销或 supersede，避免所有历史直接拼 prompt。
调度按团队/任务优先级公平分配；40 个用户不意味着 40 个模型回合，更不意味着所有 Resident 同时常驻 GPU/进程。
预算先 reservation 再 execution/settlement；记录未知用量、失败重试、模型费/工具费/运行时间，不以免费循环代替成本控制。
企业凭据以 Vault/credential reference 进入边界内短期解引用；用户订阅文件、仓库 `.env` 与聊天消息不是共享密钥库。
中央审计关联 user→Mission→domain Job→Run→tool intent→receipt→artifact，但不把全量原文/私密记忆广播到统一日志。

## 9. 较弱模型也能可靠工作的机制

模型负责候选理解和计划，确定性代码负责权限、状态转换、校验、预算、身份与效果确认；降低模型质量不应降低系统边界。
将长任务拆为输入固定、输出 schema 明确、可独立验证的小步骤；简单计算/解析/检索不用模型完成。
先检索最相关且授权的证据再推理；缺资料返回 unknown/request-information，禁止用更长人格 prompt 填补事实。
Provider adapter 记录 model ID、可得 revision、参数、schema/工具能力与日期；alias 不公开版本时明确未知，行为 canary 不等于识别权重。
模型路由以任务评测结果选择，不以品牌或“推理模型”标签选择；DeepSeek 的具体接口/能力须另做版本化实测，不继承旧 README 的宣传断言。
每个能力有固定金标/反例、无模型 fixture、真实候选模型小样本、多次重复与失败分类；比较成功率、人工修改、成本和延迟。
较弱模型可采用 schema 校验后的有限修复、证据复核和必要时强模型/人工升级；所有修复共享一次预算，防止无限自我纠错。
第二个相同模型不自然等于独立核验；优先用确定性验证、异源证据或独立审阅，测量新增准确性而不是数 Agent 个数。
代码 Agent 通过隔离测试与差异审查验收；研究 Agent 通过引用、覆盖与不确定性验收；桌面 Agent 通过执行后重观察验收。
“人格”只影响交流习惯、岗位责任和选材偏好；可靠性来自任务契约、工具、证据、记忆治理与评测，不声称 Agent 有真实自我或无限成长。

## 10. 阅读账本与未覆盖范围

本轮完整读取：根 AGENTS、SBS-0002、Architecture Principles、Product BRIEF/CURRENT；上轮已读其余顶层 Constitution 与 SBS 执行规则。
Harness 完整读取：README、Constitution README、00_PRODUCT_CONSTITUTION、01_CAPABILITY_CONTRACT、02_ARCHITECTURE、SBS STATUS、当前 0003/0003b；Constitution 03–07 为重点章节阅读。
Harness 已复核/历史阅读：Studio README、桌面/V2/早期验收与运行指南；这些证明有界历史，不替代本轮重新运行。
Harness 源码抽查：service.py 的创建/提交/停止/审批/路径；store.py 初始化与幂等；server.py 认证/绑定；runtime_config.py 运行权限；events.py。
OpenHarness-main 阅读：中文 README 主要说明、英文 README 身份/能力入口、完整 CHANGELOG/pyproject；未将英文 828 行全部重复通读。
OpenHarness-main 完整源码阅读：services/cron.py、cron_scheduler.py、session_storage.py、ohmo/memory.py、gateway/router.py；重点阅读 tasks/manager.py、gateway/runtime.py、permissions/checker.py 与 engine/query.py。
Kiroshi 完整读取：AGENTS、README、Constitution 六份文档、docs README、SBS INDEX、当前 SBS-002、SYSTEM_BLUEPRINT、ASYNC_RUNTIME、TRAINING_AND_CORRECTION、DOMAIN_DATA_MODEL；Product Spec、User Workflows 为重点章节。
VCPAI 完整读取：docs README、开发计划总览、产品说明书/使用手册、experimental README、lab MODULE_STATUS、backend README、10-07 upgrade-report 与 final-independent-audit。
VCPAI 完整源码读取：generationRunControl.js、llmProtocol.js、middleware/auth.js、db.js、agentSettingsContext.js；重点阅读 groupChat routes/service、websocketService、persona resolver/enhancement/prompt builder。
Torpedo：完整补读 super_librarian_agent_architecture.md 的 1030 行；未替代另一路对 Torpedo Constitution/Current B34/Job 实现的独立调查。
未完整阅读：Codex 巨量上游 Rust、全部测试、全部历史 SBS、所有 Provider/sandbox 后端、全部人物数据/聊天原文、未跟踪研究输出与所有二进制。
没有运行应用、数据库、GUI、模型、付费请求或历史测试套件；没有修改原件、组件源码或运行配置。代码结论为静态审计，既有通过数只按报告归因。
本报告给出可执行的设计约束与下一步验收，不声称现有组件拼在一起即可得到生产级超级中台。

## 11. 关键证据快速入口

- [Studio 提交/审批/停止实现：service.py，重点 L232、L394](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP_Harness/apps/openbp-studio/service.py:232>)。
- [独立 OpenHarness cron：cron_scheduler.py，重点 L150–229](<D:/产品孵化器/OpenHarness-main/src/openharness/services/cron_scheduler.py:150>)。
- [VCPAI WebSocket 认证路径，重点 L22–34](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/VCPAI/FrontAll/backend/src/services/websocketService.js:22>)。
- [Kiroshi 当前视觉可行性探针](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP_Kiroshi/SBS/SBS-002-gemma4-e2b-visual-feasibility-probe.md>)。
- [Torpedo Resident 身份与组织目标，重点 L224–337](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/OpenBP_Torpedo/docs/super_librarian_agent_architecture.md:224>)。
