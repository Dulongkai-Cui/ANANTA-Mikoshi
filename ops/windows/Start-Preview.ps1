# Run the existing production build. Scheduling belongs to Windows Task Scheduler.
# Keep this file ASCII-compatible so Windows PowerShell 5.1 can read it without BOM.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$appDir = Join-Path $projectRoot 'frontend\mikoshi-web'
$nodePath = Join-Path $env:ProgramFiles 'nodejs\node.exe'
$logDir = Join-Path $projectRoot '.local\preview-runtime'
$child = $null
$job = $null
$runLog = $null
$result = 1

try {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $runLog = Join-Path $logDir "autostart-$stamp.log"
    function Write-RunLog([string]$Message) {
        Add-Content -LiteralPath $runLog -Encoding UTF8 -Value "$(Get-Date -Format o) $Message"
    }

    Write-RunLog "Starting production preview; launcher PID=$PID"
    foreach ($required in @($nodePath, (Join-Path $appDir '.next\BUILD_ID'),
            (Join-Path $appDir 'node_modules\next\dist\bin\next'))) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
            throw "Required file missing: $required. No install or build was attempted."
        }
    }
    $listeners = @(Get-NetTCPConnection -State Listen | Where-Object LocalPort -eq 3108)
    if ($listeners.Count -gt 0) {
        throw "Port 3108 is already in use (PID: $($listeners.OwningProcess -join ',')). No process was changed."
    }

    Add-Type -Path (Join-Path $PSScriptRoot 'PreviewProcessJob.cs')
    $job = New-Object Mikoshi.PreviewProcessJob
    $env:NODE_ENV = 'production'
    $stdout = Join-Path $logDir "autostart-$stamp.out.log"
    $stderr = Join-Path $logDir "autostart-$stamp.err.log"
    $child = Start-Process -FilePath $nodePath `
        -ArgumentList @('node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3108') `
        -WorkingDirectory $appDir -WindowStyle Hidden `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    $job.Attach($child.Handle)
    Write-RunLog "Node PID=$($child.Id); address=127.0.0.1:3108; build=$((Get-Content -LiteralPath (Join-Path $appDir '.next\BUILD_ID') -Raw).Trim())"
    $child.WaitForExit()
    $result = $child.ExitCode
    Write-RunLog "Node exited with code $result"
} catch {
    if ($runLog) {
        Write-RunLog "ERROR: $($_.Exception.Message)"
    }
    Write-Error -ErrorRecord $_ -ErrorAction Continue
    $result = 1
} finally {
    if ($null -ne $job) { $job.Dispose() }
    if ($null -ne $child) {
        # Stop only the process object created by this invocation if the wrapper fails.
        if (-not $child.HasExited) { $child.Kill(); $child.WaitForExit() }
        $child.Dispose()
    }
}
exit $result
