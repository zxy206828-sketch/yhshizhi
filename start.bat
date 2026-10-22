@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  壹号食志 · 朋友圈文案工坊
echo  正在启动本地服务...
echo.
node server.js
if errorlevel 1 (
  echo.
  echo  启动失败，请确认已安装 Node.js 18+。
  pause
)
