# SBS-0004：OpenBP 工作台与业务资料整理审计

审计日期：2026-10-18；审计人：Codex 业务/OpenBP 分工；性质：只读候选审计，**不是操作完成回执**。

初始范围为只读审计。随后在同一 SBS-0004 下追加授权：写入删除 manifest，独立审查执行脚本，进行无后端副作用的离线检查，并限定修改 OpenBP 子仓退役来源文档及活动导航。未删除、移动、改写业务原件、运行数据或工作盘点来源索引，未运行产品、数据库迁移、采集、模型调用及联网安装。执行者仍须在实际变更前复核文件占用、路径边界和基线是否变化。

## 1. 结论与基线

- 建议保留 `OpenBP/OpenBP` 原物理位置，不为统一成 `components/workbench` 强行迁移当前运行组件。
- 优先清理 Next 开发缓存、可再生测试输出、CAD 重复构建目录、不接入运行的 Claude/Chili 参考副本，以及已逐项证明重复的 Business Map 分发 ZIP。
- 本报告建议删除项合计 **856,623,588 字节，约 817 MiB**；保留 Claude 来源说明时需减去相应文件字节。不是已回收空间，也不包括移位产生的空间变化。
- 已确定：Business Map、B站离线演示分别整树规整到 `References/BusinessMap`、`References/BilibiliDashboard`；根业务 DOCX/XLSX/HTML 与 `工作盘点` 原位完整保留，避免既有阅读登记路径失效。
- `.next/standalone` 是完整分发运行包；`frontend/node_modules` 是当前开发/本机运行依赖；`.bpai/.openbp` 是运行事实和成果。三者均不能按缓存一概删除。

字节口径为文件逻辑长度，不是磁盘实际分配空间。目录计数包括隐藏文件；不跟随 reparse points。复用根库存 `.local/curation/SBS-0004/before-summary.json` / `before-files.csv.gz`，并对候选独立统计、Git 查询、原件哈希及依赖抽查。

| 资产 | 文件数 | 字节 | Git 基线与已有修改 |
|---|---:|---:|---|
| `OpenBP/OpenBP`，包含自身 `.git` | 74,659 | 3,461,049,713 | `main@54e2c53a035fe0049c8fb3d6e0290a9690c3268b`；跟踪和未跟踪状态干净，存在大量 ignored 数据 |
| `OpenBP_Business Map` | 115 | 42,818,687 | 无独立仓；根仓下全部 115 文件未跟踪，不能把根提交当备份 |
| `无限大B站数据系统` | 6 | 48,048,560 | 根仓 6 文件已跟踪，检查时干净 |
| `工作盘点`，包含自身 `.git` | 4,124 | 5,564,658,295 | `main@446ebb458d2ddb0e0c891ca04378726c828cfd84`；入口登记 3 文件已有修改，必须保留 |

`工作盘点/00_项目入口/{文件扫描.json,文件索引.md,阅读登记.json}` 的现有修改不是本审计产生。OpenBP 的 Git 只覆盖源码等跟踪文件；ignored 文件不能仅凭该提交恢复。

## 2. 可以执行的删除候选

下表的绝对路径均在用户授权工作区内。对 ignored 或未跟踪项目，执行前保存逐文件清单；对不可逆删去的唯一审计证据，应先另行保全。本表不授权越界清理只读原项目。

| ID / 绝对路径；相对路径 | 文件数 / 字节 | 跟踪状态 | 建议、依赖证据与恢复 |
|---|---:|---|---|
| W01 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.next\dev`；`OpenBP/OpenBP/frontend/.next/dev` | 1,114 / 668,354,257 | ignored；主仓无未提交跟踪修改 | 可删除开发构建缓存；`package.json:6` 为 `next dev`，与生产 `.next/server/static/standalone` 分开。无正在使用此目录的开发进程时处理；保留源码与 node_modules 后由 `npm run dev` 再生。未承诺下一次启动不需要环境配置。 |
| W02 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.next\cache`；`OpenBP/OpenBP/frontend/.next/cache` | 3 / 333,360 | ignored | 可删除可再生构建缓存；不连带删除 `.next` 根 manifests、BUILD_ID、server、static、standalone。下次 build/dev 再生。 |
| W03 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.bpai-test-runtime`；`OpenBP/OpenBP/frontend/.bpai-test-runtime` | 1,863 / 3,783,429 | ignored | 可删除已隔离测试运行输出；先保全需要留作验收证据的报告。`scripts/openbp-test-runtime-cleanup.mjs:9–17,22–28` 明确只允许两个 test-runtime 目录；相关 smoke/harness 重跑产生新记录，旧记录不会原样再现。 |
| W04 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.openbp-test-runtime`；`OpenBP/OpenBP/frontend/.openbp-test-runtime` | 224 / 3,362,056 | ignored | 同 W03；不能扩展匹配到 `.openbp`。清理脚本本身会实际 rm，无 dry-run，本审计未运行。 |
| W05 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\cad-lab\dist`；`OpenBP/OpenBP/frontend/cad-lab/dist` | 7 / 18,861,499 | ignored | 可删除重复中间产物；7 个相对路径和 SHA256 全部等同 `frontend/public/cad-lab`，无双方独有文件。保留后者供 `/cad-lab/index.html` 使用。`cad-lab-publish.mjs:8–13` 证明发布复制方向；`npm run cad:lab:build` 可再生。 |
| W06 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\Claude源码`；`OpenBP/OpenBP/Claude源码` | 6,850 / 116,465,170 | 4,002 tracked + 2,848 ignored；无未提交修改 | 可退役整个非接入参考副本；运行入口扫描未发现 import/build/Docker 依赖，但架构说明引用它，需补退役来源映射并保留 README 版权/用途说明。当前所有文件均在外部原件逐 SHA 匹配；源码还可由上述 OpenBP Git 提交恢复，ignored node_modules 只能由原件恢复。不是可直接接入的官方开源 SDK。 |
| W07 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\tmp_chili3d_official`；`OpenBP/OpenBP/tmp_chili3d_official` | 592 / 40,313,865 | 主仓整体 ignored；嵌套 Git 干净 | 可退役未接入 CAD 参考树；与外部同名原件逐路径/大小/SHA 完全相同，包含嵌套 `.git`。运行入口无该目录引用；当前 CAD 走 @mlightcad 依赖，不能连带删当前 CAD 依赖。保留原件及 LICENSE 来源登记。 |
| W08 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP_Business Map\BM-block-town.zip`；`OpenBP_Business Map/BM-block-town.zip` | 1 / 38,197 | root untracked | 可删除重复分发包；全部 6 条目 SHA 与保留 HTML、bm-town 源文件相同。`bm-town/package.py` 能重建等价内容 ZIP。 |
| W09 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP_Business Map\BM-business-game.zip`；`OpenBP_Business Map/BM-business-game.zip` | 1 / 89,166 | root untracked | 可删除重复分发包；全部 11 条目 SHA 与保留 HTML、bm-game 源文件相同。`bm-game/package.py:3–15` 重建。 |
| W10 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP_Business Map\BM-pixel-studio.zip`；`OpenBP_Business Map/BM-pixel-studio.zip` | 1 / 5,022,589 | root untracked | 可删除重复分发包；全部 9 条目 SHA 与保留 HTML、bm-studio 源文件相同，根 START-HERE 与 bm-studio/START-HERE 匹配。`bm-studio/package.py` 重建。 |
| W11 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\frontend`；`OpenBP/frontend` | 0 / 0 | 无 tracked/untracked 文件 | 可删除外层空壳目录；只有 15 个后代空目录，不是内层正式 frontend。删除前再次验证确实无文件、无 reparse points。 |
| W12 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\SBS_Planandaccept`；`OpenBP/SBS_Planandaccept` | 0 / 0 | 无 tracked/untracked 文件 | 可删除外层空目录；不要误删内层 `OpenBP/OpenBP/SBS_Planandaccept` 的 24 份历史文件。 |

W08–10 的内容可以精确恢复，但重新压缩的时间戳/压缩器可能改变 ZIP 整包 SHA，不能宣称恢复完全相同的 ZIP 字节；若要保留旧分发包字节，应在删除前保全原 ZIP。

### 原件恢复与独立哈希证据

只读原项目根：`D:\产品孵化器\OpenBP\OpenBP`。候选比较检查两边每个相对路径、长度、SHA256；树摘要按排序后的 `相对POSIX路径 + NUL + 长度 + NUL + 文件SHA256 + LF` 汇总 SHA256，不含目录时间戳/ACL/空目录。

| 当前候选 | 当前文件 / 原件文件 | 差异 | 当前树 SHA256 |
|---|---:|---|---|
| `Claude源码` | 6,850 / 6,852 | 当前独有 0，原件额外 2，对应内容差异 0 | `094d193b54723bbfe6b7000e647030db110d891ee94e207bb5fb9192551469e2` |
| `tmp_chili3d_official` | 592 / 592 | 路径/内容差异 0，包含嵌套 Git | `7dfd7951e6dccb319b5100031592d6e95e9bc86ce481f13f6afed77b5b61b424` |
| `Front`（保留） | 94 / 94 | 路径/内容差异 0 | `f468229e2551491503d1e6fee093ce5f22aed436b76e948d1d8a661b7f322329` |
| `.venv`（保留） | 975 / 975 | 路径/内容差异 0 | `e3453a1da74e03aa0a417550f6d1a727f75696c440f64e688ab066b9e47f7935` |

Chili 嵌套仓 HEAD：`97313ffefb92f6ccaf6c500917edd993b8b04e2a`；`git status --short --untracked-files=all` 为空。本审计未打印 remote、身份数据或凭据。

分发 ZIP 整包 SHA：town `214579eee83cd9d0a62b9941d11b6d8665cf1b8d3219ee6f2d6f111725185e13`；game `d95ab3206d82bdbe0904c352887666415361aa33371d14a5fbdb8442dcd56ebb`；studio `2662b8f714b0d596768dcf663f01282152062f0cc641720752ac1cd7b716f3d2`。

## 3. 保留项与不能以体积判断的目录

| 绝对路径；相对路径 | 文件数 / 字节 | Git / 保留理由与恢复边界 |
|---|---:|---|
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\node_modules`；`OpenBP/OpenBP/frontend/node_modules` | 40,108 / 663,616,274 | ignored；保留当前开发/本机依赖。存在 package-lock 不意味着当前离线可以重装；`npm ci` 可能联网。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.next\standalone`；`OpenBP/OpenBP/frontend/.next/standalone` | 5,876 / 1,029,208,602 | ignored；完整分发包。Dockerfile:16–20 复制它并启动 server.js，不能当开发缓存删。保留其余生产 .next 文件及 public；未验证当前包全部业务可运行。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.bpai`；`OpenBP/OpenBP/frontend/.bpai` | 3,939 / 323,177,213 | ignored；含存储文件、生产素材、技能适配器/运行、工作协议等。目录名不代表可再生缓存，Git 无法恢复。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\.openbp`；`OpenBP/OpenBP/frontend/.openbp` | 1,408 / 275,212,871 | ignored；含工作空间、蓝图、员工、guided run 等运行产物。保留；有专用归档脚本不等于本轮可以抹除。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\Front`；`OpenBP/OpenBP/Front` | 94 / 12,947,173 | 94 tracked，干净；早期 HTML 页面、设计模板、截图，是有据可查的产品结构来源。`Construction_ Specification/00_总索引与导航.md:53,181` 区分原型与正式工程；多份 Project_skeleton 文档依赖它作为参考，保留比节省约 12 MiB 更有价值。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\.venv`；`OpenBP/OpenBP/.venv` | 975 / 10,904,639 | ignored；原件哈希已匹配，但目前未完成所有辅助 Python 入口调查，保留小型现有运行环境。不能只因是 venv 就删。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend\public`；`OpenBP/OpenBP/frontend/public` | 29 / 45,820,495 | tracked；含 CAD 已发布资产、OnlyOffice 等，Dockerfile:18 会复制。不能因有源文件就删部署资产。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\docker`；`OpenBP/OpenBP/docker` | 230 / 2,505,377 | 含 tracked 与本地状态；保留。OpenClaw 侧车、身份与挂载状态不是普通构建缓存；未读取或输出凭据值。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP_Business Map\tmp`；`OpenBP_Business Map/tmp` | 58 / 12,501,664 | root untracked；保留。含 source-audit、source-reading、规则原件提取、渲染图、概念原型和核查脚本，名称 tmp 不足以证明可删。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\工作盘点`；`工作盘点` | 4,124 / 5,564,658,295 | 原位保留全部业务资料、Git、已有修改。`_盘点整理` 为 1,904 文件/1,224,422,567 B，含报告、提取素材及证据，不能整体按缓存删除。 |

工作盘点中至少 10 个被忽略的大型 PPTX/DOCX/XLSX/HTML/GIF 仍是实际业务材料；Git 无法兜底这些文件。`_盘点整理/node_modules` 本次为空；无须以清空工作盘点来追求体积指标。大量品牌 GIF 即使可从原件重新提取，仍需先证明报告/网页引用关系，本轮不建议处理。

## 4. 整体移动与引用影响

### 4.1 OpenBP 主仓：当前不移

拟议源绝对路径 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP`，相对 `OpenBP/OpenBP`；若强行统一，目标为 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\components\workbench`。本轮建议不执行该移动。

正面证据：构建配置、Docker 上下文、CAD 打包大多使用目录内相对路径；`frontend/src/lib/runtime-store/paths.ts:3–22` 以 process.cwd 和 OPENBP_DATA_ROOT/BPAI_DATA_ROOT 解析数据根，整个树在正确 cwd 下有可迁移基础。

未满足条件：`content/server.ts:24` 直接按 cwd 使用 `.bpai/storage`；`business-domain/skill-runtime-local-process.ts:225,232,265–266,521` 将技能根/输入输出路径解析并记录为实际路径。未逐条迁移运行存储、自定义环境路径、外部工作空间或已保存的绝对路径，不能保证移动后继续可用。`.env` 只核对存在性，没有读出值。

引用影响包括根 REPOSITORIES、Product/COMPONENT_MAP、HANDOFF、研究报告，以及内层 Construction、AI_Dev_Memo。保留现址并在组件注册表声明真实路径，比未经验证的整仓改名更可靠；将来迁移需有旧→新映射、外部路径审计及实际恢复演练。

### 4.2 业务参考：允许整树规整，保留内部结构

下表保留初审时根原件归档的路径评估，但**最终操作不移动根三份原件**。实际动作只有 Business Map 与 B站整树移动，删除动作见 `actions-workbench.json`，移动动作由根任务维护 `actions-references.json`。

| 源绝对路径 / 相对路径 | 建议目标绝对路径 | 移动与验证条件 |
|---|---|---|
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP_Business Map` / `OpenBP_Business Map` | `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\References\BusinessMap` | 整树移动；可先去除 W08–10 冗余 ZIP。源文件、PDF/DOCX/XLSX、图片、SOP、tmp 证据均保留。所有 HTML 本地 src/href 扫描只命中树内文件；三个 package.py 都按 __file__ 定位。移动前后对未删文件逐相对路径/长度/SHA 守恒，并更新根研究引用。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\无限大B站数据系统` / `无限大B站数据系统` | `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\References\BilibiliDashboard` | 整树 6 文件保留，index.html 相对指向内置大 HTML。HTML 可离线使用，但两个启动器指向根 `work/unified/system_server.py`，该文件在当前工作区不存在；这是已有缺口，移动后不能把启动器作为可用在线入口。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\三方号看板.docx` / `三方号看板.docx` | `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\references\business\requirements\三方号看板.docx` | 1 文件 / 1,010,766 B，root tracked/clean；保留原名原字节，修复根与 Product 链接，登记历史绝对路径映射。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\三方号上线项目进度管理.xlsx` / `三方号上线项目进度管理.xlsx` | `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\references\business\requirements\三方号上线项目进度管理.xlsx` | 1 文件 / 50,182 B，root tracked/clean；同上。不要编辑单元格以适应目录整理。 |
| `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\发布管理-发布计划、发布日历、发布效果_V5.0.html` / 同名根文件 | `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\references\business\prototypes\发布管理-发布计划、发布日历、发布效果_V5.0.html` | 1 文件 / 187,685 B，root tracked/clean；与工作盘点/伏羲相关同名文件 SHA 相同。仍保留这份明确入口或登记同源关系，不清理工作盘点副本。静态演示数据不是当前真实业务状态。 |

路径引用已实际命中：根 README:29；Product/COMPONENT_MAP:47–48；Product/BRIEF:50–51；研究 BUSINESS_AND_OPENBP:33–34、CRAWLER_AND_BUSINESS_MAP:11,25、SOURCE_INDEX:32–33。应更新活动导航；历史证据应标旧路径或提供映射，避免不加说明地改写阅读历史。

`工作盘点/00_项目入口/阅读登记.json:6019,6030,6041` 已保存上述三个根文件的旧绝对路径，且文件本来就有用户修改。移动执行方应在新的整理映射说明旧地址，而不是覆盖此登记；本审计没有修改它。

B站 `使用说明.txt:22–25` 明确离线包与在线脚本分离，以及浏览器记录依赖访问地址；Business Map 也有 localStorage。移动文件后旧地址下的标注/布局/演练进度不会自动转移；不能宣称浏览器本地状态已迁移。不要为了让旧启动器成功而本轮新增采集服务。

根原件 SHA256：DOCX `285bf9e260dcdb7e5491deadad30427144ab575ef3c0dbc1228150a1b0940a19`；XLSX `c520804293518e5b6b2c55d98a7ba57ccd06f5a20a6a98e8a10ea825d2d5c722`；HTML `53bff9d66df08035bfe9f88f426ca49bc2cb1301b659224f7e6d1fff46068a0b`。

两个 B站 cmd 字节相同，SHA256 `4f26d65d4cf06bf4ce99261c1408a6fdfc43c4376fcf81ec4cfbbf4f5c9a0f05`。368 B 的重复启动器没有实质空间收益；建议保留历史原件，在组件手册明确当前入口限制即可。

## 5. 长期组件手册所需的真实入口与许可证

以下路径相对 OpenBP 主仓 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP`；这些是查得的入口，未全部执行验证。

| 组件 | 入口与依赖 | 验证、许可及限制 |
|---|---|---|
| OpenBP 正式工作台 | cwd `frontend`；Node >=20.9（package.json:230–231），Next 16.2.1 / React 19.2.4；`npm run dev`、`npm run build`、`npm start`（:6–8）；数据库用 Drizzle/PostgreSQL，`npm run db:migrate` 会写库 | README:54–106；`lint` / `typecheck`（package.json:9–10）；`test:openbp:quick/core/security/full`（:17–20）调用 harness，可能写测试/运行目录，不当无副作用命令。本轮未运行这些产品测试。主仓根未找到独立 LICENSE；package 为 private，不能推定开放许可。 |
| Docker 工作台 | Dockerfile 三阶段 Node 20 Alpine；runner 复制 standalone/static/public。`docker compose -f docker-compose.dev.yml up --build` 是开发入口 | dev compose 启动 PostgreSQL/PostGIS、OnlyOffice；前端 3011、OnlyOffice 8091、PG 5441；前端命令会 npm install+migrate+dev，可能联网及写库。可选 OpenClaw profile 多侧车；未在本轮启动。不能仅凭 compose 存在宣称长期部署已验收。 |
| CAD 实验页 | cwd frontend；`npm run cad:lab:dev/build`，脚本在 package.json:225–228；Vite 配置、同步脚本、发布脚本；当前 `/cad-lab/index.html` 用 public 已发布副本 | cad-lab/vite.config.ts:11,14 为 5173、代理 localhost:3001，需单独核对实际后端端口。同步依赖 node_modules 中 @mlightcad 与 libredwg-web worker/WASM；不可删其运行资产。保留依赖包中的各自许可文件。 |
| Front 静态原型 | `Front/site/*.html`；历史总览、工单、文档、AI 宿舍等原型 | 没有证明其是正式后端入口；Construction 总索引明确仅参考。未找到 Front 独立 LICENSE；不能从有页面推定多人生产能力。 |
| Claude 参考源码（建议退役） | `Claude源码/README.md`；包含恢复源码、嵌套源码副本、tgz 与自身 node_modules，未被主前端接入 | README:78–80 明确非官方、权利归原权利方、研究归档用途；不是官方开源项目。Construction/11_AI Agent架构_MCP_CLI_Skill_Longxia总设计.md:3,120 为参考关系。退役后保留来源和用途说明，不把它当已接入 Agent 引擎。 |
| Chili 参考源码（建议退役） | `tmp_chili3d_official` 独立源码/嵌套仓；无主工作台构建引用 | `tmp_chili3d_official/LICENSE` 为 AGPL v3；`cpp/LICENSE-chili-wasm.txt` 为 LGPL v3。外部原件及摘要保留；本轮不运行其构建或引入实现。 |
| Business Map | 在其目录打开 `BM-block-town.html` / `BM-business-game.html` / `BM-pixel-studio.html` / 两份 SOP HTML；对应子目录 package.py 打包，纯本地演练 | `bm-game/game.test.cjs` 为无外部依赖 Node 流程测试；不是在线真实审批/发布系统。目录未见独立 LICENSE，保留业务原文与来源；不假定可公开分发。 |
| B站离线演示 | 打开 `无限大B站数据系统.html` 或 index.html；无 CDN，图片/数据/程序内置 | 既有 KOL 与三方号历史快照，两业务数据口径分开。两个 cmd 的在线后端缺失；目录未见独立 LICENSE，不应把其中业务数据公开部署。 |

工作盘点维护入口为 `维护工具/README.md` 与对应 Python 工具，操作可能更新入口索引，本轮未运行。维护工具源码及已有 `__pycache__` 没有作为节省空间目标；空目录/13 KB 缓存不应引发业务登记变化。

## 6. 实际完成的检查与执行方后续验收

实际完成：目录/字节/Git 基线；候选与外部原件逐文件 SHA；CAD dist/public 七文件 SHA；三份 ZIP 全部条目 SHA；HTML 本地 src/href 扫描；打包和清理脚本、Docker、package、关键路径实现静态阅读；许可证入口核对；未读取 `.env` 值。

实际离线测试：以捆绑 Node 在 `OpenBP_Business Map/bm-game` 执行 `node game.test.cjs`，退出码 0。输出 first/proposal/urgent 三场景完成，审计记录 13/14/14，错误选择、顺序门槛、回填、版本、恢复校验通过。该测试只证明演练状态机，不覆盖 WebGL 渲染、浏览器 localStorage、真实业务接口。

只读进程快照曾未发现 node/python/pythonw/bun/docker；这是当时快照，实际删除前必须重查，不能据此终止未知进程。执行方需验证每个解析后的绝对路径仍在授权工作区内，并排除 reparse points。

建议执行顺序：先保存逐项 manifest/删除前哈希与必要证据，再清 W01–05 和外层空壳；登记参考退役来源后处理 W06–10；整树移动业务参考并核验剩余文件哈希守恒；更新活动导航和旧路径映射；分别检查根/子仓 diff，保护工作盘点已有修改。

离线验收应至少包括：保留源码/锁文件/入口/许可存在；OpenBP 主仓原 cwd 与运行数据未变；`.next/standalone`、生产 manifests、public 与 node_modules 未误删；Business Map 移动后本地依赖全存在且 game.test.cjs 再过；B站离线 HTML/index 仍可定位。没有实际启动或浏览器验证的能力保持“未验证”标记。

本报告未逐行阅读全部源代码、全部运行存储或 5.56 GB 业务资料；本轮范围是整理依赖与保全，既有业务完整阅读记录见 `Product/research/2026-10-18-mikoshi/BUSINESS_AND_OPENBP.md`。未扫描凭据内容，也未对全部绝对路径或所有外部引用作安全迁移保证；因此明确保留 OpenBP 主仓原位置。

## 7. 追加计划：参考源码退役文档与离线验收

本节在子仓文档修改前记录，沿用根 SBS-0004，不创建新编号。用户当前整理授权覆盖退役不接入参考代码；主任务进一步限定本分工只能更新来源说明和活动导航，不修改业务实现。

计划：新增 OpenBP 根退役来源说明，记录 Claude 非官方/权利归属/研究用途声明、Chili AGPL/LGPL 位置、外部原件绝对路径、Git 与逐文件树摘要恢复边界；在 OpenBP README 和 Construction 总索引添加活动导航，在历史 Agent 架构文档前添加退役映射而不重写其历史正文；由主任务统一执行删除、提交源码删除与文档变更。

验收 AC-R1：退役说明同时保留来源、权利声明、恢复路径、文件数和 SHA；不把原件额外文件当成当前副本，也不声称 Git 覆盖 ignored 依赖。AC-R2：当前导航指向存在的退役说明，历史正文保留；OpenBP 运行源码、Front、锁文件、生产依赖和本地运行数据无修改。AC-R3：离线检查记录实际命令、cwd、退出码与覆盖限制；不执行固定写业务 store 的整套 harness。AC-R4：删除 manifest 仅列本报告已核对的 12 项；Chili 嵌套 .git 的删除明确登记，保留外部原件完整 SHA 证据。

追加文档完成：新增 `OpenBP/OpenBP/RETIRED_REFERENCE_SOURCES.md`；README、Construction 总索引、历史 Agent 架构各新增 2 行说明。Git diff 仅这 3 个跟踪 Markdown 的 6 行插入，外加新来源说明；3 个导航目标均存在。历史架构正文未改，运行源码无修改。AC-R1/R2/R4 文档部分通过；实际退役执行仍由根任务记录。

## 8. 实际 OpenBP 离线检查

运行器：`C:\Users\11409\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`。正式前端根为 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend`。

| 检查 / 实际命令 | cwd / 隔离措施 | 结果 |
|---|---|---|
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | 正式 frontend；禁用增量编译以免改写 tsbuildinfo | PASS，退出码 0，无 stdout/stderr。覆盖当前 tsconfig 包含的 TypeScript，不证明运行服务或业务数据正确。 |
| `node --import <frontend/node_modules/tsx/dist/loader.mjs 的 file URL> <frontend/scripts/model-access-registry-smoke.mjs 绝对路径>` | 正式 frontend；`TSX_DISABLE_CACHE=1`；先阅读脚本与相关 registry/matrix 调用，使用静态默认注册表和页面源文本 | PASS，退出码 0，1.174 秒；8 个默认 provider、15 项能力及页面入口声明检查通过。这里只验证仓库内能力声明一致性，不是供应商实时可用性。 |
| `node --import <同上 loader URL> <frontend/scripts/model-access-routing-smoke.mjs 绝对路径>` | `.local/curation/SBS-0004/openbp-offline-checks/routing-sandbox`；`TSX_DISABLE_CACHE=1`。模型 store 固定取 cwd 下 `.openbp`，因此隔离 cwd，未读取真实 provider store | PASS，退出码 0，0.348 秒；聊天/图像/代码/local-only/高风险路由断言通过，未调用模型。路由的同步读取会确保一个 store 目录存在，该写入仅发生在 `.local`。 |

后两项 stdout、stderr、cwd、耗时保存在 `.local/curation/SBS-0004/openbp-offline-checks/smoke-results.json`。未加载 `.env`、未联网安装、未创建外部请求。类型检查结果来自本轮工具退出码，未伪造额外日志。

没有执行 `npm run test:openbp:quick/core` 整套：harness 的 REPORT_PATH 固定指向真实 `.openbp/test-runs/latest.json`；抽读的 change-kind-policy、lifecycle-pattern、mutation-guard 和 component-schema smoke 确实会保存状态或应用 mock。它们名字中的 smoke/dry-run 不能自动等同无副作用。本轮两项模型 smoke 与 tsc 是适合此次整理前保全的有限离线检查，不替代完整产品验收。AC-R3 通过。

## 9. 执行脚本与动作文件独立审查

初审 `tools/curation/apply_manifest.py` 实际全文 175 行，SHA256 `a2d8e6adf39f472dc5cae5bd71cc9b3c7ec357752f6f58908905b68ac45b20e4`。同时读取并解析 workbench/references/components/git-temporary 四份动作文件；Git 临时文件在查询时已经不存在，本审计不追认那一批是否完成，依根执行回执核对。

安全边界已核实：拒绝绝对路径、工作区根、上级路径和未经允许的显式 `.git` 路径段；路径祖先及 snapshot 后代均拒绝 symlink/reparse；manifest 内容 hash 锁定；prepare 后对全部源作快照比对，操作前再次比对；源动作不能相互包含；审计文件不能落在删除源内；目标存在或落在自身源内时拒绝；移动逐文件 SHA 和目录/元数据回查，删除使用单一 Python 文件 API，不跨 shell。

实际无修改负例检查：`..`、`.`、`..\outside`、绝对工作区路径、`C:\Windows`、`.git\config` 均被 safe_path 拒绝。当前 workbench 12 项源均存在，两个 references 与两个 components 移动目标均不存在，实际动作没有源/目标冲突。跨 manifest 的正确顺序仍须由执行方保证：Business Map ZIP 清理完成后，重新 prepare 整树移动快照。

初审阻断 W07：Chili 树有 3 个 READONLY 后代文件。初审脚本目录分支直接 `shutil.rmtree(source)`，而 `allow_readonly` 只在单文件分支生效，可能删除部分文件后失败。需针对明确允许的目录动作实现受限只读重试/属性处理，或保留 W07；修复前不能判整个 workbench 批次可执行。已即时反馈主任务。

特别范围：safe_path 只检查 action 路径中的 `.git`，不会拒绝目录后代的 `.git`。W07 明确允许整树退役，manifest 已标 `allow_git_internal=true`，并记录外部完整原件逐 SHA 保全。这个授权不能推及其他组件的 Git；移动完整组件保留 Git，不是删除它。缓存删除使用 size/mtime 指纹；参考源码、重复内容删除另启用 hash_contents，避免把可再生缓存的较弱比较用于唯一源文件。

普通加固建议：result_path 是由 record 文件名推导的，未再次走 safe_path；当前明确动作/日志位置未见由此造成越界，但建议仍验证派生路径并拒绝其为 reparse。脚本不自动推理跨 manifest 依赖；不应改变动作顺序而沿用旧 prepare。审查结论只覆盖列出的实际脚本版本和动作，不是对所有未来 manifest 的通用安全认证。

### 修复复核结论：PASS（本批执行前审查）

主任务修复后再次完整读取 191 行脚本，SHA256 `3eae4f8937eaf749d2b0e040de15cbad6d64100c9fe7ab8a10b130d12c406242`；复核 workbench manifest SHA256 `35f7e532669ff75224fd3cc864a619a7028953cc33e49d34bca13bdc9b0c1f5a`。`readonly_retry:78–90` 仅在 PermissionError 且目标为只读文件时处理，重新检查 safe_path、拒绝 reparse、验证目标在该 source 子树，再清属性并记录相对路径；目录分支 :166–168 仅在 action 显式 allow_readonly 时启用。当前清单只给 Chili 目录启用此标记。3 个只读文件为该嵌套仓同名 pack 的 `.idx/.pack/.rev`，不是未授权外部文件。

初审实际阻断已解除；12 项 workbench 删除、两项 references 移动的路径/理由/保留与恢复边界通过执行前审查。未替执行方运行 prepare/apply，未证明删除已完成；应以新的 manifest 准备记录并按约定先删除冗余 ZIP、后准备整树移动。Components 的迁移功能验证由对应分工负责，本审查仅核对其实际路径安全条件；Git 临时文件批次不在本次执行前 PASS 范围。
