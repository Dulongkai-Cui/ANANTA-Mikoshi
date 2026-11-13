# Torpedo、平台可靠性与技术依据调查

日期：2026-10-18。研究者：Codex。关联：SBS-0002。本文是调查记录，不能授权实施。

## 1. 调查口径

原目录：`D:\产品孵化器\OpenBP_Torpedo`；本项目副本：`OpenBP_Torpedo/`。

原仓 HEAD 为 `de72afbd2ba139f86789b1f18b08dd7c928a7593`，副本 HEAD 为 `b93e2586b0d7e8d67880fbc20d378ecbcd2533d1`。提交不同不等于产品内容不同：以下13份选定文档逐文件 SHA256 相同。这一结论只覆盖选定文件，不代表全仓相同。

| 文件（相对 Torpedo 根） | 行数 | 本次覆盖 |
|---|---:|---|
| README.md | 924 | 全文 |
| TORPEDO_CONSTITUTION/TORPEDO_CONSTITUTION.md | 506 | 全文 |
| docs/architecture.md | 1142 | 最新 B34–B28F 段落核读，历史段落抽查 |
| docs/openbp_integration_plan.md | 56 | 全文 |
| docs/enterprise_ai_memory_architecture.md | 1495 | 全文 |
| docs/super_librarian_agent_architecture.md | 1030 | 由 Agent 运行时调查分支全文核读 |
| docs/research_execution_host.md | 182 | 全文 |
| docs/job_and_event_contracts.md | 487 | 全文 |
| docs/wiki_torpedo_r1_usable_loop.md | 202 | 全文 |
| docs/wiki_torpedo_frontend_handoff.md | 162 | 全文 |
| docs/torpedo_research_output_architecture.md | 938 | 目录、结构与相关定义抽查 |
| docs/folder_source_architecture.md | 605 | 目录、结构与相关定义抽查 |
| docs/engineering_anti_entropy.md | 358 | 定向规则核查 |

另完整核读 `pyproject.toml` 和8行的 `harness_bridge/openharness_adapter.py`；源码沿 API、研究尾链、Job、Roster 链路抽查，没有运行模型、服务、数据库迁移或全仓测试。

## 2. 最值得保留的资产

Torpedo 已把企业知识记忆分成工作上下文、限定范围的经验、原始证据、正式知识和能力资产。它要求证据、观点、实体关系、提案、审批、正式版本、可重建索引彼此有边界。这比“所有材料塞进向量库，大家随便问”更适合有费用、监修和合作口径的团队。

长期 Agent 的设计也已有基础：身份、档案、名册、记忆引用、技能装载、任务运行分离；图书馆长、文件夹管家、Booksmith、Bookboy 承担不同读写职责。Dream 是受预算和权限约束的维护任务。主方案应接续这些概念，不能再造一个不兼容的第二套人格、记忆和知识发布系统。

有价值的实现合同包括：不可变证据、候选研究产物、正式发布、来源版本、乐观并发控制、幂等键、outbox、Job 租约与 fencing。`fencing` 指每次租约取得一个递增执行代号，旧 Worker 恢复后不能覆盖新执行者的结果。

## 3. 已有与未有，分别下结论

| 主题 | 当前证据 | Mikoshi 接入缺口 |
|---|---|---|
| 研究尾链 | B34 内部同步 `ResearchTailHost` 串联资料确认、综合、候选存储、充分性检查、报告读取 | 正式角色适配器、跨进程恢复、生产调度、完整交互连接仍需工作 |
| 研究恢复 | 调用者保留相同 plans/IDs 可重放内部步骤 | 不能说已具备服务器重启后自动恢复全部 Mission |
| Job | SQLite 仓储、租约、心跳、执行代号及事件合同已存在 | 全平台多人生产数据库、中央编排适配、生产 Worker 接线 |
| UI | 已有文本上传、预览、文件夹来源读取/扫描、研究历史和报告等入口 | 完整多媒体、全套居民管理台、跨业务执行和组织权限尚未证实 |
| 感知 | 旧 API 的 perception 仍有 mock；新内部感知模块有独立基础 | 不能把旧 mock API 与新内部解析能力合写成生产就绪 |
| 运行时桥 | `harness_bridge/openharness_adapter.py:8` 为 NotImplemented | 接入 Harness 仍是工作，不能仅改名称就交付 |
| 身份 | API 有注入 backend/context 的机制 | 不是 OIDC 登录、组织授权和供应商资源隔离的替代品 |

README 有阶段历史；当前范围优先结合 `docs/architecture.md` 最新 B34 和前端交接说明判断。旧 HermesAdapter 返回 ProposalBundle 的路线，也不能冒充新的四角色研究链。确定性 mock/fixture 测试证明合同机制，不证明真实模型研究质量。

## 4. 源码定位

以下行号针对本次副本快照，后续改动后应以符号定位为准。

- `torpedo/api/app.py:49`：`create_app` 与 backend/read context 注入；不能据此声称具备完整多人 IAM。
- `torpedo/artifacts/job_repository.py:67`：JobRepository；`:76` SQLite connection；`:87` create_or_get；`:106` BEGIN IMMEDIATE。
- `torpedo/artifacts/job_service.py:105`：acquire lease；`:153` fencing 序列；`:291` heartbeat；`:1298` 继续检查租约与执行代号。此文件约1500行，迁移不能继续把跨业务编排堆入其中。
- `torpedo/artifacts/job_schema.py:221`：JobCreateRequest；`:265` JobDefinition；`:521` LeaseGrant；`:531` checkpoint。
- `torpedo/artifacts/job_worker.py:88`：DeterministicMockWorker，明确不进行实际 I/O、线程或墙钟调度。
- `torpedo/research/research_tail.py:41`：ResearchTailHost；`:51` execute；调用者保留恢复输入的设计不等于持久化运行监督器。
- `torpedo/research/bookboy_roster.py:73,95,200,235`：身份、档案和名册快照相关定义；不自动产生持续调度。

## 5. 与中央编排的关系

建议把跨业务 Mission 交给一个中央持久编排系统。Torpedo Job 只拥有知识域内步骤与提交语义，中央 Mission 记录其子任务 ID、状态投影和结果引用。每个副作用必须只有一个重试责任方；不能让中央编排与 Torpedo 同时“重试一下发布”。

如选择 Temporal，中央工作流等待 Torpedo 域任务完成并处理超时/取消请求；不得伪造 Torpedo 的研究完成、证据充分或正式知识发布结果。若决定扩展 PostgreSQL 自建编排，必须先证明能承担等待人审、重启恢复、工作流版本升级、取消、计费和未知结果对账。两条中央方案互斥。

建议保留 Torpedo 的领域类型、证据/发布合同和高价值测试，优先做适配与存储层演进。把 SQLite 文件挂到共享网络盘不是多人化方案；把所有表一次性改成 PG 也不等于权限、恢复和事务已经正确。

## 6. 官方技术依据（2026-10-18查阅）

以下是技术事实与提案推论的区分。外部文档会更新，实施时应固定版本再复核；本文不固定模型价格或最新型号。

| 官方来源 | 查证的事实 | 对方案的影响（设计推论） |
|---|---|---|
| [DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/) | 模型产生工具调用，执行由应用负责；strict 是 beta，有 JSON Schema 限制 | 结构约束可减少格式错误，但权限、事实、金额和状态转换必须由程序检查 |
| [DeepSeek Context Caching](https://api-docs.deepseek.com/guides/kv_cache/) | 提供上下文前缀缓存机制 | 缓存用于费用/速度优化；持久身份、任务和知识仍由平台存储 |
| [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | 启用 RLS 后无策略默认拒绝；表 owner 通常绕过，superuser/BYPASSRLS 绕过 | 应用使用非 owner 角色，必要时 FORCE RLS；后端授权和隔离测试仍必需 |
| [PostgreSQL Continuous Archiving / PITR](https://www.postgresql.org/docs/current/continuous-archiving.html) | 基础备份与连续 WAL 归档支持恢复到时间点 | 数据库恢复要与对象文件、工作流存储和密钥恢复配套演练 |
| [Temporal Workflow Execution](https://docs.temporal.io/workflow-execution) | 工作流执行历史支持持久化和恢复 | 适合长等待、跨步骤任务；任务历史不能当业务数据库或秘密存储 |
| [Temporal Activity Execution](https://docs.temporal.io/activity-execution) | Activity 可重试，副作用执行可能重复，支持心跳和取消相关机制 | 使用幂等业务合同；不能宣称外部发布、采集或付款自然“恰好一次” |
| [Temporal Production Deployment](https://docs.temporal.io/production-deployment) | 生产应用需要 Workers 与生产 Temporal Service；开发服务器只适合本地 | 采用前要明确托管/自建、运维负责人、费用及恢复策略 |
| [Temporal Worker Best Practices](https://docs.temporal.io/best-practices/worker) | Worker 池、任务队列、资源与版本管理会影响可靠性 | 交互、后台维护、采集和重任务分开限额；升级须兼容在途任务 |
| [Keycloak OIDC](https://www.keycloak.org/securing-apps/oidc-layers) | 标准 OIDC discovery 与认证端点 | 优先接现有企业身份；无现成身份源时才评估自托管 Keycloak |
| [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) | 文档区分进程内后台任务和需要独立工作进程的复杂任务 | 进程内 BackgroundTasks 不承担长期 Agent 的持久调度 |

没有进行云服务采购、吞吐基准、模型评测、现场恢复或安全测试。服务器规格、SLO、模型表现和并发值在设计中必须标为拟定目标或待测假设。
