# SBS-0004 组件整理记录

本轮按用户2026-10-18最新指令实施实际裁剪与规整。工作盘点原件、唯一研究数据、核心源码、锁文件、许可证、现成离线运行依赖优先保留。

## 执行前基线

- 根仓起点：`9653fb10a85f7c2a11ef3748aa82c2d25cee645c`，已同步远端。
- 全工作区：292,689个文件，68,320,652,911字节。统计为逻辑文件大小，含Git；跳过16个reparse point，不声称等于磁盘实际释放空间。
- 逐文件库存：本地`.local/curation/SBS-0004/before-files.csv.gz`；汇总`before-summary.json`，0读取错误。
- 工作盘点原有三个阅读索引修改保持不动；VCPAI原有209个未跟踪成果和7个本地大文件保持不动。
- 子仓独立，不把根仓Git同步说成运行包/数据已备份。

## 操作机制

每批动作先写JSON manifest（确切源路径、目的路径、理由、恢复方式），再用`tools/curation/apply_manifest.py prepare`冻结全部文件的大小/mtime清单。`apply`在实际操作前复核全批与每项；任何变化、越界路径、链接/junction、目标已存在或操作源重叠都会拒绝。移动另作全文件SHA-256前后核验。日志保留在本地审计目录，失败不能盲目重跑。

逐项理由和恢复约束以本目录manifest为准；“可重建”不表示保留旧构建产物的逐字副本。`_git_backups`保留原历史和私有引用，本轮不把它们当缓存删除。工作区之外的原项目只读。

## 审计与结果入口

- [工作台与业务资料审计](audit-workbench-business.md)
- [执行、知识与感知审计](audit-runtime-knowledge.md)
- [采集与VPC审计](audit-crawler-vpc.md)
- 最终组件位置、启动依赖与接入缺口统一维护在根组件手册；本目录保存本次操作证据，不作为新的业务状态来源。

## 已执行结果（易读版）

**工作区由68.32GB降至约41.11GB，减少约40%。** 共完成61项精确操作：57项删除/清理、4项整树移动。按执行清单删除27,208,466,811字节，另有约2.55GB文件完成哈希守恒移动。验收库存的净减少为27,208,267,393字节；差额包含新文档、验证工具和环境配置变化。统计均为逻辑文件长度，不是NTFS实际分配空间；库存点在最终Git收尾之前。

| 批次 | 实际动作 | 删除逻辑字节 |
|---|---|---:|
| VPC/CF1 | 旧3安装器、可从最新安装器恢复的build stage/installer-source、与目录完全一致的2个CF1 ZIP | 24,088,517,566 |
| 根Git临时材料 | Git识别为garbage的5个遗留临时文件，保留所有有效对象/引用/备份 | 1,931,125,041 |
| OpenBP及Business Map | 开发/测试缓存、CAD重复dist、退役研究源码副本、BM重复ZIP和空外层目录 | 856,623,588 |
| Harness/Torpedo | 2个重复引擎归档、26个有源Python缓存目录 | 331,304,085 |
| 收尾 | pytest缓存、桌面构建stage、2个空解压外壳、本次工具pycache | 896,531 |

精确机器回执见[operation-summary.json](operation-summary.json)，保全对照见[preservation-summary.json](preservation-summary.json)。新增61项操作不是61个业务功能；本轮没有实现统一服务器运行。

## 目录现在怎样用

| 原位置 | 新位置/处理 | 使用说明 |
|---|---|---|
| CrawlerF1-CleanComplete/CrawlerF1-CleanComplete | `Components/CrawlerF1` | 完整运行包；四个环境已按新路径重定位 |
| CrawlerF1-Skills/CrawlerF1-Skills | `Components/CF1-Skills` | 独立安装/注册的13技能包；内置技能也保留 |
| OpenBP_Business Map | `References/BusinessMap` | 保留112文件：源资料、五原型与预览；只删3个重复ZIP |
| 无限大B站数据系统 | `References/BilibiliDashboard` | 6文件全保留；旧在线后端缺失限制原样登记 |
| OpenBP/OpenBP/Claude源码、tmp_chili3d_official | 从活动工作区退役 | [原件、许可与恢复说明](../../../OpenBP/OpenBP/RETIRED_REFERENCE_SOURCES.md)；当前业务运行无引用 |
| 其余独立仓、工作盘点、根3份业务原件 | 保留原路径 | 避免虚拟环境、运行数据、既有阅读登记的绝对路径失效 |

继续工作优先读[组件手册](../../../COMPONENTS.md)；[components.json](../../../components.json)记录10类资产的稳定ID、路径、依赖和接入边界。核心能力不靠“目录名看起来无用”来裁剪。

## 保留了什么

- 工作盘点4,124文件/5.56GB整树文件集、大小与mtime不变，原有3份阅读索引修改保留；根需求docx、进度xlsx和发布V5原位保留。
- VPC的216份保护文件共6.65GB，全量SHA256不变；209个未跟踪成果不上传，最新2.0.7安装器、vendor、源码/锁文件/本机依赖完整保留。
- CF1的48,774文件全量复算：48,770文件不变，仅4个`pyvenv.cfg`按授权重定位，共增加244B；独立Skills的52文件全部不变。
- OpenBP主src/public、生产standalone、node_modules、真实`.bpai/.openbp`；Harness完整双引擎、Rust源码、Studio和私有状态；Torpedo环境、OCR EXE、源码/测试/数据库；Kiroshi全库均保留。
- `_git_backups`3,800文件/8.71GB全部保留。它们保存旧历史/私有引用，不当普通缓存；没有改写共享历史。
- 原项目目录只读；退役参考副本有完整外部原件哈希对应。旧2.0.4/5/6安装器原始字节不再保留，本轮保留当前分发能力，不能声称可精确恢复旧版本安装器。

## 验证与限制

[工作台独立审查](review-workbench.md)、[运行组件审查](review-runtime.md)、[采集搬迁验证](verification-crawler-vpc.md)通过。OpenBP删除前后类型检查通过；新路径BM三场景测试通过；Torpedo解释器归属/架构检查与Harness五脚本语法通过；CF1 Doctor的17项检查及禁止网络/子进程的内存HTML解析通过。注册表10组件/111路径通过，受管Markdown导航无失效链接。

根Git对象检查在清理前后均成功；第一次删除在首文件因Windows只读属性停止、没有删掉文件，补充精确只读处理后通过，失败日志仍保留。删除工具不是事务备份器，也不对并发恶意改动提供锁保护；操作在已冻结、已审阅的范围内逐项执行。

真实多人登录、外部服务、模型、浏览器登录、采集、桌面会话、服务器上线均未在本次验证范围。旧B站在线后端缺失、Torpedo虚拟环境路径约束、部分组件未接通等已有边界没有被掩盖。正式验收见[SBS-0004验收](../../../SBS/evidence/SBS-0004/acceptance.md)，提交范围见[Git收尾](git-closeout.md)。
