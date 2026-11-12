@echo off
cd /d "%~dp0"
set "KASLANA_HUGO=%~dp0.local\hugo.exe"
if not exist "%KASLANA_HUGO%" set "KASLANA_HUGO=hugo"
"%KASLANA_HUGO%" server --bind 127.0.0.1 --baseURL http://localhost:1313/kaslana/
pause
