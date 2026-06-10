@echo off
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..

if exist "%ROOT_DIR%\api\.venv\Scripts\python.exe" (
  "%ROOT_DIR%\api\.venv\Scripts\python.exe" "%SCRIPT_DIR%run-api.py" %*
  exit /b %ERRORLEVEL%
)

py -3 "%SCRIPT_DIR%run-api.py" %*
if %ERRORLEVEL% EQU 0 exit /b 0

python "%SCRIPT_DIR%run-api.py" %*
