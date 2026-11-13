# SBS-0004：Harness / Kiroshi / Torpedo 精细整理审计

日期：2026-10-18；范围：Mikoshi 工作区副本；外部 `D:/产品孵化器/` 原项目只读比对。
本文件是整理候选与依赖证据；不代表已删除、已迁移或已通过真实产品运行。
后续获授权的 Harness 绑定修复另记 `repair-harness-binding.md`；本审计不启动应用、模型、浏览器或服务。

## 1. 方法、版本与覆盖

- 已读根 AGENTS、Constitution 相关规则、SBS-0004 全文及当前交接；结合 SBS-0002 的组件调查继续核对当前入口。
- Harness：AGENTS、README、Studio 启动/桌面构建指南、runtime_config、desktop backend/main/build、当前 SBS 与目录/Git 归属。
- Kiroshi：AGENTS、README、Constitution、SBS 索引及当前 SBS-002；当前是文档和探针合同，尚非独立运行服务。
- Torpedo：README、Constitution、STEP_BY_STEP 当前状态、Dev.bat、开发桌面脚本、pyproject/requirements、OCR 打包规则与架构检查器；未找到其根 AGENTS。
- 枚举逻辑文件长度，跳过 Windows reparse point，不跟随符号链接；不是 NTFS 实际分配空间测量。
- 可复用总账：`.local/curation/SBS-0004/before-summary.json` 与 `before-files.csv.gz`；本报告独立细分候选并检查恢复条件。
- 没有读取 `.env` 值、数据库业务内容、对话、附件或个人文件；私有 runtime 配置只输出路径归属布尔量。
- 完整比对两个引擎归档内所有常规文件与解包文件 SHA256；不执行任何归档内容。
- 未逐行审查上游 Rust、所有依赖或全部历史证据；不声称所有运行数据都可迁移。

| 组件 | 副本 HEAD / 分支 | 外部原项目 HEAD | 副本逻辑字节 / 文件数 |
|---|---|---|---:|
| OpenBP_Harness | `2c31fa0239c061bf2b711a2b36fdfb7dc82c90e5` / main | `c0d26949be4144c751894ae96e28d3db2208b764` | 3,146,619,432 / 30,729 |
| OpenBP_Kiroshi | `f87f3317970c024e67f2b3d9e2d05fd1e5823106` / main | `c2c7f026efe2de099cf9a5f62edf76eef4937b98` | 462,738 / 131 |
| OpenBP_Torpedo | `b93e2586b0d7e8d67880fbc20d378ecbcd2533d1` / codex/wiki-torpedo-r1-usable-loop | `de72afbd2ba139f86789b1f18b08dd7c928a7593` | 1,204,227,886 / 39,087 |

三副本审计起点 tracked diff=0、非忽略 untracked=0；各自 `.git` 独立，不能作为顶层普通文件随意重建。
原件和副本 HEAD 不同；抽验 Harness 的 build.cjs/backend.cjs/runtime_config.py、Torpedo 的 Dev.bat/pyproject.toml、Kiroshi README 内容 SHA256 均相同，只能证明这六个入口/合同相同。
Harness 有 16 个跳过的 reparse point，位于实验临时工具链接；Torpedo、Kiroshi 本次无 reparse point；枚举错误均为 0。

## 2. Harness：保留完整执行器与本地状态

| 工作区相对路径 | 字节 | Git / 用途 | 建议及恢复条件 |
|---|---:|---|---|
| `OpenBP_Harness/codex-rs` | 81,936,899 | 上游 Rust 核心；8,173 文件 | 全保留；不是 target。删源码会丢工具、审批、协议与执行语义的可审查/可修改资产 |
| `OpenBP_Harness/.git` | 725,543,004 | 子仓历史/引用 | 保留；不以 gc、删 pack 或重建 Git 达成瘦身 |
| `OpenBP_Harness/experiments/deepseek/runs/portable-0.158.0` | 604,433,594 | 忽略，完整 Windows 引擎及归档 | 保留解包 payload；只考虑下表单独归档 |
| `OpenBP_Harness/experiments/deepseek/runs/portable-linux-0.158.0` | 603,679,961 | 忽略，完整 Linux 引擎及归档 | 保留解包 payload；WSL 自动选择实际依赖此路径 |
| `OpenBP_Harness/apps/openbp-studio/desktop/node_modules` | 413,996,267 | 忽略，Electron/packager 构建与开发运行依赖 | 保留；npm ci 的锁文件并不等于已具备离线恢复包 |
| `OpenBP_Harness/apps/openbp-studio/desktop-dist` | 385,322,150 | 忽略，74 文件完整桌面包 | 保留整包；不能只留 exe；现有绑定需修复 |
| `OpenBP_Harness/apps/openbp-studio/.data` | 247,479,058 | 忽略，7,391 文件；SQLite、会话、草稿、上传、workspace、私有运行 home | 保留；不能视为统一缓存清空 |
| `OpenBP_Harness/.artifacts/harness-course` | 43,784,419 | 151 文件全部 tracked；课程/派生材料 | 属可追溯成果，保留；如日后归档须单独维护链接/版本，不混入缓存 |
| `OpenBP_Harness/SBS/evidence` | 16,702,261 | 1,677 实际文件、1,491 tracked；验收与局部临时产物 | 保留证据；不得按扩展名统删截图、脚本或历史证明 |
| `OpenBP_Harness/apps/openbp-studio/test-results` | 1,787,768 | 忽略，38 文件测试产物 | 未证明全部可重生且无独有证据，先保留 |
| `OpenBP_Harness/apps/openbp-studio/.desktop-build` | 553,973 | 忽略，31 文件；显式 allowlist 构建 stage | 可清理候选；没有活跃构建，保留 desktop/node_modules 与 desktop-dist 后才处理 |
| `OpenBP_Harness/experiments/deepseek/__pycache__` | 8,801 | 忽略，1 pyc，源 .py 存在 | 可清理候选；下次对应 Python 导入自动生成，不影响源码 |

没有发现 Harness Rust `target`；不应为了表面清理而删除 `codex-rs`、完整引擎、模型目录或配置。
`.data/window-profile` 137,855,378 B、`codex-home-wsl` 90,106,618 B 都可能混有状态；不能把浏览器 profile/私有 home 整目录当缓存。
`OpenBP_Studio.cmd` 使用相对 launch.py，优先用户目录的 bundled Python；`launch.py:74–79` 默认启动完整桌面包。
`runtime_config.py:266–271` 从项目根寻找 Linux portable Codex 并决定 WSL；只留下 Windows exe 会改变当前实际引擎行为。
`runtime_config.py:275–279,367–374` 将 app 私有 CODEX_HOME 与用户 home 分开；应保存这个隔离边界。
源码锁、许可证、NOTICE、models.json、实验诊断/兼容性证据均保留；“实验”名称不等于无运行依赖。

### 2.1 两个可精确移除的重复引擎归档

| 精确候选路径（相对 OpenBP_Harness） | 字节 | SHA256 |
|---|---:|---|
| `experiments/deepseek/runs/portable-0.158.0/package.tar.gz` | 156,473,560 | `33f58ae85da6fc20db7d4a5190f3fec815dfc4473f558a522c7cf39bb3e88cf9` |
| `experiments/deepseek/runs/portable-linux-0.158.0/package.tar.gz` | 159,550,884 | `b33cd426c9acab9b34c5a93200ba4fe83c8e614c18ce5ef52b2bf36408b8e18c` |

- Windows 归档的 45 个常规文件、447,958,403 B，与当前解包文件全部 SHA256 相同；missing=0、different=0、特殊成员=0。
- Linux 归档的 44 个常规文件、444,129,077 B，与当前解包文件全部 SHA256 相同；missing=0、different=0、特殊成员=0。
- 两归档与外部原项目同一相对路径的归档 SHA256 相同。恢复来源是这些只读原件；恢复时先再次验证上述 SHA256。
- 删除候选仅限两个 tar.gz，共 316,024,444 B；完整 `bin`、`codex-resources`、`codex-path`、清单和许可都留在原位。
- 实际入口引用解包 bin，没有发现启动入口依赖 tar.gz；这是去除重复分发材料，不是重新构建 Codex。
- 保留外部原件是当前恢复前提；原件以后清理前，需重新安排归档恢复来源。

### 2.2 桌面绑定与整仓移动

- 审计基线时，包 `apps/openbp-studio/desktop-dist/OpenBP Studio-win32-x64/resources/openbp-workspace.json` 指向外部 `D:/产品孵化器/OpenBP_Harness`；其后已按独立记录 `repair-harness-binding.md` 修正到当前副本。
- `desktop/backend.cjs:16–27` 信任该绝对绑定并检查 server.py；`main.cjs:24–27` 会立即在绑定根创建/使用 desktop-profile；`backend.cjs:108–111` 决定实际 `.data`。
- 因此外层副本启动器的相对路径正确，也不能证明桌面应用使用副本。修复前不应双击包验证。
- 最小修复：关闭/不启动应用，仅将工作区包的 `workspaceRoot` 改为当前副本真实绝对根；验证目标位于工作区且 server.py 存在。保持 JSON 其他字段，记录前后 hash。
- 源码生成器 `desktop/build.cjs:8–9,33–42` 已按自身位置算根并生成 extraResource，不含硬编码原目录；无须把新绝对路径写死进源码。
- 重建恢复方式：在副本 `apps/openbp-studio/desktop` 执行 `npm run build`。需要当前 node_modules/Electron、关闭现有桌面包；不保证无缓存时离线可完成。
- 如未来迁到 `Components/Execution/OpenBP_Harness`，必须整仓保留 .git/引擎/node_modules/.data，然后重新绑定或构建；主入口相对关系可保持，已有快捷方式和保存的 workspace 绝对路径仍须核对。
- 私有 `.data/codex-home-wsl/config.toml` 当前也包含原项目路径；没有修改它。`runtime_config.py:261–279,299–367` 会在正常初始化时按实际根重生成 app 自有 config/catalog。
- 本次不调用 prepare_runtime：该函数写私有状态并可能执行版本探测。未验证 WSL 挂载、所有保存的工作区、插件和旧会话迁移。
- **本轮建议 Harness 保留现物理路径，先完成绑定修复**；分类可由根组件注册表表达，不为视觉整齐制造运行歧义。

## 3. Torpedo：运行依赖比缓存大，保留本地入口

| 工作区相对路径 | 字节 | Git / 用途 | 建议及恢复条件 |
|---|---:|---|---|
| `OpenBP_Torpedo/.venv` | 889,763,504 | 忽略；29,829 文件；Python 运行/开发/OCR 依赖 | 保留；requirements 并未完整锁定当前环境，不能承诺离线原样重装 |
| `OpenBP_Torpedo/dist/torpedo-fast-ocr-worker.exe` | 231,429,665 | 忽略；可选 OCR 独立 worker | 保留；它是可用能力资产，不能因 dist 名称删除 |
| `OpenBP_Torpedo/.git` | 44,877,579 | 独立子仓 | 保留全部历史/引用 |
| `OpenBP_Torpedo/tests` | 12,330,406 | 源测试/fixtures + pyc；232 tracked | 保留源码、fixtures 和关键合同测试，缓存按下一节逐目录处理 |
| `OpenBP_Torpedo/OpenHarness-main` | 11,905,067 | 442 文件全部 tracked；上游参考，不是嵌套 Git | 保留完整源码/测试/许可；未来可独立归档参考目录，但本轮小收益不值得断链 |
| `OpenBP_Torpedo/torpedo` | 7,944,800 | 346 tracked 核心模块 + pyc | 保留所有生产源码和运行资源 |
| `OpenBP_Torpedo/data` | 1,065,436 | 8 文件；仅 README/.gitkeep tracked，含忽略数据库 | 保留；不能由 Git 恢复业务状态 |
| `OpenBP_Torpedo/packaging` | 7,157 | 5 tracked 文件；精确 OCR 构建锁与打包规则 | 保留，连同 notice、协议、验证与测试 |
| `OpenBP_Torpedo/.pytest_cache` | 328,872 | 忽略，5 文件，测试缓存 | 可清理候选；重新 pytest 生成，不影响产品数据 |

OCR exe SHA256=`d132f7ba4056c25974b98a28af0746e801b106cc8d5fc967876161f328acb0d5`，与外部原项目同路径文件相同。
但恢复依赖可用原件或完整构建链；`packaging/fast_ocr/README.md:8–22` 要求 CPython 3.11.9、精确构建 lock、两套指定模型目录和生成 SBOM，不能只凭源码承诺立即再生。
`packaging/fast_ocr/README.md:30–32` 明确签名、公开镜像与第二台干净 Windows 认证另属发布工作；“保留可用二进制”不等于已具备生产分发能力。
README 将内置 OpenHarness-main 定位为参考；核心搜索未发现运行导入它，只有 mock 示例文案/来源类型。不能将其误称为当前 Torpedo 调度引擎。
Torpedo 当前 STEP_BY_STEP 已至 25B.34；不要用旧 README 摘要的阶段号覆盖最新状态，也不要为整理裁掉 bounded research tail/恢复合同。

### 3.1 精确 Python 缓存候选（相对 OpenBP_Torpedo）

| 候选目录 | 字节 | pyc 数 |
|---|---:|---:|
| `tests/fixtures/__pycache__` | 701 | 1 |
| `tests/__pycache__` | 10,195,481 | 354 |
| `torpedo/agentic_steward/__pycache__` | 72,835 | 16 |
| `torpedo/ai/__pycache__` | 46,497 | 14 |
| `torpedo/api/__pycache__` | 154,481 | 30 |
| `torpedo/artifacts/__pycache__` | 1,079,946 | 69 |
| `torpedo/core/__pycache__` | 60,399 | 16 |
| `torpedo/executors/__pycache__` | 39,370 | 10 |
| `torpedo/folder_sources/__pycache__` | 242,723 | 16 |
| `torpedo/harness_bridge/__pycache__` | 42,083 | 12 |
| `torpedo/intake/__pycache__` | 140,546 | 16 |
| `torpedo/knowledge/__pycache__` | 130,556 | 14 |
| `torpedo/legacy_adapters/__pycache__` | 86,149 | 10 |
| `torpedo/librarian/__pycache__` | 845,848 | 82 |
| `torpedo/perception/__pycache__` | 27,025 | 8 |
| `torpedo/perception_eye/__pycache__` | 907,729 | 61 |
| `torpedo/pipeline/__pycache__` | 150,654 | 12 |
| `torpedo/precompute/__pycache__` | 11,505 | 4 |
| `torpedo/projections/__pycache__` | 159,125 | 11 |
| `torpedo/research/__pycache__` | 547,193 | 47 |
| `torpedo/semantic/__pycache__` | 9,668 | 4 |
| `torpedo/semantic_builder/__pycache__` | 95,413 | 18 |
| `torpedo/skill_activation/__pycache__` | 35,226 | 8 |
| `torpedo/wiki_torpedo/__pycache__` | 104,886 | 12 |
| `torpedo/__pycache__` | 84,801 | 6 |

上表 25 目录合计 15,270,840 B，全部文件为 pyc、对应源 .py 存在、未追踪；适合应用/测试停用时清理，Python 会按需再生。
**明确排除** `scripts/__pycache__`（132,683 B）：4 个孤立 pyc 共 31,054 B 没有当前或原项目源文件，Git 全引用历史也未找到相应源路径。
孤立文件为 `_phase25a2b_assemble_live_pack.cpython-311.pyc`（15,057）、`_phase25a2b_live_smoke.cpython-311.pyc`（5,339）、`_phase25b_live_visual_check.cpython-311.pyc`（3,233）、`_retina_multi_image_probe.cpython-311.pyc`（7,425）。
不执行/反编译这些历史字节码；保留整个小目录，避免把可能唯一探针产物当再生缓存。

### 3.2 Torpedo 整仓移动风险

- 未来逻辑路径可以是 `Components/Knowledge/OpenBP_Torpedo`；本轮建议原位，保留可直接使用的 Dev 入口及环境。
- `Dev.bat:4,12–13,23,38,50` 从自身位置拼相对 .venv/python.exe 与开发 shell；整仓相对关系可保持。
- 但 `.venv/Scripts` 有 47 个 activate/console 入口含原项目或现路径，含 pip.exe、pytest.exe、uvicorn.exe、OCR CLI。搬仓后这些封装入口可能去原目录或失效。
- 虚拟环境基座是本机 CPython 3.11.9；不能当完全可移植 Python。优先用目标 `.venv/Scripts/python.exe -m ...`，是否真正可用仍须迁移后验证 prefix/dependencies。
- 已查 .pth 未见绝对项目注入；这不覆盖每个第三方包/模型路径。不能用“Dev.bat 是相对路径”替代完整迁移验证。
- SQLite、folder source、capability pack、可选 research-reader/Hermes 和本地配置可能保存外部绝对路径；本次未读取私人值，须保持数据并以专门迁移合同处理。
- `Dev.bat --check` 还会运行 research_config_cli；不是单纯文件检查，本审计未调用。正常 Dev.bat 会开后台/窗口，禁止拿它当只读验证。

## 4. Kiroshi：小型合同与实验研究仓，整保留

- 总计 462,738 B，其中 .git 209,270 B、docs 197,107 B、SBS 36,569 B、Constitution 15,492 B；无可观缓存/二进制/模型。
- 其价值是截图/视觉解释边界、OCR/感知研究与证据；SBS-002 VERIFYING 是当前文档状态，不等于常驻生产服务已部署。
- 全保留 README、AGENTS、Constitution、SBS、关键样例/探针证据与许可证。外部 Ollama 或模型缓存不属于本次工作区清理权限。
- 可整体移动到 `Components/Perception/OpenBP_Kiroshi`，保留 .git 后内部相对链接通常不变；必须修复顶层注册/导航链接，不批量重写历史记录的原路径。
- 没有运行入口可做启动测试；目录规整不会释放有意义空间。可以原位通过注册表归类，避免为统一目录结构先制造链接改动。

## 5. 离线验证与执行前提

以下是可执行检查，不启动产品、不调用模型；本次只实际执行库存/归档哈希/入口文本/Git 与配置归属检查。
路径按实际最终位置替换；不要在移动前使用推测的新路径，也不要启用后台服务作为默认验证。

```powershell
$taskRoot = (Resolve-Path -LiteralPath 'D:\产品孵化器\OpenBP_ ANANTA Mikoshi').Path
$harnessRoot = Join-Path $taskRoot 'OpenBP_Harness'
$torpedoRoot = Join-Path $taskRoot 'OpenBP_Torpedo'
git -C $harnessRoot status --short --untracked-files=all
git -C $torpedoRoot status --short --untracked-files=all
git -C (Join-Path $taskRoot 'OpenBP_Kiroshi') status --short --untracked-files=all
$bindingPath = Join-Path $harnessRoot 'apps/openbp-studio/desktop-dist/OpenBP Studio-win32-x64/resources/openbp-workspace.json'
$binding = Get-Content -LiteralPath $bindingPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ((Resolve-Path -LiteralPath $binding.workspaceRoot).Path -ne $harnessRoot) { throw 'Wrong Harness binding' }
if (!(Test-Path -LiteralPath (Join-Path $binding.workspaceRoot 'apps/openbp-studio/server.py') -PathType Leaf)) { throw 'Missing backend' }
node --check (Join-Path $harnessRoot 'apps/openbp-studio/desktop/build.cjs')
node --check (Join-Path $harnessRoot 'apps/openbp-studio/desktop/backend.cjs')
& (Join-Path $torpedoRoot '.venv/Scripts/python.exe') -I -B -c 'import sys; assert sys.prefix != sys.base_prefix; print("VENV_PREFIX_OK")'
& (Join-Path $torpedoRoot '.venv/Scripts/python.exe') -B (Join-Path $torpedoRoot 'scripts/check_architecture_health.py') --root $torpedoRoot
```

架构检查器 `scripts/check_architecture_health.py:397–435` 静态分析源码并读取基线，不启动 Torpedo。它不是功能验收替代物。
缓存清理应只需逐文件账本/保留源 hash/路径守恒，不为删除 pyc 启动付费模型或全产品。涉及入口代码变化另按对应合同选测试。
Harness 必须保留 test_*.py、desktop 安全/隔离测试；Torpedo 必须保留 jobs/恢复/权限/预算/感知/研究/打包测试和 fixtures，不能依“未来只用一部分”删测试。
所有递归删除/移动前由执行者再次校验 resolved 目标位于 taskRoot、非 reparse point、无新增文件/占用，并与逐文件 manifest 比对；不要照抄通配符一键清空。

## 6. 可交给统一清理的范围与限制

- 确定再生候选：Torpedo 上表 25 缓存目录 + `.pytest_cache`；Harness 的一个 `__pycache__` 和 `.desktop-build`，合计 **16,162,486 B**。
- 确定重复材料候选：Harness 两个 package.tar.gz，合计 **316,024,444 B**；原件哈希与完整解包验证均通过。
- 两类合计 **332,186,930 B**（逻辑字节，实际空间回收以清理后库存为准）；没有实际删除。
- .venv、node_modules、完整 exe/引擎、.git、源码/测试/许可/锁文件、.data/SQLite/模型与运行配置都不在清理名单。
- 不建议本轮移动 Harness/Torpedo；Kiroshi 可移动但收益是分类而非瘦身。根目录可先用机器可读注册表给三个组件稳定逻辑归属。
- 外部原项目只作为恢复/比较来源，本报告不授权整理外部原件。保留原件并不能代替未来正式备份策略。
