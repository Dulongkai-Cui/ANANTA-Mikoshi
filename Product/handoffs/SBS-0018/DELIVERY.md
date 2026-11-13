# Mikoshi 登录自动启动

2026-10-20。用户选择登录Windows后自动启动；[SBS-0018](../../../SBS/SBS-0018-preview-autostart.md)已ACCEPTED，[独立AC1–AC4 PASS](../../../SBS/evidence/SBS-0018/independent-review.md)。

## 日常使用

登录本机Windows账户后，任务计划程序等待15秒，再后台启动Mikoshi现有生产构建。无需打开终端，随后访问：

- 本机：http://127.0.0.1:3108/login
- 当前同事预览：https://49a01cfd.r39.cpolar.top/login

任务名 `Mikoshi-Preview-AtLogon`，位于“任务计划程序库”根目录。仅当前用户登录触发、普通权限运行，不保存密码。cpolar继续使用既有服务与隧道，本步未改其配置。临时域名以后若变化，以cpolar在线隧道界面为准。

## 手动启动、停止或关闭自动启动

以下命令在本机当前用户PowerShell执行，也可在任务计划程序中对该任务选择运行、结束或禁用。

立即启动（已经运行则不多开）：

```powershell
Start-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
```

停止当前预览（下次重新登录仍会启动）：

```powershell
Stop-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
```

关闭自动启动并停止当前预览：

```powershell
Disable-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
Stop-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
```

重新启用并立即启动：

```powershell
Enable-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
Start-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
```

查看状态：

```powershell
Get-ScheduledTask -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
Get-ScheduledTaskInfo -TaskPath '\' -TaskName 'Mikoshi-Preview-AtLogon'
```

运行中LastTaskResult可能为267009（0x41301，表示正在运行），不能据此判断失败。任务失败退出最多重试3次，每次间隔1分钟；端口冲突会报错并保留占用者，不自动抢占或杀未知进程。

## 文件与日志

- [启动脚本](../../../ops/windows/Start-Preview.ps1)：只使用既有Node和生产构建，固定127.0.0.1:3108。
- [进程清理辅助](../../../ops/windows/PreviewProcessJob.cs)：Windows Job Object，仅绑定本次启动的Node；结束任务时同时清理其子进程。
- [安装脚本](../../../ops/windows/Install-PreviewAutostart.ps1)：供任务删除后重新注册；任务已存在时拒绝覆盖。正常使用无需重跑。
- 日志：项目根 `.local/preview-runtime/autostart-时间.log`，以及对应 `.out.log`、`.err.log`。日志只保存在本机，未提交Git。

移动项目文件夹、删除Node或构建后，需要更新任务路径或恢复构建。脚本不会自动安装依赖、编译新版本或修改业务资料。

若需彻底撤销本步，先停止任务，再在任务计划程序删除此专属任务；保留项目和日志。随后仍可在项目根运行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\ops\windows\Start-Preview.ps1"` 手动预览，保持该进程运行。

## 验证与边界

已实际运行任务、重复运行、停止释放3108、重新启动，并验证本机/公网login均200。初次停止残留子进程的问题已保留在SBS记录中并通过Job Object修复；修复后真实停止验证通过。127项业务文件/public/包文件/BUILD_ID指纹不变。

本轮未注销或重启电脑；登录触发通过实际注册配置核验，启动脚本通过任务手动运行验证。电脑关机、睡眠、用户注销、未登录、网络或cpolar故障仍可能中断分享；未调整睡眠策略。当前设置是预览自启动，不是持续在线服务器或多人数据服务。公网访问范围和浏览器本机数据边界继续按[SBS-0017说明](../SBS-0017/DELIVERY.md)执行。
