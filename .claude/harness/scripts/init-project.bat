@echo off
REM =============================================================================
REM Harness 项目初始化脚本 (Windows 批处理版本)
REM =============================================================================
REM 用途：将复制的 .claude 目录初始化为干净的项目环境
REM 场景：手动 cp .claude 到新项目后运行此脚本
REM =============================================================================

setlocal EnableDelayedExpansion

echo ============================================
echo Harness 项目初始化
echo ============================================
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "HARNESS_DIR=%SCRIPT_DIR%"
set "CLAUDE_DIR=%HARNESS_DIR%.."
set "PROJECT_ROOT=%CLAUDE_DIR%.."

echo 目标项目：%PROJECT_ROOT%
echo.

REM 确认执行
echo [!] 此操作将清理当前项目的 agent-memory 和输出文件
set /p confirm="是否继续？(y/N): "
if /i not "!confirm!"=="y" (
    echo 已取消
    exit /b 0
)

echo.

REM =============================================================================
REM 步骤 1: 清理项目特定记忆
REM =============================================================================
echo [1/5] 清理项目特定记忆...

set "AGENT_MEMORY_DIR=%CLAUDE_DIR%\agent-memory"

if exist "%AGENT_MEMORY_DIR%" (
    for /d %%D in ("%AGENT_MEMORY_DIR%\*") do (
        echo   - 清理：agent-memory\%%~nD\
        del /q "%%D\*" 2>nul
    )

    REM 创建空的 MEMORY.md
    (
        echo # Agent Memory Index
        echo.
        echo 本项目记忆由跨会话协作时自动创建和管理。
    ) > "%AGENT_MEMORY_DIR%\MEMORY.md"

    echo   [OK] 记忆已清理
) else (
    echo   [!] agent-memory 目录不存在，跳过
)

echo.

REM =============================================================================
REM 步骤 2: 清理 Harness 输出
REM =============================================================================
echo [2/5] 清理 Harness 输出...

set "OUTPUT_DIR=%HARNESS_DIR%output"

if exist "%OUTPUT_DIR%" (
    del /q "%OUTPUT_DIR%\*" 2>nul
    echo   [OK] output 目录已清理
) else (
    mkdir "%OUTPUT_DIR%"
    echo   [OK] output 目录已创建
)

echo.

REM =============================================================================
REM 步骤 3: 清理任务分析文档
REM =============================================================================
echo [3/5] 清理任务分析文档...

set "ANALYSIS_DIR=%HARNESS_DIR%analysis"

if exist "%ANALYSIS_DIR%" (
    del /q "%ANALYSIS_DIR%\*" 2>nul
    echo   [OK] analysis 目录已清理
)

echo.

REM =============================================================================
REM 步骤 4: 检查 team.json
REM =============================================================================
echo [4/5] 检查团队配置...

set "TEAM_JSON=%HARNESS_DIR%team.json"

if exist "%TEAM_JSON%" (
    echo   [!] team.json 已存在，请手动编辑
    echo       - members: 团队成员列表
    echo       - roles: 角色权限配置
) else (
    REM 创建默认 team.json
    (
        echo {
        echo   "version": "1.0.0",
        echo   "members": [
        echo     {"name": "PM-Agent", "role": "pm", "type": "agent"},
        echo     {"name": "Tech-Architect", "role": "lead", "type": "agent"},
        echo     {"name": "Backend-Dev", "role": "developer", "type": "agent"},
        echo     {"name": "Frontend-Dev", "role": "developer", "type": "agent"},
        echo     {"name": "Code-Reviewer", "role": "reviewer", "type": "agent"}
        echo   ],
        echo   "collaboration": {
        echo     "requireMultiAgentMeeting": true,
        echo     "requireTaskAssignment": true,
        echo     "requireCodeReview": true
        echo   }
        echo }
    ) > "%TEAM_JSON%"
    echo   [OK] team.json 已创建
)

echo.

REM =============================================================================
REM 步骤 5: 安装依赖
REM =============================================================================
echo [5/5] 安装 Harness 依赖...

cd /d "%HARNESS_DIR%"

where pnpm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call pnpm install
    echo   [OK] 依赖已安装 (pnpm)
) else (
    where npm >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        call npm install
        echo   [OK] 依赖已安装 (npm)
    ) else (
        echo   [ERROR] 未找到 pnpm 或 npm，请手动安装依赖
        echo       命令：cd %HARNESS_DIR% ^&^& pnpm install
    )
)

echo.

REM =============================================================================
REM 完成
REM =============================================================================
echo ============================================
echo [OK] 初始化完成！
echo ============================================
echo.
echo 后续步骤：
echo.
echo 1. 编辑团队配置
echo    code %TEAM_JSON%
echo.
echo 2. 编辑项目任务
echo    code %PROJECT_ROOT%\TASK.md
echo.
echo 3. 编辑项目指令
echo    code %PROJECT_ROOT%\CLAUDE.md
echo.
echo 4. 运行 Hook 测试
echo    cd %HARNESS_DIR% ^&^& pnpm start
echo.
echo 提示：
echo   - agent-memory 已清空，新会话中将自动创建项目记忆
echo   - 每个项目的记忆相互隔离，不会污染
echo.

pause
