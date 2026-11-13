# SBS-0004 Git收尾

本步开始前根仓`9653fb10a85f7c2a11ef3748aa82c2d25cee645c`已经同步，按用户“做了就直接下一步”的指令直接整理。

## OpenBP源码仓

- 基线`54e2c53a035fe0049c8fb3d6e0290a9690c3268b`。
- 整理提交`e8576dbf6ee4cafe9f11af616621b5dc39737f05`，已正常推送现有私有origin/main，`ls-remote`核对一致。
- 唯一跟踪变化：退役`Claude源码`4,002个文件、3个导航注记、新增`RETIRED_REFERENCE_SOURCES.md`。整个参考源码仍可从前述基线恢复；忽略依赖以外部原件与原哈希清单恢复。
- 没有提交`.bpai/.openbp`、缓存、数据库、其他未跟踪资料，没有修改主产品运行源码/锁文件。Chili参考副本与缓存本来不属于主仓跟踪内容。

## 其他子仓与本地资料

Harness、Torpedo、Kiroshi、VCPAI保持原分支与HEAD；绑定/环境调整为本地生成配置，不强行提交绝对机器路径。工作盘点原有三个索引修改仍留在原工作树，不夹带提交。

CF1和独立Skills、Business Map原件、VPC研究/大文件、所有备份都保留本地。根Git精确忽略运行包与本地账本；忽略不等于已有异地备份。参考素材移位不改变许可或数据发布范围。

## 根仓

提交范围为组件手册/注册、原迁移合同导航、治理交接与SBS、精确动作/审查/验收摘要、整理辅助脚本，以及原已跟踪B站6文件的完整移动。没有将独立仓或新原始业务资料递归纳入根仓。

根内容提交`a33bca6224d970f029e90ce97fd956bd5deb2983`已正常推送，`ls-remote origin refs/heads/main`返回同SHA。44个根跟踪变更含6个100%内容不变的B站文件移动；新增运行包、Business Map原件与全部本地账本均未上传。最终验收状态和复核报告随后作正常收尾提交，并在交付时再次核对HEAD/远端。完整本地prepare/apply/文件哈希账本保留在`.local/curation/SBS-0004`，不随根提交上传。

最终六子仓分支、HEAD及工作树见[repository-state.json](../../../SBS/evidence/SBS-0004/repository-state.json)。根最终工作树以收尾提交后的现场status为准；本文件不伪造尚未生成的自身提交SHA。
