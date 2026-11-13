# SBS-0004 Runtime 独立审查与离线复核

日期：2026-10-18。结论：**当前精确 runtime 清理范围及离线检查通过；未发现阻断本次清理的操作风险。**
本审查不是产品功能、服务器上线、真实模型或数据迁移认证；整个 SBS 的其他批次仍由根执行者分别汇总。
对根整理工具、组件手册和跨批次清单独立审查；Harness 绑定修复由本审查者执行，其证据属于自校验，根执行者需另核对该唯一 JSON 改动。

## 1. 审查快照与覆盖

| 文件 | 完整阅读范围 | SHA256 |
|---|---:|---|
| `tools/curation/apply_manifest.py` | 175 行 | `a2d8e6adf39f472dc5cae5bd71cc9b3c7ec357752f6f58908905b68ac45b20e4` |
| `COMPONENTS.md` | 122 行 | `bf6c13ef98e9c4f0300d18c264b45b04f1cb71699ae6d09c249f6194938f4685` |
| `actions-runtime.json` | 203 行 / 28 动作 | `0bb789571d0d5b7742de71f39a26768a30f8ef1bd9e48581771b5889ea297209` |
| `actions-components.json` | 8 行 / 2 动作 | `b8151c0f0a32b5b4c77196deafb9f7d36246e8e9d6dcafb134a73d91653c9e5d` |
| `actions-crawler-vpc.json` | 40 行 / 5 动作 | `793ea019abcc79fbc1b8d79691780ed7faae06c3618aae8e4f1d60867d4a1bd9` |
| `actions-git-temporary.json` | 53 行 / 5 动作 | `0c574fea06b73a80310d557e6cb70010d245c653708d824e217f52e392d6b4fd` |
| `actions-references.json` | 8 行 / 2 动作 | `3430b1efa7e1cfbd69c1e6465bb90c30445f5ce80a38996cb492b1de3e26dca2` |
| `actions-workbench.json` | 19 行 / 12 动作 | `4d117426723093bfa4216aad8cb7f5ae83cef73b7d45c0a7ad9855430f2ea6b9` |

动作文件位于 `Product/curation/SBS-0004/`。补读 components.json 的 execution/knowledge/perception 三项及路径、保留策略；没有泛审其他生产源码。
其余组件候选只审查清单的路径、动作语义、恢复声明和与手册的明显矛盾，不替代负责审计者的 VCPAI payload、CF1 分发或工作台参考源逐文件证明。
审查时新增清单及后续修订不自动包含在以上 hash 的结论内；最终实际结果以各批次 prepare/apply 记录为准。

## 2. 操作风险检查

- `apply_manifest.py:25–42` 拒绝绝对/越界/root 目标，逐祖先检查符号链接和 Windows reparse point；允许 Git 内部路径必须有动作显式标记。
- `53–75` 遍历对象再次拒绝链接，记录目录与每个文件的大小/mtime；移动动作还记录全部 SHA256。
- `84–109` 固定实际 cwd 与 manifest workspace，检查源重叠、目标不存在、目标不在源内、审计文件不在被修改源内。
- `111–130` prepare 不覆盖既有执行记录；apply 校验 manifest hash，并在首个变更前复核全部输入。
- `138–149` 每项变更前再次校验路径与快照；移动后逐文件 SHA256、mtime、大小和目录结构比对。
- `151–167` 删除后检查源不存在；失败记录 FAILED 并中止，不继续执行剩余动作。现有执行记录禁止盲目重跑。
- 当前六份清单的 source/destination 都是工作区内明确相对路径，没有通配符、原项目删除或整盘清理。
- reference 整体移动必须在该树内重复 ZIP 清理之后准备快照；清单 scope 已说明顺序，不应把不同 manifest 当并行事务。
- Git 临时对象删除只明确列出 5 个临时文件，未包含 refs/有效 pack/整个 objects；其 fsck 和无人使用前提由根执行者的专门证据承担。
- workbench 的完整参考目录删除明确写出外部原件恢复、许可和 nested Git；并未把“被忽略”自动等同“可删除”。

未发现当前精确清单的阻断问题。以下是工具能力边界，不能在手册里宣称为不存在：

1. 删除不会备份原字节；recoverability 来自各动作已有原件或可再生前提。批次非原子事务，失败时可能已有部分 PASS，必须逐项恢复/继续，不能自动整批重放。
2. 只有 `move` 或 `hash_contents=true` 才对 prepare/apply 文件内容做 SHA256；其他项只比较名称、大小和 mtime。runtime 的两个归档已有独立全量 SHA256 证据，但本次执行账本未重复内容 hash；今后高价值重复包建议开启 `hash_contents`。不要事后改写本次清单来制造“当时已启用”的记录。
3. `.git` 显式许可检查当前只匹配 source 路径中的大小写敏感 `.git`，不检查删除树内部的所有嵌套仓；已审查动作可用，未来将脚本泛化时宜做 Windows 大小写规范化及删除树的嵌套 Git 检查。
4. 该工具没有操作系统级目录锁，也未声明可抵抗另一进程在最后检查后替换目录。适用于当前受控、无活跃产物写入的清单，不宜扩展成对任意不可信工作树的通用清理服务。

## 3. 手册与保留资产核对

- `COMPONENTS.md:56–64` 正确保留 Rust、两套完整引擎、Studio、私有数据、许可和依赖；明确多人/长期 Agent/服务器调度仍待实现，不把整理当能力上线。
- `:60` 正确区分已修桌面绑定、动态构建器、app 私有 CODEX_HOME 与用户全局 home，并链接具体修复证据；本次没有替用户恢复旧会话。
- `:68–76` 正确保留 Torpedo 核心、测试、.venv、OCR worker、数据库与孤立字节码；说明 47 个包装入口的绝对路径风险，未误称 .venv 是可移植安装包。
- `:80–82` 正确将 Kiroshi 定位为小型研究/合同仓，未承诺生产 daemon 或擅自清理外部模型。
- `:88–94` 明确 VCPAI 老版安装器不等于新版重复字节，虚拟玩家与企业工作 Agent 权限不同，真实数据库与研究成果不属于缓存。
- `:108–114` 正确说明根/子 Git、忽略运行资产、本地账本与恢复边界；没有将 Git commit 误称完整运行环境备份。

收尾建议（已通知根执行者，不阻断 runtime 清理）：

- `:72` 当时写“删除……pytest 缓存”，但当前已执行的 runtime manifest 只含 25 个 Torpedo pycache 目录，不含 `.pytest_cache`。根执行者已表示将另列动作处理或按实际修正文案；必须以最终结果闭环，不能提前当已完成。
- `:116` “许可文件和原激活机制全部保留”过宽：退役参考源整树删除可能包含本副本许可文件。建议明确“运行组件许可与激活机制保留；退役参考副本的来源、许可和恢复位置留记录”，与源码审计一致。
- components.json 的 `execution.preserve_paths` 当时仅列两个 portable `/bin`；建议改列完整 portable 根目录，并包含 desktop/node_modules 或声明清单非穷尽，避免未来自动整理误删 codex-resources/codex-path。

## 4. 已执行的清理后离线检查

获得根执行者通知 runtime 清理完成后才运行；Python 使用 `-B`，prefix 检查额外使用 `-I`。未运行 pytest、Dev.bat、prepare_runtime、WSL、应用服务器或模型。

| 检查 | 实际结果 | 本地证据 |
|---|---|---|
| runtime prepare/apply 回执与源路径 | PASS；28 项，331,304,085 B；28 源路径均不存在 | `.local/curation/SBS-0004/runtime.json`、`runtime-result.json` |
| Torpedo 虚拟环境 prefix | PASS；Python 3.11.9，sys.prefix 精确为当前副本 `.venv` 且与 base_prefix 分开 | `runtime-review-venv-prefix.log` |
| Torpedo 架构静态检查 | PASS；335 production files、29 grandfathered debt、0 import cycles | `runtime-review-architecture.log` |
| Harness Node 语法 | PASS 5/5：build/backend/main/preload/protocol.cjs | `runtime-review-node-syntax.json` |
| 保留对象与副本 Git | scripts/__pycache__ 仍在；Harness/Torpedo/Kiroshi status 均 0 行 | 本轮只读复核工具回执 |
| Harness 桌面绑定 | 新 SHA256 保持 `7aa41ce6df6ee456d73d4cbd9c8e9cd450d62386ff4d7ae4cbe1041d875ae2fa` | `repair-harness-binding.md` 与只读复核 |

表内简写日志均位于 `.local/curation/SBS-0004/`，不随根 Git 上传完整本地账本。
架构基线通过不意味着 29 项既有债务消失；Node --check 不加载 Electron，prefix 检查不导入业务依赖；这些证据只覆盖本轮清理后的相应静态/解释器边界。
绑定自校验保留了原项目文件、build.cjs 与私有 config；私有 config 的旧路径由下次正常初始化重生，尚未进行真实启动验证。

## 5. 结论边界

本轮 runtime 清理未删除源码、测试、完整运行依赖或独有数据库，保留了已识别孤立字节码；当前离线检查与路径复核通过。
根 SBS 最终验收前，仍需汇总其他动作结果、前后空间、补充缓存动作、许可措辞/注册表收尾，以及根与子仓真实提交/同步状态。不能把本文件当全部组件已可直接上线的证明。
