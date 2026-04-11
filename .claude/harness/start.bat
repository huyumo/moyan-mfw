@echo off
REM Harness 快速启动脚本 (Windows 版本)
REM 用途：在会话开始时一键运行所有检查

echo ======================================
echo   Harness 验证环境 - 会话开始检查
echo ======================================
echo.

cd /d "%~dp0"

echo >>> 运行 session-start 检查...
call npm run hook:session-start
set RESULT1=%errorlevel%

echo.
echo >>> 运行 teammates 检查...
call npm run hook:teammates
set RESULT2=%errorlevel%

echo.
echo ======================================
echo   检查完成
echo ======================================

if %RESULT1%==0 if %RESULT2%==0 (
    echo ✅ 所有检查通过，可以开始工作
    exit /b 0
) else (
    echo ❌ 有检查未通过，请先修复问题
    exit /b 1
)
