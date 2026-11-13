# 当前仓库说明（2026-11-13）

当前目录是 Dulongkai-Cui/ANANTA-Mikoshi 的独立源码快照，origin 指向该协作仓库。下文记录原 OpenBP_Workspace 工作区和独立子仓历史，不能当成本目录的当前 remote 或要求把无关子仓克隆进来。

# 仓库与本地资料

核查日期：2026-10-18。顶层沿用独立治理仓，六个子项目保留独立仓库；不是submodule，也未迁移为单一代码仓。

SBS-0004整理后的完整资产位置、作用与运行限制统一见[组件手册](COMPONENTS.md)和[注册清单](components.json)。六子仓保留原物理路径；CF1移至`Components/CrawlerF1`，独立技能移至`Components/CF1-Skills`；Business Map与B站历史快照移至`References`。移动本地目录不等于新增异地备份。

## 仓库位置

| 本地目录 | 现有GitHub目标 | 核查时开发分支 |
|---|---|---|
| 根目录 | [OpenBP_Workspace](https://github.com/Dulongkai-Cui/OpenBP_Workspace) | main |
| OpenBP/OpenBP | [OpenBP_Dev](https://github.com/Dulongkai-Cui/OpenBP_Dev) | main |
| OpenBP_Harness | [OpenBP_Harness](https://github.com/Dulongkai-Cui/OpenBP_Harness) | main；另保留openai/codex上游 |
| OpenBP_Kiroshi | [OpenBP_Kiroshi](https://github.com/Dulongkai-Cui/OpenBP_Kiroshi) | main |
| OpenBP_Torpedo | [OpenBP_Torpedo_Dev](https://github.com/Dulongkai-Cui/OpenBP_Torpedo_Dev) | codex/wiki-torpedo-r1-usable-loop |
| VCPAI | [VCPAI](https://github.com/Dulongkai-Cui/VCPAI) | codex/player-upgrade-positioning-20261007 |
| 工作盘点 | [OpenBP_Workbook](https://github.com/Dulongkai-Cui/OpenBP_Workbook) | main |

进入某个仓库前重新核对当前分支，不用本表自动checkout。Torpedo和VCPAI的main较旧，不能假定main包含最新研究成果。

恢复环境时，先克隆根仓，再分别克隆组件到上述目录。已有目录不能被克隆命令覆盖；检查其中是否有未提交文件。分支从实际远端列出后选择，不在本文件提供会覆盖现状的一键脚本。

## Git接手基线

- 根仓原HEAD为`e1f4106`，原有11个跟踪文件，根仓开始时干净。
- 其余五个已配置组件的当前分支已用Git ls-remote联网核对，远端HEAD与本地一致；详见[接手基线](SBS/evidence/SBS-0001/git-baseline.md)。
- 工作盘点有三个索引文件的未提交阅读登记变更，属于此前阅读任务，本次不夹带提交。
- VCPAI开始时无remote/upstream。现有`_git_backups/VCPAI.git_20261018`保存原历史，`VCPAI_filter.git`是Claude留下的中间过滤副本。
- 已联网确认根仓和VCPAI目标均为私有；VCPAI当时默认分支为空，首次上传前仍需核对远端引用。

## VCPAI接手完成

VCPAI的三个业务分支已从隔离候选完成历史去敏和大文件过滤核验，首次推送至上述私有仓库，并逐一核对远端SHA。原工作目录已安全接续，origin与三个upstream已配置，当前开发分支不变。完整映射与保全证据见[Git结束记录](SBS/evidence/SBS-0001/git-closeout.md)。

209个未跟踪研究产物与7个本地大文件全部保留，216个文件SHA-256核对一致；它们未随本次Git同步上传。原始Git备份及中间过滤副本也保留在本地，含旧历史和私有引用，禁止mirror推送。原工作仓的私有临时refs同样只留在本地，日常使用当前分支的普通push。

## 资料边界

前端候选资源另放在 [frontend/fronted-skill](frontend/fronted-skill/README.md)：六个用户指定的公开上游仓库，均为独立浅克隆，保留 origin。它们不是上述六个 Mikoshi 产品子仓，也未作为 submodule；根仓精确忽略其源码目录，仅记录索引与 [版本清单](frontend/fronted-skill/sources.lock.json)。本轮 clone 只读取上游，无上游 push，也没有技能安装；仅克隆根仓无法取回这些资源，恢复方式见资源索引。

顶层`.gitignore`排除全部六个组件目录与`_git_backups`。备份目录可能含旧凭据和大型数据库，只用于本地恢复，不可提交或分发。

另精确排除完整CF1运行包、独立技能包和Business Map本地原件，防止根仓意外纳入大型分发依赖及原始业务资料。原有B站六文件继续由根仓跟踪，只改变存放路径；根目录三份业务原件仍按原路径跟踪。CF1迁移说明作为接口合同文档保留。忽略规则不代表这些资产不重要，恢复责任见组件手册。

Git忽略不会清除已提交历史；根仓提交不会包含子仓变更。大文件和业务数据库需要独立备份安排，本次保留本地文件，不创建未经用户要求的外部存储或上传。
