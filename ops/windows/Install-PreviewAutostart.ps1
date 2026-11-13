# Register only this project's task; never replace an existing task silently.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$taskName = 'Mikoshi-Preview-AtLogon'
$runner = Join-Path $PSScriptRoot 'Start-Preview.ps1'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$powershellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$userSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value

if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "Missing runner: $runner" }
if (Get-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction SilentlyContinue) {
    throw "Task $taskName already exists. Inspect it before making changes."
}

$action = New-ScheduledTaskAction -Execute $powershellPath `
    -Argument "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`"" `
    -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userSid
$trigger.Delay = 'PT15S'
$principal = New-ScheduledTaskPrincipal -UserId $userSid -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskPath '\' -TaskName $taskName -Action $action `
    -Trigger $trigger -Principal $principal -Settings $settings `
    -Description 'Mikoshi production preview at current-user logon; loopback port 3108, existing build, no credentials.' |
    Select-Object TaskName, State
