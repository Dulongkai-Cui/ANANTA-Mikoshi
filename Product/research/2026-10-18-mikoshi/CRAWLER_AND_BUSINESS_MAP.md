# Crawler F1 与 Business Map 调查

日期：2026-10-18。所属：SBS-0002。性质：只读调查与接入候选，不是批准后的实施方案。
目标：为约 40 人、多个长期 AI 在服务器上协作的 Mikoshi，辨明采集与业务图的既有资产、可靠性边界和研究缺口。
本次未启动 EXE、服务、爬虫、平台登录、付费模型或测试；没有修改来源、原项目或运行数据。
“源码实证”表示静态源码可定位；“原项目记录”表示历史文档自述；“候选”表示尚需决策与验收的建议。

## 1. 路径与主要结论

下文 `C` = `CrawlerF1-CleanComplete/CrawlerF1-CleanComplete`；`W` = `C/resources/app/workspace`。
`S` = `CrawlerF1-Skills/CrawlerF1-Skills`；`B` = `OpenBP_Business Map`，均相对 Mikoshi 根目录。
`O` = 原项目 `D:/产品孵化器/OpenBP_Scrapling`；行号为当前文本的 1 基行号，PDF 用页码，表格用单元格。

- **源码实证：** Crawler F1 是可保留的采集执行资产，包含 Mission 合同、正式工具、Browser Garage、后台 Worker、导入、交付与恢复代码。
- **边界：** 完整包是 Windows x64 本机产品，不是已验收的 40 人服务器服务；本地账号归属不等于企业多租户隔离。
- **重要区分：** 正式兼容采集链、B 站训练专家、影子模型建议、开发风洞工具循环，是不同成熟度层次。
- **候选：** 先保留独立 Windows 执行节点及本机 API，再研究 Mikoshi 后端适配；不能将本机令牌发给全部用户，也不能直接搬到 Linux 运行。
- **源码实证：** Business Map 是业务资料、SOP 可视化及静态演练；能提取业务环节和交接语义，尚没有真正的业务节点执行平台。
- **候选：** “类芯片”应先定义节点输入、输出、责任、规则、执行权限和证据合同；可视化连线本身不能成为调度事实。

关键入口：
- [完整迁移说明](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/CF1-MIGRATION.md>)
- [正式 HTTP 接口](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/Components/CrawlerF1/resources/app/workspace/tools/crawler_integration_api.py>)
- [B 站持久执行源码](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/Components/CrawlerF1/resources/app/workspace/tools/run_hermes_bilibili_provider_session.py>)
- [Business Map 规则与来源](<D:/产品孵化器/OpenBP_ ANANTA Mikoshi/References/BusinessMap/bm-sop-review/rules.js>)
- [原项目长期运行验收记录](<D:/产品孵化器/OpenBP_Scrapling/SBS/00ZZZ1_long_task_persistent_execution_and_zero_token_telemetry.md>)

## 2. 阅读清单与覆盖

| 材料 | 本轮覆盖 | 用途 / 限制 |
| --- | --- | --- |
| 根 AGENTS、Constitution/README、SBS/README、SBS-0002、Product BRIEF/CURRENT | 全文 | 调查授权、唯一权威与禁止直接实施 |
| 根 CF1-MIGRATION.md | 全文 | 完整迁移、API、身份、确认与运行边界 |
| C/README.md、MIGRATION.md、SKILLS.md、AGENTS.md | 全文；重复件哈希比对 | 产品包原始说明，不把说明中的命令当本轮执行指令 |
| S/README.md、SKILLS.md | 全文；与 C 对照 | 技能包范围、13 个技能、专家资格 |
| O/README.md、DEV_README.md | 全文 | 原始开发入口及旧叙述；长任务轮询叙述须以后续 SBS 为准 |
| O/integration/README.zh-CN.md、ARCHITECTURE.md | 全文 | 源码接入架构、61 个静态依赖闭包与动态 Worker |
| W/integration/examples/client.py、client.mjs | 全文 | 只连 loopback、禁重定向、超时未知结果不重试 |
| W/config/crawler_f1_hermes_template.yaml | 全文 | 无凭据配置样例；模型默认值是组件现状，不是 Mikoshi 选型 |
| W/config/hermes_execution_policy.json、hermes_bilibili_inventory.json、hermes_expert_brain.json | 全文 | 重试限额、停止条件、训练库存与 shadow 模式 |
| W/config/hermes_data_contract.json | 全文 | 核心追溯字段、原子数据模块和派生分析边界 |
| W/config/hermes_driver_capabilities.json、hermes_expert_registry.json、hermes_browser_profiles.json、hermes_sources.json | 结构与关键资格/资源字段；前两者重点逐项核对 | 不把注册表中的候选能力当实网证明 |
| O/Constitution/ideal_state.md | 目标、原则与 2026-09 升级部分 | 理想状态与已实现边界，不作为上线证明 |
| O/SBS/00ZZZ1…、00ZZZ2…、00ZZZ3…、00ZZZ4…、00ZZZ5… | 目标、状态、实施回签、剩余门；非所有正文逐字审计 | 历史资格、性能、影子建议与 Harness 开发实验 |
| W/tools 关键入口 | API、账号、原子写、锁、事件、B 站库存/流水线/持久 Provider/传输重点源码 | 定位见下文；未声称 114 个模块全部逐行审计 |
| B/原始文稿.docx、智能纪要.docx | 全部正文；核验原件 SHA256 与既有提取清单一致 | 157 / 93 个原段落编号；私人谈话不进入产品规则 |
| B/三方号SOP-芯.pdf | 全部 15 页可提取文字 | 流程、交接、空缺；未逐张检查全部插图 |
| B/【2026新版】三方号审核+MPC+平台活动相关.pdf | 全部 17 页可提取文字；另看第 13、14 页渲染 | 第 14 页图片包含文字提取遗漏的维护口径 |
| B/需求Brif模板.xlsx | 两表全部非空单元格只读提取 | 需求brief、报价单；非重新计算/视觉验收 |
| B/三方号SOP-精简版.txt | 全文 | 简化业务主链与未决项 |
| B/bm-game、bm-town、bm-studio 的 START-HERE.txt；studio/assets/art-direction.txt | 全文 | 三代演练定位与视觉创作来源 |
| B/bm-game/game.js、bm-sop/sop-data.js、bm-sop-review/flows.js、rules.js | 核心业务定义完整阅读；补读输出截断段 | 状态转移、节点语义、规则分层与来源 |
| B/bm-game/play.js、bm-sop/overview.js、bm-sop-review/app.js、bm-studio/app.js、bm-town/world.js | 持久化、呈现与交互关键路径 | 未逐行审阅 WebGL、样式和打包器 |
| B/bm-sop-review/source-manifest.json、tmp/source-audit-20261013/manifest.json | 全文并核验五个原件哈希 | 提取件只是阅读辅助，来源权威仍为原件 |

未覆盖：原目录历史 Raw、账号数据库、环境秘密、Profile、日志和个人数据；完整二进制/供应链审计；ZIP 与解压目录逐字节全量比对；外链腾讯/POPO/飞书材料；全部 PDF 图像与全部代码；本机、服务器或跨主机实际运行验收。
没有把未覆盖项写成通过，也未以老测试数量证明当前运行状态。

## 3. 原件、副本与版本差异

2026-10-18 只读 SHA256 比较结果如下，比较的是包内文件与明确原项目同相对路径。
| 比较范围 | 包内文件数 | 与原项目一致 | 不同 / 缺失 |
| --- | ---: | ---: | --- |
| W/tools | 114 | 114 | 0 / 0 |
| W/apps | 9 | 9 | 0 / 0 |
| W/packages/hermes-agent/skills | 48 | 48 | 0 / 0 |
| W/integration | 5 | 5 | 0 / 0 |
| W/config | 10 | 8 | 2 / 0 |
| S/skills 对 W 规范技能 | 48 | 48 | 0 / 0 |

根 CF1-MIGRATION 与 C/MIGRATION 相同；C/SKILLS 与 S/SKILLS 相同；C、W、O 的 AGENTS 相同。
两个配置差异是：Browser Garage 默认 CDP/控制端口从 9222/9223 改为 19222/19223；能力配置将随包组件的 bundled / dependency 标记置真并改分发说明。
后者没有把 offline/training 资格改成 live；不能因为打包了组件就宣称能力升级。
O/integration 文档描述较早的源码包，不含 EXE/运行时/MediaCrawler；C/MIGRATION 描述后来的完整内部包，两者分发范围不同。
W/integration 只带接口、依赖和客户端五个文件，没有原项目 ARCHITECTURE/README；调研原文需返回 O。
技能包只有规范、参考资料与相关脚本，不携带执行引擎、登录态或独立多 Agent 服务。
B 五个原件与 2026-10-13 manifest 的哈希全部一致；没有另找到可比对的独立 Business Map 原项目。

## 4. Crawler F1 实际组件关系

宿主 → 根 crawler_platform.py → 17 项白名单 HTTP/MCP → hermes_mediacrawler_mcp → 正式 Mission/Hybrid 路由 → Provider/Worker → Raw/标准表/Review/snapshot。
Browser Garage 由 Electron WebContentsView 提供可见页面，CDP 与控制通道、页面租约、Profile 归属共同决定驾驶权。
Scrapling 与 MediaCrawler 是执行依赖；Hermes/经理技能管对话与任务规划；分析技能仅消费终态冻结快照。
独立专家通过 registry、Task/Lane、事件总线、Supervisor、Adapter 与 Provider 连接；此层具有训练和开发候选门，不能与旧采集链混称。
W/config/hermes_driver_capabilities.json:4–18 的实际 Mission 调度仍为 serial、maximum_parallel_platforms=1、bounded_parallel_enabled=false；source 锁只是资源协调基础。各 adapter 的 cross_platform_parallel_eligible 仍 false、parent_parallelism_limit 仍 1（145、235、325、415 行）。
W/config/hermes_expert_registry.json:77 起的 11 专家全部 runtime_enabled=false；B 站为 training_only，其他为 implementation_pending。
因此“13 技能”“11 专家通信身份”“4 个最大并行槽位”不是“13 个生产爬虫 / 11 个可长期自主工作的 Agent”。
O/SBS/00ZZZ5:152–181 记录真实 Hermes AIAgent+Broker+合成 Provider/导入实验；正式 Worker、持久预算/租约、Code Mode、经理经验、实站验收仍未完成。
W/config/hermes_expert_brain.json:3 的模式是 shadow；已接建议不等于允许执行策略，更不等于长期经验已获批准。

## 5. API、任务、身份与持久化实证

| 方面 | 可定位事实 | 对接含义 |
| --- | --- | --- |
| 工具边界 | W/tools/crawler_integration_api.py:34–52 是 17 项白名单 | 使用 provider-neutral 与 designated-page 合同，不另暴露裸引擎 |
| 严格参数 | 同文件:108–150 从函数签名创建 strict/extra-forbid schema | 从当前工具发现读取协议，宿主保留版本指纹 |
| 单实例互斥 | 同文件:80–99、180–205；忙碌返回 409 | 不是持久队列；外层需要受控排队和可见等待 |
| 未知结果 | 同文件:185–201；客户端明确不重试任务修改 | 超时不等于没启动，必须先按原任务对账 |
| 认证与回环 | 同文件:404–452；拒绝 Origin，Bearer 校验 | 只允许节点本机可信后端访问，不直接面向浏览器公网 |
| 交付导出 | 同文件:31–33、约 280–390；限允许路径、500 项、单响应 16 MiB、哈希 | 不等于通用对象库，需另定义大数据、保留与访问合同 |
| 本地账号 | W/tools/hermes_account_scope.py:10–62 用环境绑定和 SQLite project_owners | 有项目归属基础；未配置时 guard 可不启用，不能直接当企业 ACL |
| 启动绑定 | C/crawler_platform.py:162–185 只读核验现有账号及 Hermes Home | 平台必须提供可信身份映射，不能让用户随意填内部 account_id |
| 后台执行 | W/tools/hermes_mediacrawler_worker.py:25–57 启独立进程 | HTTP/模型回合结束不应终止已授权采集 |
| 资源锁 | 同文件:246–388 有 OS 文件锁、source 锁、有序多锁和 case merge 锁 | 是本机进程协调，不是跨服务器租约或租户隔离 |
| 原子写 | W/tools/hermes_atomic.py:89–139、179–198 用临时文件、fsync、replace 和更新锁 | 防局部截断；不等于跨文件事务、跨机复制或完整备份 |
| 事件事实 | W/tools/hermes_mission_events.py:105、174、315 起有锁、hash chain、去重、replay | 可作为适配事件源；HTTP 门面尚不等于可订阅的跨平台事件服务 |

正式任务保留：列项目/建项目 → Recon 与 Draft → 用户范围确认 → 冻结/确认 Contract → prepare login → 真实登录确认 → drive → 本地遥测/单次 inspect → Review/snapshot。
长期 Agent 只能在已授权合同内工作；不能合成确认、复用无关历史授权或从登录头像推断同意。
Collection 和 Analysis 必须保持分离：分析不可补采、改 Raw、改合同或给采集任务自行扩边界。
W/packages/hermes-agent/skills/run-social-listening-mission/SKILL.md:8–35 给出快照、Review、输入哈希、独立派生输出条件。
W/config/hermes_data_contract.json 定义 case/platform/record/run/raw_path 等追溯核心及可选 atoms，适合映射到 Mikoshi 数据合同，不能假装已自动入 Torpedo。

## 6. B 站、重试、限速与缓存

B 站正式路线调用 MediaCrawler，经项目包装器将请求绑定到已租用的 Browser Garage 页面；这不是已获平台授权的官方开放 API 集成声明。
W/tools/run_hermes_mediacrawler.py:729–784 重绑定 BilibiliClient.request/pong；可区分接口错误、公开读取拒绝、登录失效与传输失败。
vendor/MediaCrawler/media_platform/bilibili/client.py:157、188、244 等包含搜索、详情、评论；是否允许执行仍由项目包装器与合同决定，不能按 vendor 全功能开放。
持久 Provider 的 Task/Lane/Expert/Lease/generation/target/host 身份由协议约束；run_hermes_bilibili_provider_session.py:312–349 校验页面、输出和本机连接。
同文件:435–505 每批重新设置输出、pacer、身份、查询与父项结果，防止复用进程时沿用上一批状态。
同文件:169–224、454–462 实现 **同 Provider session/同浏览器租约** 的详情缓存：TTL 300 秒、最多 256 项、AID/BVID 一致性验证、LRU 与来源时间记录。
缓存命中保留 origin_command_id / origin_observed_at；Raw 落盘时间不冒充新抓取时间；此缓存不是跨项目共享知识缓存。
W/tools/hermes_bilibili_inventory.py:81–147 用任务级 SQLite 绑定账号、task、expert、platform、contract hash，BEGIN IMMEDIATE + synchronous FULL。
同文件:228–277 以已核验 importer receipt 幂等提交与推进搜索 frontier；未知动作保留 reserved，不能凭已出现数据推断可安全重发。
同文件:1–5、19 明确评论深度是 15/30/50 bounded replay，不能宣称评论页精确断点续读或全站耗尽。
W/tools/hermes_bilibili_pipeline.py:75–146 先对账 pending import、未知回执和计数回退，再调度；恢复优先于新网络动作。
该库存只对 allow_training 的 B 站新任务冻结启用（inventory.py:54–62），不是所有生产任务已使用。
run_hermes_mediacrawler.py:74–201 的 pacer 有软启动、有界间隔、冷却及风险退避；风险不触发自动绕过或无界重放。
W/tools/hermes_http.py:44–61、272–372 的通用 HTTP 通道有超时、间隔、Retry-After/指数退避、大小/MIME/DNS/重定向约束；不能把它替换所有网页登录路线。
执行策略配置的 max_live_attempts=2、automatic_retry=1 与平台/任务真实停止条件同时约束；不能因外层重试再次刷新内部额度。
原项目 00ZZZ1:29–56 的 2261 评论是旧链历史现场记录，不能给 Expert 签资格。
同文:422–457 记录候选 Expert 实际 63 命令/2 进程/61 复用和中断恢复，但吞吐与深度问题仍阻止 Performance Receipt；本次没有重验原始运行数据。
00ZZZ2:38–52 的离线测试与变异通过不替代实站；00ZZZ4、00ZZZ5 明确仍有资源清理、语义质量、生产接线与经验晋升缺口。

## 7. 面向 40 人与长期 AI 的可靠性缺口

| 缺口 | 当前基础 | 需要的研究/验收，而非已承诺实现 |
| --- | --- | --- |
| 身份与隔离 | 安装令牌、本地账号、项目 owner、页面租约 | 企业用户/服务身份、角色权限、任务 owner 与节点映射；跨账号读写/缓存/日志/事件拒绝测试 |
| 全局调度 | 本机互斥、单账号活动任务、source 锁 | 排队、公平性、配额、任务优先级、节点容量、同账号资源排他；40 人不等于 40 个并发浏览器 |
| 长任务托管 | detached Worker、checkpoint、PID 与 Provider 回执 | 节点重启、进程孤儿、租约过期、重连和升级排空；先复核事实再恢复 |
| 未知结果 | 禁自动重试 mutation、pending/imported 对账 | 宿主 operation_id/幂等键/状态机与查询映射；网络分区和重复提交故障验证 |
| 数据持久化 | 本地 Raw、CSV、JSON、SQLite、hash/review/snapshot | 保存策略、配额、归档、备份恢复、版本、删除与权限；不能用共享目录替代完整治理 |
| 速率控制 | Provider 内 pacing 和批次限制 | 按平台/账号/节点共享限额与熔断，排队等待不能诱发重复任务 |
| 遥测与费用 | 本地 reducer、心跳、经理收件箱、部分成本字段 | 运行/观察/数据时间分离，未知费用标 unavailable；不要用 LLM keepalive 维持采集 |
| Windows 边界 | EXE、Electron、四 Python 环境与可见登录 | 独立 Windows 节点运维、人工接管、重启与升级验收；Linux 重建是另一项研究 |
| 交付消费 | 标准表、Review、snapshot、下载 hash | Mikoshi → Torpedo/业务数据层的 ingest receipt 与 lineage；未发现现成自动接通 |
| 许可与发布 | 包保留许可、MediaCrawler non-commercial 标记 | 实际组织使用/分发适用范围需要核实；打包完整不等于所有许可自动统一 |

## 8. 候选接入合同

输入至少记录：Mikoshi 请求/用户/项目/权限引用、执行节点与本地账号映射、operation_id、工具协议版本、范围和确认记录、Contract hash、任务/会话身份。
长期计划与每次 Mission 分开：周期、软数量、时窗和截止时间可以规划，但每次执行必须符合当前确认合同与登录状态。
输出至少记录：actual_route、task/lane/session/generation、worker/node 身份、状态与原因、真实数量/短缺、最后心跳、最后产出、下一可行动项。
数据交付至少记录：snapshot ID/hash、schema/version、文件 hash/大小、source URL、observed/published/crawled 时间、去重键、原始证据引用和 accepted 规则版本。
失败合同区分：未执行、已受理、执行中、待用户、可恢复、结果未知、部分交付、终态；HTTP 200 只表示返回工具结果，不代表任务成功。
超时/断连先查询同一个任务与回执；只有证明未执行或已明确可恢复，才进入有界恢复；禁止换新 task ID 绕过未知状态。
完成合同要求 job、Lane、Review、snapshot、lineage 一致；“模型结束”“Worker 待命”“页面绿色”均不足以独立证明完成。
权限合同必须让源节点执行实际授权检查；平台层 UI 隐藏字段不是权限边界，也不能把本地无账号模式当共享服务身份。
事件合同采用稳定 sequence、generation、dedupe_key、evidence_ref 与消费回执；重复消息不重复发车、发布或唤醒模型。
这里只定义需补充的边界；API 重试、队列、数据库、消息系统、容器/虚拟机技术栈未决。

## 9. Business Map：已存在什么

| 资产 | 源码/说明 | 已实现与未实现 |
| --- | --- | --- |
| SOP 总览 | bm-sop/sop-data.js:1；overview.js 的 nodes/edges/renderGraph | 结构化节点、角色、步骤、输出、下一环节、来源，SVG 关系与详情；没有业务运行实例 |
| 审核规则版 | bm-sop-review/flows.js:1–4；rules.js:1–17 | 作品、账号、日周月、约稿四组图；规则 ID、来源、适用级别、缺口；不是自动审批引擎 |
| 像素工作室 | bm-studio/START-HERE；app.js:44–50、79–81 | 引导、情境、手册、localStorage；业务结果是模拟值 |
| 3D 小镇 | bm-town/START-HERE:16–23；world.js | 五栋业务建筑、镜头交互；无业务办理、后台或 Agent |
| 3D 业务游戏 | bm-game/game.js:1、8–43、约 88–119；play.js:13、27 | 三案例、版本/退回/回填/复盘纯状态转移与本地保存；无真实网络执行 |

五栋楼是账号中心、需求大厅、内容工坊、发布驿站、数据塔的展示分组，不是公司新组织或五个已部署服务。
game.js 的 create/restore/actions/act 可用作教学演练规则参考；其中盖章、发布和归档是页面状态变更，不会调用真实账号。
类芯片意图可映射为：节点=业务环节；引脚=输入/交付物；连线=交接；门=判定；回路=修改/复盘；这属于设计抽象，不是已有执行内核。
可优先复用的数据思想是规则 ID、来源、适用范围、角色、通过/退回、证据与待确认；不要把 WebGL 场景当通用流程平台底座。

## 10. 业务覆盖与未决项

账号链：入库与双负责人 → 信息维护/试错 → 到期判定 → 继续、换方向重测或回收；历史记录保留，换绑与旧权限终止需留凭据。
内容链：营销派发/供应商自主提案 → 启动条件 → 制作与版本 → 普通/重点审核分流 → 发布链接回填 → 巡检、复盘和归档。
运营节奏：每天 17:00、周一 11:00 本周计划、15:30 上周复盘、次月 5 日前结案；发布后巡检是另一时钟，不能串成单一顺序链。
扩展业务线索包括伏羲专项、KOC、KOL、定向约稿、小喇叭/MPC、供应商比选、线下活动与品牌联动；资料深度不同，不宜合并一种审核或绩效口径。
原会议明确 PM 管进度/责任/卡点，内容判断归业务审核岗位；AI 不能因被称为 PM 就自动拥有审核与账号处置权。
未决：试稿播放 ≥x 万；日常/节点 KPI 表空白；高预算/高预期边界；长期断更天数；“多个账号不达标”数量；实际责任人；月度选题与 Brief 细则。
审核手册图片第 14 页与 SOP 第 14 页的评论数口径不同；已有规则库 P07 正确保留场景差异，不能统一成自动合格线。
需求brief B7/B14 的数量和质量是具体项目要求，CPM≤30 明确仅参考；B7 八月总量与分类合计有差额；报价单未填值/汇总零不是免费报价。
旧手册中的账号操作、通知和处置语句只是历史材料，不构成本轮或未来 Agent 的执行授权；外链操作指引尚未查验。

## 11. 组件取舍与研究出口

建议保留 Crawler 的 Mission/确认/证据/恢复协议及独立执行节点；接入层不要重新发明第二套采集真相，也不要把既有确认门降成模型提示。
建议让业务数据层接收冻结交付与 ingest receipt；再由 Torpedo/知识层消费可追溯副本。是否怎样连接须独立定义，当前未发现已接通证据。
建议吸收 Business Map 的规则与交接数据结构，原演练可作为需求验证/培训材料；真正芯片节点须另定义实例、版本、权限、异常、时间、补偿和验收。
暂不将训练专家、影子建议、Harness 风洞实验或 3D 小镇作为生产长期 Agent 承诺；它们适合候选试验并保留原资格门。
研究出口应分别证明：单节点真实小采集、同任务中断恢复、重复提交/未知结果对账、两用户跨域拒绝、节点重启恢复、配额/排队、快照入库追溯和业务人工判定。
性能出口应测每单位有效数据的时间/费用/重复读取、首次有效产出、并发等待和故障损失；历史评论/分钟仅用于建立对照，不用线性推算承诺 40 人容量。
本报告完成的是材料调查与合同候选；主方案选型、用户裁决和 Claude 实施任务包由 SBS-0002 后续流程承接。
