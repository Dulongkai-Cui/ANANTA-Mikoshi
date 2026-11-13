# SBS-0004：Crawler F1 / VCPAI 保全与精细删减审计

日期：2026-10-18。审计方式：本地只读源码、Git 状态、文件元数据、CRC32 / SHA256 与离线归档测试；不运行爬虫、模型、登录、安装器或服务。
本报告原路径均相对 `D:/产品孵化器/OpenBP_ ANANTA Mikoshi`；后续执行前以动作清单及现场路径为准。
允许额外写入的证据为 `.local/curation/SBS-0004/vpc-preservation-before.json`，动作清单为 `Product/curation/SBS-0004/actions-crawler-vpc.json`。

## 1. 结论与保护线

- 保留完整 CF1 运行包及独立技能包。ZIP 只有在全量内容一致证据成立后才作为重复分发容器删除；不把运行时误当依赖缓存。
- VCPAI 主要可回收空间来自过期安装器及构建暂存；保留最新 `2.0.7` 安装器、源码、锁文件、`vendor/postgres`、本机依赖和全部研究/数据库。
- VCPAI 的 209 个未跟踪文件和 7 个大文件不是 Git 可恢复的普通缓存；216 文件共 **6,648,435,532 B**，本次全量 SHA256 与 SBS-0001 记录一致，0 差异。
- 旧 `2.0.4/2.0.5/2.0.6` 安装器是过期版本，不声称与最新版本逐字相同；删后不再承诺恢复这三个旧安装器的原始字节。
- CF1 仅能整体搬迁内层目录，不能拆开 EXE、resources、四套 venv、引擎、工具与技能。父任务已选择 `Components/CrawlerF1` 和 `Components/CF1-Skills`；移动后的离线验证另记。
- VCPAI 暂不为目录美观整体搬动：其独立 Git、本地研究路径、开发入口与原生安装产物仍需共同保持。

## 2. 库存与 Git 归属

| 路径（审计前） | 文件/字节 | Git 与处理 |
|---|---:|---|
| `CrawlerF1-CleanComplete.zip` | 908,408,342 B | 根仓库未跟踪；等待本报告末尾全量 ZIP 结果 |
| `CrawlerF1-CleanComplete/CrawlerF1-CleanComplete` | 48,774 文件；2,464,028,923 B | 根仓库未跟踪的完整离线迁移包；保留并整体移动 |
| `CrawlerF1-Skills.zip` | 184,783 B | 根仓库未跟踪；52 文件全量大小/CRC32/SHA256 一致，可删容器 |
| `CrawlerF1-Skills/CrawlerF1-Skills` | 52 文件；500,289 B | 保留独立注册接口包，整体移动 |
| `VCPAI` | 90,851 文件；40,636,212,639 B（含 .git） | 独立 Git，根仓库忽略；不改变分支或历史 |
| `VCPAI/release/windows-native` | 53,020 文件；28,364,741,270 B | 仅 7 个构建源码/文档文件受该仓库跟踪；大产物被忽略 |
| `VCPAI/release/windows-native/vendor/postgres` | 20,214 文件；859,969,301 B | 离线构建及运行所需原生依赖；保留 |
| `VCPAI/release/windows-native/vendor/postgresql-16.14-1-windows-x64-binaries.zip` | 325,739,757 B | 本次未证明与 vendor 解压全集一致；保留，不进删除清单 |

VCPAI 当前分支 `codex/player-upgrade-positioning-20261007`，HEAD `8f186ce5198d98adb50fb998ab04861a0d7acb17`；不能切换旧 main 代替当前产品。
全集规模采用 `.local/curation/SBS-0004/before-files.csv.gz` 及本次独立只读遍历核对；统计不代表可删除许可。

## 3. CF1：完整运行包不能拆

`clean-complete.json:4-22` 声明由不可变运行时清单导出，并已排除旧版本、测试套件、编译缓存、凭据、账号数据库、浏览器资料和采集结果；这是已做过清理的交付包。
`component-inventory.json:53-67` 标注内部迁移分发、源工作区非 clean 快照；不能仅通过一个 Git commit 声称可完整重建。
`crawler_platform.py:39-76` 按包内相对目录加载下列共同依赖，缺失即拒绝启动：

- `CrawlerF1.exe`、Electron DLL / pak / snapshot / locales / resources 与运行许可证公共材料。
- `resources/crawler-f1-portable.json`、发布清单、组件清单、Skills 清单及完整性校验材料。
- `resources/runtime/python`、`node`、`git`、Hermes 源码和 Scrapling 源码。
- `resources/runtime/{hermes-venv,pitwall-venv,scrapling-venv}` 及 `resources/app/workspace/vendor/MediaCrawler/.venv`。
- `resources/app/workspace` 下 tools / apps / config / integration / vendor / packages 与对应原生库。
- 所有第一方/第三方许可证、README、MIGRATION、AGENTS、SKILLS，以及版本/来源证明。

启动入口为 `CrawlerF1.exe`；`Check-Environment.bat:3` 调用包内 Python + `crawler_platform.py doctor`；`Start-API.bat:3` 是本机 API 入口，**本次没有启动 API**。
许可证需区分：根 `LICENSE` 是 Electron MIT 文本，不能代表整个 CF1 授权；`packages/hermes-agent/LICENSE_INTERNAL.txt:5-12` 限定授权人员内部非商业评估，并保留 Hermes MIT、Scrapling BSD-3-Clause、MediaCrawler Non-Commercial Learning License 1.1 的各自条件。
保留包不等于获得新商业授权，也不等于登录、授权、正式专家资格或真实采集已经通过。

### 搬迁与 Windows venv

`crawler_platform.py:111-129` 仅修正四个 `pyvenv.cfg` 的 home，并去掉旧 executable / command / include-system-site-packages；不会重新下载或重装依赖。
本次静态检查四个 `pyvenv.cfg` 的 home 均为 `__CRAWLER_F1_PYTHON_HOME__`；四个 Scripts 目录均仅含 `python.exe` 与 `pythonw.exe`，没有 pip/console/activate 的旧绝对包装入口。
四个 venv 的全部 `.pth` 未发现 Windows 绝对盘符路径。结合 `%~dp0` 启动器，可支持**保持内部布局的整体内层搬迁**；不能据此承诺任意拆分或全部二进制内部无路径假设。
移动前后由父任务核对全文件大小/SHA256；随后运行 Doctor。Doctor 会修改四个 pyvenv.cfg，因此应把它与移动哈希验证分成前后两个阶段。
Doctor 的成功范围仅是包内导入、schema、离线运行探针；`crawler_platform.py:256-260` 明确排除浏览器、登录、采集与激活。

## 4. 独立 Skills 与内置副本

独立包 `skills/**` 共 **48 文件、482,179 B**，逐文件 SHA256 全部等于完整包 `resources/app/workspace/packages/hermes-agent/skills/**`。
独立 `SKILLS.md` 与完整包根 SKILLS.md 一致；独立 LICENSE_INTERNAL 与完整包 packages/hermes-agent/LICENSE_INTERNAL 一致。
独立 README 290 B 和 skills-manifest.json 9,316 B 不与已检查的同名根/内置位置逐字一致；它们描述单独注册/分发用途，不能因 48 个技能相同便删掉整个独立包。
`CrawlerF1-Skills/.../README.md:3-4` 明确：独立包供新平台注册相同技能；执行引擎、Browser Garage 与运行环境来自完整包。
因此保留 0.50 MB 独立技能目录有明确接口价值；删除已全量验证的 0.18 MB ZIP，不删技能目录。
技能 ZIP SHA256：`5a4494f1ae528173ee2a805fc4213921c71c7731521e27a6a6295e8355996851`；52/52 文件大小、ZIP CRC32、磁盘 CRC32、双方 SHA256 一致，缺失/额外/重复 entry 均 0。

## 5. VCPAI：209 个未跟踪文件的用途与恢复边界

| 未跟踪目录 | 文件/字节 | 证据及用途 |
|---|---:|---|
| `experimental/research/2026-10-07-four-direction-positioning` | 71 / 172,169,078 B | 研究 campaign、冻结队列、API 账本、分析/审计/构建脚本、PNG/XLSX 结果 |
| `outputs/01a1149c-50d2-7a70-a2bc-135fa71893b9` | 98 / 125,113,803 B | 三方向定位 HTML/XLSX、汇报版、研究和图表支持脚本、分析/编辑/核对材料、邮件素材 |
| `outputs/01a1152f-680a-7411-8fb2-199e385a0e6b` | 40 / 17,686,736 B | 四方向定位 HTML/XLSX、问卷与方案、交付说明、支持材料、邮件素材 |

第三目录另有被忽略的 XLSX inspect.ndjson（33,363,784 B），不在 209 文件内；本次未将其当作普通缓存删除。
四方向 `campaign.mjs:8-12,26-35` 读取三方向历史冻结 cohort，并验证 hash、2,741 人唯一性和增强来源。研究文件间有直接依赖，不能只保留最终 HTML。
`analyze.mjs:29-30` 和 `audit-results.mjs:22-25` 继续验证冻结 cohort；账本/原回执/中间分析是复核研究结论的依据。
本次 209 文件 SHA256 全部等于 SBS-0001 保全记录；且与 **只读原件** `D:/产品孵化器/VCPAI` 同相对路径的 209 文件 SHA256 全部一致。
原件可作额外恢复源，但不因此删工作区研究；没有逐行输出个人画像、原始聊天或 API 凭据。
该结论是研究来源与文件保全判断，不把已有模型研究结果当作真实人群调查，也不重新调用模型。

## 6. VCPAI：7 个大文件必须保留

| 路径（相对 VCPAI） | 字节 | 用途/依赖 |
|---|---:|---|
| `database/duckdbs/db.duckdb` | 2,472,554,496 | 本地原始/分析数据库；backend 检查脚本及历史 persona 审计引用 |
| `database/duckdbs/finalpersona.duckdb` | 3,424,923,648 | AI 导航服务实际读取，`aiNavigatorV2.js:137,561` |
| `database/raw_persona_profile/player_profile.csv` | 56,330,372 | 原始玩家资料来源；不因已有 DuckDB 就假设可逆重建 |
| `experimental/research/2026-10-07-upgrade-positioning/results/base-cards.jsonl` | 85,296,658 | `enhance.mjs:14` 冻结卡片；`campaign.mjs:36` 构建后续实验 |
| `experimental/research/2026-10-07-upgrade-positioning/results/campaign-cohort.jsonl` | 121,913,276 | 冻结增强 cohort；三/四方向研究及 workbook hash 校验依赖 |
| `explanatory_memorandum/Picture_Assets/AI玩家社区全流程视频.mp4` | 117,241,246 | 产品演示原始媒体，非可无损重建编译产物 |
| `explanatory_memorandum/Picture_Assets/工作台全流程视频.mp4` | 55,206,219 | 产品演示原始媒体，保留 |

这 7 文件被精确 `.gitignore` 排除，SBS-0001 从发布历史中过滤；远端干净 Git **不是**它们的恢复来源。
本次全哈希证据 `.local/curation/SBS-0004/vpc-preservation-before.json` 记录 216 个相对路径、字节与 SHA256，不含文件正文；全部与前次记录匹配。
旧 Git 备份可能包含旧凭据，保留但不可镜像发布，也不可为节省空间顺手删除。

## 7. VCPAI 构建产物：可删除依据

| 候选 | 字节 | 判断 / 恢复来源 |
|---|---:|---|
| `release/windows-native/dist/VPC-AI-Setup-2.0.4.exe` | 3,998,721,319 | 过期分发版本；保留 2.0.7；不承诺旧版原字节恢复 |
| `release/windows-native/dist/VPC-AI-Setup-2.0.5.exe` | 3,998,721,280 | 同上，不称为重复字节 |
| `release/windows-native/dist/VPC-AI-Setup-2.0.6.exe` | 3,998,720,835 | 同上，不称为重复字节 |
| `release/windows-native/build/installer-source` | 3 文件 / 3,996,763,702 | 全部包含于保留的最新安装器/其 payload；可恢复；亦可重建 |
| `release/windows-native/build/stage` | 32,791 文件 / 7,186,997,305 | 等待末尾全量 payload CRC 清单核对通过后进入动作清单 |

旧三个版本合计 **11,996,163,434 B**；在 VCPAI 文本源码/脚本/文档搜索未发现对三个旧安装器的引用。
保留 `dist/VPC-AI-Setup-2.0.7.exe`（3,999,065,591 B），不能删掉全部安装器后仅称“npm 能重建”。
`Build-WindowsInstaller.ps1:18-29,311-358` 明确 build 是从源码、frontend build、backend+node_modules、本机 Node、vendor PostgreSQL 和 database 生成的暂存；构建会 Reset-Directory BuildRoot。
该脚本依赖本机 Node/npm、7-Zip、C# compiler；因此“源码可重建”是有环境前提的恢复，不保证现时构建输出和旧版本字节相同。
本次 stage/database **4,665 文件 / 6,115,163,843 B** 全部与当前 database 逐文件大小/SHA256 一致；stage 独有数据 0、内容差异 0，当前源码另有 2,745 文件未包含在旧 stage。
stage 全树未发现 `var/`、`logs/` 或 `.env` 文件；没有运行后 PostgreSQL 数据或本地登录配置混入暂存的证据。
读取安装器末尾公开格式（`VpcAiSetupBootstrapper.cs:84-160`）而未执行安装器，核实内嵌 payload 与磁盘 payload：

- PAYLOAD_OFFSET=180224，PAYLOAD_LENGTH=3996412726；两者 SHA256 同为 `eb1f6ffb1db65c746b681c3966ade9795129b3ad2450c5aa1e0fa455b83b0d8a`。
- `7z t payload.7z -bso0 -bsp0` 实际执行，退出 0、无错误输出，压缩数据完整性通过。
- installer-source/bootstrapper.exe（180,224 B）SHA256 与最新安装器相同长度前缀一致。
- installer-source/app-icon.ico（170,752 B）与 stage 内图标 SHA256 一致；图标能从保留安装器内嵌 payload 恢复。
- `Build-WindowsInstaller.ps1:429-456` 和 bootstrapper:24-33 明确记录 payload/7z.exe/7z.dll 的组合与提取格式；恢复时只解包，不执行安装器。

保留 `.tmp-chrome-skilltree*` 三组浏览器 profile（约 37.6 MB）：名字表明临时用途，但未确认是否仍被浏览器占用/含唯一会话，本次不纳入删除。
保留 `script_cache`（3 文件 / 29,138 B）：`FrontAll/docs/implementation-roadmap.md:226-228` 引用其中算法/设计，不把目录名视为可删依据。
保留 FrontAll 两套 node_modules、前端 build、全部 DB、研究、截图和演示；本轮不扩大成依赖清空。

## 8. 启动、许可证与离线验证

VCPAI 开发根 `启动.bat:3-4` 依赖当前工作目录 `cd FrontAll; npm run dev`，不是以自身路径定位；`install.cmd` 只写临时测试标志，不能当安装流程。
前端 `FrontAll/package.json:60-62` 为 Vite dev/build；后端 `FrontAll/backend/package.json:6-23` 用 Node、PostgreSQL、DuckDB 等。不要为验证执行 check:deepseek、check:kimi 或 smoke:user。
原生运行入口是**安装后的** Start-VPC-AI.ps1；`release/windows-native/README.md:6-13,64-81` 说明需要完整 app/runtime/database 与 var；不能把源码 scripts 目录当可直接运行的安装根。
当前 VCPAI Git 跟踪清单未发现项目级 LICENSE/NOTICE；private package.json 不等同于授权条款。保留已有依赖许可证，不臆造 VCPAI 可商用/可外发许可。

父任务移动后建议执行（此处命令不启动账号、浏览器、API 或爬虫）：

```powershell
& '.\Components\CrawlerF1\Check-Environment.bat'
& '.\Components\CrawlerF1\resources\runtime\scrapling-venv\Scripts\python.exe' -I -B -c "from scrapling.parser import Selector; s=Selector('<html><body><h1>Mikoshi offline</h1></body></html>'); assert s.css('h1::text').get() == 'Mikoshi offline'; print('offline parser PASS')"
```

第二条在 Doctor 修正 pyvenv.cfg 后执行，只解析内存 HTML。不要使用 Fetcher、浏览器启动、真实 URL 或模型客户端。
VCPAI 可离线执行 `node --check` 检查指定后端/研究脚本语法、核对 package-lock 与保留目录存在；不运行启动或安装脚本。
可用 `powershell -NoProfile -File .\VCPAI\release\windows-native\Build-WindowsInstaller.ps1 -CheckOnly` 读取构建前置依赖（会报告本机路径）；该命令不等于完成构建或功能验收。
删除后必须重新计算 216 文件 SHA256 与 before JSON 比较；保持 VCPAI HEAD/branch、不增加跟踪改动，并验证最新安装器/vendor/源码/锁文件仍在。

## 9. 完成范围与待追加结果

已完整阅读 CF1 入口/清单、独立技能说明与许可证、VCPAI 原生打包 README/关键构建与恢复源码；核查上述数据依赖、Git 状态和研究生成链。
未执行产品、数据库查询、登录、激活、真实采集或模型；不逐条读取研究对象资料；未验证每个历史安装器功能，也未验证 vendor PostgreSQL ZIP 全集等价性。
本报告不执行删除/移动，动作清单由父任务统一验证绝对路径、生成恢复说明、执行与留证。
全量 CF1 ZIP、stage↔payload CRC 以及搬迁后 Doctor 结果在下方追加，未通过前不把对应候选视为完成。

### CF1 全量归档校验结果

- 完整 ZIP 的 48,774 个文件 / 2,464,028,923 B 全部与解压包同大小、同 CRC32、同 SHA256；缺失、额外、差异、重复 entry 均 0。
- ZIP SHA256：`c7e8f3c76a3098fc4e24ddec4aef19fc52004e99cfeff99d74745cda775ad852`。校验全量读取 ZIP 数据（同时验证 ZIP 自身 CRC），未运行包内程序。
- CF1 大 ZIP 已加入删除清单；父任务可按既定方案整体移动两个内层目录。保持内部布局并完成搬迁哈希验证后，再进行 Doctor / 本地 HTML 解析验收。

### VCPAI stage 全量可恢复性结果

- `payload.7z` 清单与 stage 全树均 32,791 文件，全部路径/大小/CRC32 一致：32,725 个 ASCII 路径首次校验通过，66 个中文路径使用 `7z l -slt -sccUTF-8` 重新解码后全量 CRC 校验通过。初次列表的本地编码误解码已经排除，不是实际缺失文件。
- 最终缺失 0、内容差异 0、stage 额外文件 0。结合 payload 与保留 2.0.7 内嵌内容同 SHA256、完整 7z test 成功，stage 全部内容可以从保留安装器恢复。
- stage 已作为第 7 项加入 actions-crawler-vpc.json。7 项总删除候选字节为 **24,088,517,566 B**（约 24.09 GB / 22.43 GiB）；此为可执行候选，不声称本审计已删除。
- stage 的结论使用全部文件的大小+CRC32、压缩容器 SHA256 和压缩数据完整性测试；另外独立核验了全部数据库副本 SHA256。没有把 stage 所有文件都称为逐文件 SHA256 比较。

### 搬迁与删减后验证

父任务已执行 7 项删除并完成两个内层目录的整树移动/哈希核验。随后 Doctor 17 项全部通过、内存 HTML 解析通过；仅四个 pyvenv.cfg 出现授权内的路径修复。VCPAI 216 文件全量 SHA256、HEAD/branch、最新安装器 payload 和 vendor/构建源/锁文件保全通过。详见同目录 `verification-crawler-vpc.md`，包含所有文件变化和最后一次两个组件全文件 SHA256 复核。
