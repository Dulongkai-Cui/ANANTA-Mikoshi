@echo off
setlocal
cd /d "%~dp0.."
set PYTHONUTF8=1
if exist "C:\Users\11409\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
  "C:\Users\11409\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" "work\unified\system_server.py" --open
) else (
  py -3 "work\unified\system_server.py" --open
)
if errorlevel 1 pause
