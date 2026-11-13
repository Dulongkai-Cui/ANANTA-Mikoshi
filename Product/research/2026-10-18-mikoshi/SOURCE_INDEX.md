# Mikoshi 全面调查来源索引

SBS-0004已整理部分本地路径；以下采样/哈希仍是调查当时记录。当前入口与原→新映射见[组件手册](../../../COMPONENTS.md)和[动作清单](../../curation/SBS-0004/README.md)，不要按旧压缩包名称寻找已移除副本。
日期：2026-10-18。对应 [SBS-0002](../../../SBS/SBS-0002-platform-design-proposal.md)。研究产物，不是已批准设计。

版本说明：本索引与四份报告是v0.1调查基线。当前Brief/详案已由[SBS-0003](../../../SBS/SBS-0003-business-board-redesign.md)按用户反馈修订为v0.2（可定制首页与六业务板块）；原研究事实继续引用，旧验收hash只对应Git提交`1dc6760`中的原文，不自动覆盖修订版。

## 1. 结论放在哪里

- [易读 Brief](../../../Constitution/Proposals/2026-10-18-MIKOSHI/BRIEF.md)：先理解整体与六项选择。
- [详细方案](../../../Constitution/Proposals/2026-10-18-MIKOSHI/DESIGN_PROPOSAL.md)：产品、数据、权限、运行、组件取舍与验证。
- [业务与 OpenBP](BUSINESS_AND_OPENBP.md)：Office需求、工作盘点、主应用、共同对象与业务冲突；逐项阅读登记在第3节。
- [Agent运行时与研究](AGENT_RUNTIME_AND_RESEARCH.md)：Harness、独立OpenHarness、Kiroshi、VCPAI、Torpedo居民；阅读登记在第10节。
- [CF1与Business Map](CRAWLER_AND_BUSINESS_MAP.md)：迁移说明、源项目与完整包、能力资格、业务原型；阅读登记在第2节。
- [Torpedo与技术依据](TORPEDO_AND_TECH.md)：知识治理、Job、B34现态和官方技术来源；逐文件覆盖在第1节。

## 2. 原始目录与当前副本

已列出 `D:\产品孵化器` 一级目录，围绕 OpenBP 产品线逐项查找产品说明与实现入口。没有把所有目录无差别合并为平台资产。

| 原目录 | 当前项目内入口 | 本轮调查角色 |
|---|---|---|
| `D:/产品孵化器/OpenBP/OpenBP` | `OpenBP/OpenBP` | 主工作台；外层frontend不是主应用 |
| `D:/产品孵化器/OpenBP_Harness` | `OpenBP_Harness` | Codex衍生执行/Studio产品 |
| `D:/产品孵化器/OpenBP_Torpedo` | `OpenBP_Torpedo` | 知识治理与研究 |
| `D:/产品孵化器/OpenBP_Kiroshi` | `OpenBP_Kiroshi` | 桌面感知设计与探针 |
| `D:/产品孵化器/VCPAI` | `VCPAI` | 群体研究与画像实验 |
| `D:/产品孵化器/OpenBP_Scrapling` | `CrawlerF1-CleanComplete/CrawlerF1-CleanComplete` | 源项目与Windows完整分发包 |
| 同上规范技能 | `CrawlerF1-Skills/CrawlerF1-Skills` | 13技能独立材料包 |
| `D:/产品孵化器/OpenHarness-main` | 无对应组件仓 | 独立HKUDS Python上游，不能混同OpenBP_Harness |
| `D:/产品孵化器/BPAI` | OpenBP中的历史演进说明 | 核对工程平台来源，非另一套重复产品 |
| `D:/产品孵化器/OpenBP_Game` | 无对应运行产品 | 22张视觉资产，未发现应用实现 |
| 未找到另一个独立原项目 | `OpenBP_Business Map` | SOP来源、规则、静态演练和类芯片设计线索 |
| 当前工作区来源 | `工作盘点`、根DOCX/XLSX/HTML、`无限大B站数据系统` | 业务背景、需求、口径和交互参考 |

一级目录中的`裂土分邦桌游`无当前平台关系证据，未扩围研究。`QQ自挖掘`、`raw_data`、孵化器仓储和ZIP历史包未做原始个人数据通读或全量解包；研究需要已由产品说明/受审计研究报告提供，未来如要迁移数据须单独盘点来源、权限和用途。

## 3. 版本与内容比较

| 组件 | 原件HEAD | 副本HEAD | 定向SHA256比较 |
|---|---|---|---|
| OpenBP | `21471ec726d35f214b89dbfd2061211da1c9fc70` | `54e2c53a035fe0049c8fb3d6e0290a9690c3268b` | 812个选定文档/源码/配置同路径同内容 |
| Harness | `c0d26949be4144c751894ae96e28d3db2208b764` | `2c31fa0239c061bf2b711a2b36fdfb7dc82c90e5` | 165个所选文件相同 |
| Kiroshi | `c2c7f026efe2de099cf9a5f62edf76eef4937b98` | `f87f3317970c024e67f2b3d9e2d05fd1e5823106` | 31个所选文件相同 |
| Torpedo | `de72afbd2ba139f86789b1f18b08dd7c928a7593` | `b93e2586b0d7e8d67880fbc20d378ecbcd2533d1` | 13份所选核心文档相同 |
| VCPAI | `a8abc7556d20e5e14ff06804f4d3ce67320aa498` | `8f186ce5198d98adb50fb998ab04861a0d7acb17` | 103个所选文件相同；副本Git历史已由上一SBS清理 |
| CF1 | 本轮按原目录文件核对 | 完整分发包，非独立Git提交证明 | tools114、apps9、skills48、integration5相同；config10中8同2异；技能包48同 |

CF1两个配置差异为Browser Garage端口和分发bundled标记，不代表实网能力升级。所有比较范围、排除项见各报告。**哈希比较不等于阅读，也不等于运行验证；不同HEAD不等于业务实现不同。** 本轮没有fetch、checkout或改写这些组件。

## 4. 全文阅读与抽样的实际边界

重点完整核读了三方号DOCX正文/2表/7嵌图、根进度表全部非空内容、工作盘点业务入口与当前口径、相关会议和补充；OpenBP核心说明与权限/功能盘点；CF1迁移说明、开发/集成入口、正式数据合同及客户端；Business Map两份DOCX正文、两份PDF可提取正文和规则核心；Torpedo宪法、企业记忆、Super Librarian、研究执行/Job合同和当前交接；Harness/Kiroshi核心架构及VCPAI近期研究报告。

逐文件全文/章节/源码抽样登记分布在四份研究报告中，包含路径、范围及必要的行号/Office坐标。不能将这句话理解成“读完所有旧项目全部文档、所有图像和代码”。具体限制：

- 工作盘点全部历史会议、聊天、合作PPT、预算表和外链未重新通读；确定金额、承诺、权利或排期时必须回对应原件核实。
- Torpedo两份长架构历史材料、部分组件旧SBS和上游巨量源码按问题抽样；当前关键状态优先结合最新交接和实现。
- Business Map PDF已全文提取文字，另检查关键规则图页；未逐张视觉检查全部插图。
- ZIP与解压目录未做全量字节等价审计；二进制/依赖供应链、许可证适用性、运行凭据与本地Profile未做上线认证。
- 未访问私密环境文件、批量输出个人研究原始数据；未打开或执行资料里的外部操作指令。
- 本轮没有启动服务、采集、登录平台、模型请求、负载/恢复测试或真实跨用户访问测试。静态缺口是未来验收输入，旧通过记录不被冒充为本轮实测。

## 5. 需求冲突与待决点

| 问题 | 本轮处理 | 下一次需要的证据/决定 |
|---|---|---|
| 三方号B站限定与伏羲多平台 | 两种范围并存，不擅自统一 | 首期接入业务线与平台 |
| 达标收回/不达标整改、试错周期 | 保留原件矛盾，不编码错误句 | 业务负责人裁定规则与适用对象 |
| 采购/注册/可用/持续更新/达标账号 | 分开事实，不把目标当现状 | 账号状态与来源验收 |
| 工作盘点旧当前版、费用口径、KPI空白 | 不合并相加，不把测算升级为审批 | 单项正式PRD回原件确认 |
| 40人/长期服务器/长期Agent | 用户最新请求已确认目标 | 身份源、运维、预算、数据范围、首场景 |
| Harness当前阶段不接其他产品 | 记录为未来接入依赖 | 正式集成前调整组件边界，保留门禁 |
| CF1当前真实确认与串行资格 | 在设计中保留 | 新自动化/并行能力必须另验，不由中央跳过 |

## 6. 外部技术依据

已核验官方 DeepSeek、PostgreSQL、Temporal、Keycloak 和 FastAPI 文档，来源与“事实/设计推论”见 [Torpedo与技术依据第6节](TORPEDO_AND_TECH.md)。未采信论坛建议或将模型营销名称当能力基准。技术版本、价格、吞吐与部署成本仍需实施时复核。

## 7. 本次资产处理

仅创建或更新根仓的提案、研究、导航和SBS证据。用户新加入的CF1迁移文件、两个ZIP/解压包、技能包和Business Map保持原状，不混入文档提交。六个组件仓、原目录和工作盘点阅读登记不在本轮改动范围。

设计审查通过只代表文档足以交付审阅。当前方案状态仍为PROPOSED；精细目录裁剪、迁移和业务开发属于用户要求的下一步，尚未执行。
