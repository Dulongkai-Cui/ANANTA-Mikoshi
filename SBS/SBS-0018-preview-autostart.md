# SBS-0018 登录 Windows 后自动启动 Mikoshi

状态：ACCEPTED
日期：2026-10-20。实施者：Codex；验收者：未参与实现的独立审查者。
前置：[SBS-0017](SBS-0017-cpolar-preview.md) ACCEPTED，含两次例行恢复与独立核验。
执行包：本文件 v1，需求来自用户明确选择“登录 Windows 后自动启动 Mikoshi（推荐）”。

## 目标、基线和范围

当前重启后 cpolar 自动恢复，但前端未启动导致502。本步将现有生产构建绑定127.0.0.1:3108，由当前用户登录事件自动启动，保留日志、重复启动保护和停用方法。

根仓 `D:\产品孵化器\OpenBP_ ANANTA Mikoshi`，main，HEAD `5d888802504073bfa1f52f000848c6c18baabba4`；暂存为空，前序文档及frontend大量未提交成果保留。前端非独立Git仓，遵守其AGENTS及已读本地Next CLI文档。当前BUILD_ID `qeil5n2-jXfFUSNRKAkiL`，前次手动恢复PID50716。Windows计划任务能力已检查；目标任务名 `Mikoshi-Preview-AtLogon` 尚不存在。

改动限定 `ops/windows/` 启动/注册脚本，当前SBS、索引、交接、产品授权记录与本步证据，以及该专属计划任务。日志放已忽略的 `.local/preview-runtime/`。

不改业务源码、依赖、构建、浏览器数据、cpolar隧道、防火墙、电源/睡眠策略或其他启动项；不提交/推送，不重启电脑。公网范围沿用用户已确认的演示预览。

## 实施计划

1. 记录现有构建与源码/public指纹。准备可读脚本，先检查Node、构建和端口，存在任何监听时不争抢或杀进程。
2. 使用Windows计划任务，当前用户Interactive、Limited权限、登录触发；后台无窗口、不存密码、无72小时自动终止；只运行当前生产构建。重复运行IgnoreNew，失败最多重试3次、间隔1分钟。输出与错误日志分开。
3. 注册并读取实际任务配置；精确核对原PID/命令/创建时间后停止本次手动预览，交由任务启动。验证本机和既有公网HTTPS。
4. 测试重复启动不产生第二监听；测试任务停止与重新启动、失败退出码/重试设置。仅控制此预览任务及其核实归属的进程。若停止任务后子进程残留则先修复停止方式，不能伪称停止成功。
5. 写明启动、停止、禁用及恢复流程，独立复核后更新SBS/索引。登录触发用实际注册配置验证，本轮不注销或重启用户电脑；不将手动运行任务称为实际重启测试。

## 合同与风险

只增加操作系统层的启动入口，不改变应用或业务数据合同。路径移动、Node/构建删除、电脑关机/睡眠、未登录Windows及外网/cpolar故障仍会影响分享；本步不是正式服务器部署。任务不唤醒电脑、不保存登录凭据、不申请最高权限。启动脚本非零退出才能触发有界重试；端口占用明确记错，不接管未知服务。

回滚：停用/删除本步专属任务，停止其核实归属的进程，再按SBS-0017手动启动同一构建。保留日志和用户数据；不清理原有进程或其他任务。

## 验收标准

| ID | 标准 | 证据 |
|---|---|---|
| AC1 | 仅当前用户登录触发，Interactive/Limited，无密码、无最高权限；绝对脚本路径正确，后台隐藏，执行时间无限制，IgnoreNew及最多3次/1分钟失败重试 | 实际注册任务配置与脚本审查 |
| AC2 | 任务真实启动同一生产构建，仅监听127.0.0.1:3108；本机与既有公网/login返回200且包含Mikoshi | PID、启动日志、BUILD_ID及HTTP检查 |
| AC3 | 重复启动不增加监听或替换进程；任务可停止并释放3108，再启动后恢复；端口冲突不杀未知进程、错误如实记录 | 实际操作记录及失败路径验证 |
| AC4 | 业务源码/public/构建指纹不变，其他任务和隧道未修改；使用说明包含启停、禁用、日志和边界，独立审查通过 | 前后指纹、限定操作记录、文档与独立报告 |

## 验证和实施记录

只跑PowerShell语法检查、计划任务/进程/端口与本机及公网HTTP定向检查。不运行无关前端业务全量测试；不购买资源或发消息。READY保存后开始实现。

READY已先保存。源码/public/包文件/BUILD_ID共127项指纹存于 `.local/sbs-0018/app-before.json`。已核实原PID50716创建于22:03:42，命令为本次预览的Next生产启动；任务名未被占用。

首次注册及运行成功：任务Interactive/Limited、PT0S、IgnoreNew、3次/1分钟失败重试；端口冲突脚本返回1且保留PID50716。交接任务后Node PID32680，本机200。重复启动保持PID，但首次Stop-ScheduledTask留下Node子进程，AC3暂FAIL，未跳过此失败。修复为给本次子进程分配Windows Job Object，关闭启动器时由操作系统终止其子进程；仅绑定本次创建的Node，未纳入其他进程。随后重验停止/启动。

修复后22:12真实验证：任务PID33728重复启动保持不变；Stop-ScheduledTask后3108无监听、任务Ready，再启动成功。22:13最终Node PID15488，任务Running，仅127.0.0.1:3108；本机/公网login均200且包含Mikoshi，stderr为空。实际触发器MSFT_TaskLogonTrigger/当前用户、延迟15秒；未实际注销/重启电脑。自测AC1–AC4 PASS，进入VERIFYING。

证据：`.local/sbs-0018/task.xml` 实际配置、`first-task-launch.json` 首轮运行、`stop-check.json` 修复后启停、`runtime-check.json` 最终可达性、`app-before.json`/`app-after-check.json` 127项指纹0变化；启动日志 `.local/preview-runtime/autostart-20261020-221250-146.*.log`。这些本机证据不含密码或令牌，未提交。交付[使用说明](../Product/handoffs/SBS-0018/DELIVERY.md)。

## 验收记录

AC1–AC4：独立审查者preview_recovery_check全部PASS，见[独立报告](evidence/SBS-0018/independent-review.md)。审查直接读取实际任务、进程和HTTP，独立重算127项指纹无变化；启停过程复核实现者真实记录及Job Object代码，未重复启停。保留首次停止失败及修复事实。

最终根main/HEAD `5d888802504073bfa1f52f000848c6c18baabba4`，暂存为空，无commit/push。用户已有未提交成果保留。SBS索引、CURRENT、BRIEF和旧分享说明已同步。实际登录/重启、三轮重试和完整.next目录指纹未实测；不扩大为正式持续在线部署。下次用户登录时由已启用任务触发，无需用户重新运行终端命令。

## 2026-10-22 例行恢复

运行计划READY：用户要求重新启动Mikoshi，后续业务修改尚未具体指定。本轮沿用已验收的Start-ScheduledTask操作，不新增编号开发步骤。检查任务Enabled/Ready，LastRun为10月22日13:51:55，LastTaskResult=3221225786（0xC000013A）；当天启动日志曾记录Node20072正常Ready，stderr为空，现3108无监听，本机拒绝连接、公网502。系统LastBootUpTime为10月21日14:20:45.5+08:00；不能把此次停止归因于今天重启或代码崩溃。BUILD_ID和根main/HEAD未变、暂存为空。

先运行既有专属任务，验证127.0.0.1:3108、本机及既有公网login200，再只读独立复核。必要时读取该任务事件，不扩大为修改启动机制、依赖、源码、数据、隧道或其他系统设置。回退仅停止本次任务，不删除资料。原验收为历史结论，本次恢复不代表已解决所有中断原因。

19:44执行完成：Start-ScheduledTask运行原专属任务，启动器PID13652、Node PID21996，任务Running，仅127.0.0.1:3108；Next日志Ready in 16.9s，stderr为空。原BUILD_ID未变；本机及既有公网/login均200且包含Mikoshi。日志 `.local/preview-runtime/autostart-20261022-194347-444.*.log`。未修改启动配置、源码、依赖、构建或业务数据；未执行commit/push。

19:45:58独立恢复复核PASS：preview_oct22_check只读实测本机/公网login均200且包含Mikoshi，任务Running（结果267009/0x41301），唯一监听127.0.0.1:3108归属Node21996、父13652；命令为现有Next生产启动。没有启停或修改资料；结论仅确认恢复可达，不代表此前退出根因已解决。
