# SBS-0004 最终限定复核

日期：2026-10-18。结论：**所列操作、汇总与前三项文档建议复核通过，未发现新的实质阻断。根 Git 收尾仍以实际回执验收，本复核不将 AC07 提前记为 PASS。**

## 核对结果

- 当前 7 份 actions manifest 的实际 SHA256，逐一与对应 prepare 记录、apply result、operation-summary 匹配；动作 ID 集合、数量与每项 PASS 状态一致。
- 7 批合计 **61 动作**：57 删除、4 移动；删除字节相加为 **27,208,466,811 B**，移动字节相加为 **2,550,246,507 B**，与汇总和验收文档一致。
- 库存差额：68,320,652,911 − 41,112,385,518 = **27,208,267,393 B**，与 inventory_net_reduction_bytes 一致。它与删除账本相差 199,418 B；删除量和验收时点净减少量是两个口径，未混算移动为删除。
- 初次 Git 临时清理失败未列为成功动作；首次与重试 prepare 的 5 份输入快照完全相同，最终只统计成功重试一次。
- CF1 两个空 wrapper 的 final-cache prepare 均为 **0 文件、0 B**；不存在把旧父目录整树计作已删除的情况。
- 在已有 move 快照上独立应用“最具体 source 优先”，**48,826 个已移动文件**全部命中内层 move：CrawlerF1 48,774、独立 Skills 52；未命中随后空 wrapper 删除。两个移动目标目录存在。
- Business Map 三个已删除 ZIP 均优先命中自己的 delete 动作，而非外层目录 move；与 preservation-summary 的映射规则一致。
- 本轮只读取已有 JSON 账本并做加法、集合与映射核对，没有重算大型包 SHA256 或再次扫描整个工作区。

## 上轮建议闭环

1. `.pytest_cache` 与 Harness `.desktop-build` 已进入 actions-final-cache，并有 prepare/apply PASS；手册所述不再超前于执行事实。
2. COMPONENTS.md 第 116 行现明确区分保留的运行组件许可/激活机制，以及退役参考副本的许可、来源和恢复记录。
3. components.json 的 execution.preserve_paths 已保留两套完整 portable 根目录及 desktop/node_modules，避免仅列 bin 的歧义。

Harness 绑定说明仍保留私有 CODEX_HOME、配置再生与未启动旧会话的限制。验收文档明确根执行者另行独立核对绑定，未把绑定实施者自测冒充独立验收。

## 复核身份与限制

| 复核输入 | SHA256 |
|---|---|
| operation-summary.json | `9463a0109fd37fa1c5f88f1875badbb2912de7e98a65c2f3c602733e219d14c8` |
| preservation-summary.json | `a2d8b37713f9f0be25ff4c158453f4cc2409f56c3b0850eacb882ed8841f7161` |
| SBS/evidence/SBS-0004/acceptance.md | `14df84abcda4f643b9e858cd1b8e7f3b2a99eb8162c66642ec0df142e17d5546` |
| COMPONENTS.md | `7b65fe80535e4def1ae5edb3f789aa2de43959b2a2d3084bc1065430e31f5d86` |
| components.json | `3f1bb76f8c07607f2e04e29f8de6ab833f55780020de5a7914a07725b3135071` |

全局保全摘要使用文件集、大小、mtime；不是全局内容 SHA256 认证。CF1/Skills、VPC 216 项和选定移动材料的完整 hash 依赖其已保存专门证据，本轮没有重复计算。
之前完成的 Torpedo prefix/静态架构、Harness Node 语法检查仍只说明其限定离线边界；CF1 Doctor、OpenBP tsc、真实登录、模型效果与生产部署也不能互相替代。
读取的 acceptance.md 为 VERIFYING，AC07 为 PENDING：该表记录 OpenBP e8576db 已同步，而根提交/远端回执待完成。根执行者完成后应按真实 commit/push 证据更新状态；本文件不提前确认尚未发生的根 Git 操作。

## 根内容提交后的补充核对

根执行者随后报告内容提交及正常 push 完成，远端 ls-remote 为 `a33bca6224d970f029e90ce97fd956bd5deb2983`；本审查独立只读核对本地 HEAD、origin/main 跟踪引用及该提交对象，三者均为同一 SHA。未重复执行远端查询，远端即时状态依据根执行者的本次回执。
补读 `SBS/evidence/SBS-0004/repository-state.json`：OpenBP 为 `e8576dbf6ee4cafe9f11af616621b5dc39737f05` 且干净；Harness/Kiroshi/Torpedo/VCPAI 保持各自基线 HEAD 且无 tracked changes；工作盘点仅保留原三项修改。
因此 AC07 的**内容提交**证据已具备；最终验收状态及这次审查补充的收尾提交/同步仍由根执行者完成，不预先声称其已发生。此前输入 hash 对应 Git 收尾前快照，保留用于追溯。
