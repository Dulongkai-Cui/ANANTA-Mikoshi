# Mikoshi 组件手册

维护者：Codex。版本：0.1，2026-10-18，SBS-0004。这是持续维护的现状与接入说明；具体整理结果以[本轮记录](Product/curation/SBS-0004/README.md)为准，产品总体方案仍见[待审Brief](Constitution/Proposals/2026-10-18-MIKOSHI/BRIEF.md)。

## 先看懂这套东西

Mikoshi面向人的入口是**可自行定制的数据首页，以及三方号、KOL、联动管理、创意管理、VPC虚拟社区、整体业务中台六个板块**。下面这些组件给各板块提供共同能力；它们的技术名字不应变成用户必须理解的一套产品分区。

这次整理保留的是能继续开发、检查和运行的资产。现有组件尚未组成一个统一登录、统一权限、统一任务状态的服务器平台；目录规整和离线验证不能当成已经完成这种整合。

| ID / 组件 | 可以把它理解成 | Mikoshi里拟承担的事 | 现在保留在哪里 | 当前成熟度 |
|---|---|---|---|---|
| `workbench` / OpenBP | 人员工作的桌面 | 六板块页面、事项、资料空间、受控操作交互、首页组件的候选基础 | [OpenBP/OpenBP](OpenBP/OpenBP/README.md) | 有产品与局部真实执行；仍有mock/dry-run和未接通能力 |
| `collector` / Crawler F1 | 受控的数据采集站 | B站等渠道采集、任务状态、快照与交付物，服务三方号/KOL/研究 | [Components/CrawlerF1](Components/CrawlerF1/README.md) | 完整Windows便携包；真实登录/采集需单独验收 |
| `collector-skills` / CF1 Skills | 采集站的使用规范 | 让未来Agent通过正式工具合同规划和执行任务 | [Components/CF1-Skills](Components/CF1-Skills/README.md) | 13个技能及分发清单；不是另一个采集服务 |
| `execution` / Harness | 工作Agent的执行器候选 | 模型调用、工具执行、审批、恢复与运行证据 | [OpenBP_Harness](OpenBP_Harness/README.md) | 完整引擎与Studio；多Agent长期托管未完成 |
| `knowledge` / Torpedo | 资料与证据处理中心 | 来源入库、观察/证据、知识治理、研究产物与数据能力 | [OpenBP_Torpedo](OpenBP_Torpedo/README.md) | 有源码、桌面/服务与测试；部分跨组件适配仍缺 |
| `perception` / Kiroshi | 感知与桌面值守研究 | 无API场景的授权感知、纠错与操作能力候选 | [OpenBP_Kiroshi](OpenBP_Kiroshi/README.md) | 文档、合同、探针阶段；没有可启动的生产服务 |
| `virtual-community` / VCPAI | 虚拟玩家研究实验室 | VPC画像、访谈、模拟、研究报告的基础 | [VCPAI研究入口](VCPAI/docs/research/2026-10-07-upgrade-positioning/upgrade-report.md) | 有独立应用和安装包；长期社区与平台权限待接入 |
| `business-map` / Business Map | 规则和业务演练样板 | SOP、审核标准、能力块与培训交互的需求来源 | [References/BusinessMap](References/BusinessMap/BM-SOP.html) | 五个静态原型，不是业务后台 |
| `business-evidence` / 工作盘点等 | 项目的业务依据 | 六板块的原始工作、时间轴、费用、合作与口径 | [工作盘点](工作盘点/00_项目入口/业务全景.md)及根目录原件 | 原始/整理/历史材料混合，具体口径须核对 |
| `legacy-dashboard` / B站与发布V5 | 旧分析与交互参考 | 图表、发布日历、状态表现及历史快照 | [References/BilibiliDashboard](References/BilibiliDashboard/index.html)、[发布V5](发布管理-发布计划、发布日历、发布效果_V5.0.html) | 可看离线页面；不当实时业务事实 |

机器可读位置及保留范围见[components.json](components.json)。以后优先用稳定ID定位组件，物理路径只是当前安装位置。

## 一、工作台：OpenBP

**使用边界。** 复用事项、团队、资料空间、工作协议、业务域、AI员工和界面能力。六板块应共享基础设施与同一份业务状态；现有页面不自动成为Mikoshi最终业务模型。可定制首页需要独立保存成员布局、卡片与筛选，卡片读所属业务域的数据，不能再维护一份真相。

**代码与入口。** 真正主仓是`OpenBP/OpenBP`，前端/后端入口集中在`frontend`。`frontend/package.json`保留开发、生产、数据库、工作协议与合同测试命令；启动前读主仓README及组件规则。当前依赖Next/React、Node、PostgreSQL；OnlyOffice等功能还有相应服务依赖。所保留的`node_modules`与`.next/standalone`让当前离线环境和生产产物不因本次瘦身丢失，但不保证其他机器直接启动。

**正常开发入口。** 在`OpenBP/OpenBP/frontend`按现有配置执行`npm run dev`；开发缓存会重新生成。`npm run start`依赖既有生产构建和服务配置。这里列的是维护入口，本轮没有启动业务服务、迁移数据库或调用外部模型。

**必须保留。** 核心src、scripts、tests、package/锁文件、CAD源与`public/cad-lab`、Front原型、`.bpai`/`.openbp`运行资料、数据库相关实现和现成依赖。JSON文件可能是状态/影子存储，不能按后缀清空。

**本次取舍。** 删除明确开发缓存、隔离测试临时输出、与public字节一致的CAD dist；退役与外部原项目完整匹配、主工程无运行引用的Claude源码/chili3d参考副本。保留CAD公开运行资源和实际项目依赖。细目及恢复限制见[审计](Product/curation/SBS-0004/audit-workbench-business.md)。

**下一次接入必须证明。** 对Mikoshi六板块定义业务对象、操作/权限合同与状态所有者；确认现有mock/dry-run能力，不能把成功界面当真实写回。主仓原位保留，因为运行资料可能带绝对路径；未来迁位应单独迁移数据与环境。

## 二、采集站：Crawler F1与技能

**使用边界。** CF1负责正式Mission、Browser Garage、受控Worker和采集交付物；Mikoshi后端负责人员授权、业务请求、任务展示及入库。不要将爬虫内部数据库当六板块业务主库，也不要绕过正式Mission直接让Agent调用任意抓取器。

**目录。** 原双层解压目录整体展平为`Components/CrawlerF1`。EXE、`crawler_platform.py`、`resources/app/workspace`、四个隔离Python环境、Node/Git、浏览器及引擎一同保留；只移动某个EXE或tools子集会破坏产品。独立技能包在`Components/CF1-Skills`，采集包内规范技能仍保留，分别服务安装分发和运行，不能仅因内容重合删除其中之一。

**维护/启动入口。** 先读[原迁移合同](CF1-MIGRATION.md)和包内MIGRATION。新路径首次使用执行`Check-Environment.bat`，或使用包内Python运行`crawler_platform.py doctor`重定位环境。桌面入口为`CrawlerF1.exe`，受控后端入口为`Start-API.bat`；正式运行仍需要产品激活、已有本地账号和受监督的登录流程。

**后端合同。** 默认loopback `127.0.0.1:8877`，由可信后端使用Bearer令牌访问正式HTTP/MCP。令牌只放受保护配置；不写到前端或注册清单。本轮不启动HTTP、不创建账号、不进行真实采集。现有Mission串行限制和专家启用资格必须沿用，不能从UI并发按钮推断可以并行。

**验证范围。** 移动前后核对全文件SHA-256；随后Doctor可能修改四个`pyvenv.cfg`，属于已记录的环境重定位。离线解析验证只能说明本地依赖可用，不证明任何平台登录或实时采集成功。

**下一次接入必须证明。** 幂等任务ID、请求范围/确认、每个采集节点的并发所有者、超时与恢复、原始交付物→标准化数据→业务写回的可追溯链。优先保留独立Windows节点边界，不把整个运行环境塞进业务Web服务进程。

## 三、工作Agent执行器：Harness

**保留能力。** Codex派生源码、Windows/Linux完整引擎、Studio桌面应用、审批/恢复合同、测试与运行记录。当前Studio只覆盖上游的一部分能力；长期多Agent自治、服务器调度与多人隔离仍需实现和验证。

**目录与入口。** 原位`OpenBP_Harness`；入口`OpenBP_Studio.cmd`和`apps/openbp-studio/launch.py`。当前运行策略涉及WSL/Linux引擎，Windows EXE并非可以随意替换的唯一依赖；保留两套完整解包引擎及各自资源。

**本次修复。** 桌面分发包的`resources/openbp-workspace.json`原来绑定工作区外的旧项目，现修到Mikoshi内本副本。源码构建器本来就按自身目录计算根，无须加入新的机器硬编码。[修复记录](Product/curation/SBS-0004/repair-harness-binding.md)保留验证与重建方法。应用私有`.data/codex-home-wsl`保留，与用户的全局CODEX_HOME区分；正常初始化会更新应用自有运行配置，本轮不替用户启动旧会话。

**本次取舍。** 两个已与解包文件逐项核对的tar.gz归档可删，实际bin/资源不删；开发构建暂存与可再生pyc可清。`.data`会话、上传、草稿、SQLite、私有home、测试证据、Rust源码、NOTICE/许可和node_modules全保留。

**下一次接入必须证明。** 工作Agent稳定身份、受限工具、预算、审计与暂停/恢复；同一任务只有一个明确的调度/重试所有者。先对任务合同做适配，不能让Studio与未来中台同时抢同一执行状态。

## 四、知识与证据：Torpedo

**保留能力。** 来源、证据、知识治理、观察与产物、持久任务、研究与感知/OCR实现。`torpedo`、`tests`/fixtures、`docs`、最新STEP_BY_STEP与打包锁一并保留；旧OpenHarness-main只是带许可的参考源码，不是顶层Harness的已接通替身。

**目录与入口。** 原位`OpenBP_Torpedo`，开发入口`Dev.bat`，运行环境`.venv`，可选OCR worker在`dist/torpedo-fast-ocr-worker.exe`。`.venv`基于本机Python且47个包装入口含绝对路径，当前不为统一目录树而搬仓。维护检查优先使用`.venv/Scripts/python.exe -m ...`，不要假设`pytest.exe`等包装器可移植。

**本次取舍。** 删除已确认有源文件的25个pycache目录及pytest缓存；保留`data`数据库、全部源码/测试、`.venv`和OCR EXE。`scripts/__pycache__`有4个找不到源码的历史探针字节码，整个小目录保留，登记为需要后续判定的遗留资产。

**离线检查。** `scripts/check_architecture_health.py --root <本仓绝对路径>`检查源码架构基线；它不等价于业务、OCR模型或所有研究适配器通过。`Dev.bat --check`也可能读取运行配置，不作为纯文件校验命令批量执行。

**下一次接入必须证明。** 标准Source/Artifact/Evidence标识、来源版本、权限传递、派生链、可重复入库与失败恢复。业务对象的正式审批/发布状态由业务域负责，不能由知识抽取结果直接改写。

## 五、感知研究：Kiroshi

全库仅约0.46MB，没有值得冒风险删除的大包。保留产品理想、桌面值守/感知合同、视觉实验和探针证据；当前没有生产执行入口。工作区之外的模型缓存或Ollama环境不在本次操作范围。

未来只有在场景确实缺少API时才评估感知/桌面操作，并给出允许窗口、输入/截图数据边界、可中断与纠错合同。不要把这份研究仓描述成已经24小时值班的Agent。

## 六、VPC虚拟社区基础：VCPAI

**保留能力。** 独立应用、画像/虚拟玩家、访谈、群体模拟、研究报告、源数据库、前后端源码、测试、打包脚本及离线依赖。当前工作分支见[仓库表](REPOSITORIES.md)，不能自动切回较旧的main。

**目录与入口。** 原位`VCPAI`；Windows现成分发包保留`release/windows-native/dist/VPC-AI-Setup-2.0.7.exe`。它是安装器，本轮不执行安装。源码运行/打包按仓内实际README与`release/windows-native`说明；不是另造一套根目录启动脚本。PostgreSQL vendor与其归档保留，确保重建和现有离线条件不被破坏。

**本次取舍。** 删除过期2.0.4/2.0.5/2.0.6安装器、与保留最新安装包/源数据有明确关系的构建stage及installer-source。旧版本安装器不再有本工作区逐字副本，不能称为与最新版本完全相同；版本回退需原始版本的源码、构建条件或外部归档。最新安装器和真实数据保留。

**绝不混入缓存。** 209份未跟踪研究成果及7个大文件逐项SHA-256核对保留，未上传Git。`database`、实验/研究数据、测试合同与旧Git备份均保留。打包stage里的数据库副本可以清理，不意味着源数据库可以删除。

**下一次接入必须证明。** 虚拟玩家是模拟对象，工作Agent是企业执行身份，二者不能共享工具权限；模拟反馈需标注来源和不确定性，不能伪装成人类反馈。多人权限、WebSocket边界、研究任务恢复、长期演化与真人校准仍需专项验证。

## 七、业务原件和参考原型

工作盘点完整保留原位，包括已有三个阅读登记修改；不因跨文件重复、体积大或目前用不上而清除演示PPT、会议和历史版本。根目录的三方号docx、进度xlsx、发布V5也保留原路径，避免已有索引失效。

Business Map归入`References/BusinessMap`，保留原文稿、纪要、PDF、模板、五场景源码和预览；仅删除已与保留内容比对一致的三个ZIP副本。B站分析快照六文件整体放入`References/BilibiliDashboard`。两个旧在线启动器的缺失后端是整理前的问题；本轮保全原件并明确限制，没有假装修好了实时服务。

这些材料向六板块提供业务依据和交互想法，后续应提炼进PRD/能力合同，不能直接把静态页面中的种子指标迁成真实业绩。

## 八、位置、恢复与Git责任

| 分类 | 维护方式 | 恢复边界 |
|---|---|---|
| 顶层治理、手册、注册、动作清单、原有跟踪资料 | 根Git仓 | 正常commit/push；不包含子仓与大运行数据 |
| OpenBP/Harness/Torpedo/Kiroshi/VCPAI/工作盘点 | 各自独立Git，路径见注册表 | 克隆代码不能恢复忽略运行状态、数据库、完整运行包 |
| CF1完整包、独立技能与Business Map本地原件 | 注册清单+本地校验/迁移记录 | 本轮保留本地；未新建外部备份或上传全部原始资料 |
| `_git_backups` | 本地恢复材料，保持忽略 | 可能含旧凭据和私有refs，保留、不mirror、不公开分发 |
| `.local/curation/SBS-0004` | 逐文件库存/动作快照/哈希与日志 | 本地审计记录；摘要和规则随根Git，完整文件名账本不上传 |

精确删除项在本轮`actions-*.json`，每项附理由和恢复条件；恢复参考源码前再次核对原件SHA。删除可再生缓存不保留逐字副本；删除旧发布产物也不承诺重建出同一二进制。移动有完整SHA守恒记录，可按映射反向移动。

保留的运行组件许可文件和原激活机制全部保留；退役参考副本的许可、来源与恢复位置保留记录。第三方依赖的原许可证继续适用，内部迁移不等于增加公开发布权；具体再分发由相应组件已有合同约束。

## 九、以后怎样维护这份手册

每次组件新增、移动、裁剪、升级或接入，都在同一SBS更新本手册、`components.json`、相关仓库表和验收证据。注册表记录位置与事实，不放密钥、Cookie或完整业务数据。

一项组件接入至少交付：输入/输出与状态合同、身份权限、依赖/数据所有者、启动和部署方式、错误/幂等/重试/恢复、观测与预算、迁移/回滚、通过与未通过的真实验收。先有执行包和标准，再写适配代码。下一个SBS由实际产品优先级决定，本轮整理不自动启动六板块的业务开发。
