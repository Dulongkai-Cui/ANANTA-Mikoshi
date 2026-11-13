# SBS-0004 清理后独立验收：工作台与业务参考

日期：2026-10-18。结论：**PASS；本分工范围内无阻断问题。** 这是删除/移动后的保全与有限离线验收，不是 Mikoshi 集成上线验收，也不代表子仓提交或远端同步已完成。

## 版本与覆盖

| 受检文件 | 当前版本定位 |
|---|---|
| `COMPONENTS.md` | 全文 122 行，SHA256 `7b65fe80535e4def1ae5edb3f789aa2de43959b2a2d3084bc1065430e31f5d86` |
| `components.json` | 355 行，SHA256 `3f1bb76f8c07607f2e04e29f8de6ab833f55780020de5a7914a07725b3135071`；重点核读 workbench、business-map、business-evidence、legacy-dashboard 四项，全部 10 项做路径校验 |
| `actions-workbench.json` | SHA256 `35f7e532669ff75224fd3cc864a619a7028953cc33e49d34bca13bdc9b0c1f5a` |
| `actions-references.json` | SHA256 `3430b1efa7e1cfbd69c1e6465bb90c30445f5ce80a38996cb492b1de3e26dca2` |
| `.local/curation/SBS-0004/workbench-result.json` | SHA256 `b756f0696aa28fd113209843a78e71f14acef248796a09295544603095d532ec` |
| `.local/curation/SBS-0004/references-move-result.json` | SHA256 `1efac7a7b1d3591da5c06068aa6fed3db1fbc3d58a8e96d2c4da4d31449559aa` |

同时核读两份 prepare 清单、根 README/REPOSITORIES、Product/COMPONENT_MAP、OpenBP 退役说明及三处导航。其他运行组件的功能/迁移细节由相应独立分工验收，本报告不替代它们的结论。整理总记录仍在收尾的临时措辞不列为缺陷。

## 1. 清理后的类型检查

实际 cwd：`D:\产品孵化器\OpenBP_ ANANTA Mikoshi\OpenBP\OpenBP\frontend`。

实际命令：捆绑 Node `C:\Users\11409\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` 执行 `node_modules/typescript/bin/tsc --noEmit --incremental false`。

结果：**退出码 0，无 stdout/stderr**。与清理前相同；删除 `.next/dev` 与两个参考源码树后仍通过，未出现缺失生成类型报错。没有恢复被删缓存来掩盖错误，也没有改 tsconfig/源代码；关闭增量输出，未改写 tsbuildinfo。

这项检查覆盖当前 tsconfig 的源码类型约束，不证明数据库、OnlyOffice、模型服务、浏览器交互或所有真实业务接口可运行。

## 2. OpenBP Git 变更范围

核查时 HEAD 仍为 `54e2c53a035fe0049c8fb3d6e0290a9690c3268b`，尚无暂存修改。`git diff --name-status -z` 独立统计：

- `D` 4,002 项，全部位于 `Claude源码/`，没有其他跟踪文件删除。
- `M` 3 项，仅 README、`Construction_ Specification/00_总索引与导航.md`、`Construction_ Specification/11_AI Agent架构_MCP_CLI_Skill_Longxia总设计.md`。
- 唯一未跟踪新增为 `RETIRED_REFERENCE_SOURCES.md`。

三份导航仅各插入两行；历史架构正文保持。新来源说明保留 Claude 原声明、Chili 许可证位置、外部原件路径、基线提交、文件/树摘要和 ignored 恢复条件。核心源码、package、lock、public 无 Git diff；未扩大到产品实现。

package/lock 的工作树字节与 Git blob 原始字节比较有 CRLF/LF 差异；归一化换行后完全相同，Git diff 为空，并且两文件均与整理前库存的大小/mtime 完全一致。因此这是既有工作树换行表示，不是本轮修改。

## 3. 保留资产核验

对整理前 gzip 文件账本逐条检查以下路径，未发现缺失、大小变化或 mtime_ns 变化。它是逐文件元数据守恒，不冒充对这些大目录重算了全量内容 SHA。

| 目录 | 基线文件数 | 基线字节 | 缺失 / 大小或 mtime 改变 |
|---|---:|---:|---|
| `frontend/src` | 505 | 8,006,439 | 0 / 0 |
| `frontend/public` | 29 | 45,820,495 | 0 / 0 |
| `frontend/node_modules` | 40,108 | 663,616,274 | 0 / 0 |
| `frontend/.next/standalone` | 5,876 | 1,029,208,602 | 0 / 0 |
| `frontend/.bpai` | 3,939 | 323,177,213 | 0 / 0 |
| `frontend/.openbp` | 1,408 | 275,212,871 | 0 / 0 |

package.json（23,670 B）与 package-lock.json（356,352 B）同样逐条匹配整理前库存。工作盘点原有三个修改文件（文件扫描、文件索引、阅读登记）均存在，大小/mtime 与本轮开始时一致，未被整理覆盖或代为提交。

根三份业务原件仍在原地址，独立重算 SHA 与整理前一致：DOCX `285bf9e260dcdb7e5491deadad30427144ab575ef3c0dbc1228150a1b0940a19`；XLSX `c520804293518e5b6b2c55d98a7ba57ccd06f5a20a6a98e8a10ea825d2d5c722`；发布 V5 HTML `53bff9d66df08035bfe9f88f426ca49bc2cb1301b659224f7e6d1fff46068a0b`。

## 4. 删除与移动回执

独立核对 workbench 的 manifest、prepare、result 三者 manifest SHA 一致，12 个 action ID/源路径对应，状态均 PASS；每项回执字节等于 prepare，当前源均已不存在。总删除 **856,623,588 B**，与候选一致，不宣称等同磁盘实际释放量。

Chili 的清只读日志恰好 3 项，为嵌套 Git 同一 pack 的 `.idx/.pack/.rev`，与执行前发现一致。没有扩大到其他源或工作区外路径。脚本执行前审查与修复结论详见同目录审计第 9 节；本轮未再次运行删除脚本。

两个移动批次同样通过 manifest/prepare/result 一致性核对。另用独立文件遍历与 SHA256 实现对照 prepare，没有调用执行脚本的 snapshot 来重复证明自身：

| 当前路径 | 保留文件数 | 字节 | 路径集合 / 内容哈希 |
|---|---:|---:|---|
| `References/BusinessMap` | 112 | 37,668,735 | 与移动前清单相同，SHA 差异 0 |
| `References/BilibiliDashboard` | 6 | 48,048,560 | 与移动前清单相同，SHA 差异 0 |

两个旧目录均不存在。Business Map 由 115 变为 112 文件仅因已单独核对的三个重复 ZIP 被删；业务原件、源码、预览及证据目录保留。

在新路径 `References/BusinessMap/bm-game` 实际重跑 `node game.test.cjs`：退出码 0，first/proposal/urgent 三场景完成，审计记录数 13/14/14，错误选择、顺序门槛和恢复断言通过。未运行会重写 HTML/ZIP 的 package.py。

## 5. 手册、注册表与新路径链接

手册的 OpenBP 保留/删除说明与现态对应，明确原位保留、运行依赖和生产包保全、数据目录不是缓存。业务章节保留根原件/工作盘点原址，准确描述 Business Map/B站移位及旧在线启动器后端缺失。退役来源说明已有三处活动导航，不将历史架构引用假装为现有运行代码。

`components.json` 四个重点对象的角色、路径、成熟度、数据政策与本次检查一致；`preservation_semantics` 明确关键锚点不是删除白名单，避免注册表只列几个路径而误删其余内容。整合状态仍为尚未完成统一 Mikoshi runtime，没有把目录整理写成业务平台已上线。

实际运行 `python tools/curation/verify_registry.py`：10 个组件、111 条路径，issues 为空、PASS。另独立解析根 README、COMPONENTS、REPOSITORIES、Product/COMPONENT_MAP、BRIEF、HANDOFF、OpenBP README/退役说明/两个 Construction 导航中的 103 个本地 Markdown 链接，缺失 0。

新位置下全部 HTML 的 12 个本地 src/href 目标检查，缺失 0。该检查不读取浏览器 localStorage，也不证明旧地址保存的标注、布局或演练进度已自动迁移；手册已区分离线快照与缺失在线后端。

## 审查意见与局限

阻断：无。普通建议：无须为本轮再扩大到完整产品测试；继续按显式范围提交 OpenBP 的参考源码删除与四份文档，并由根任务核对提交/远端同步结果。本报告没有把尚未执行的 Git 收尾列为已经通过。

本分工只新增本审查报告并执行只读/离线检查，没有修复或改写来源。未联网、未启动应用、未调用模型、未迁移数据库、未读出凭据；未重做大运行目录的全量哈希或验证外部服务能力。以上 PASS 限定于清理范围、资产保全、静态类型、离线演练及导航一致性。
