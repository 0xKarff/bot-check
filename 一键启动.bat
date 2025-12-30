@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ================================================================
:: Polymarket Copy Trading Bot - 一键启动 (Windows)
:: 双击此文件即可自动检查环境并启动
:: ================================================================

title Polymarket Copy Trading Bot

cd /d "%~dp0"
set ROOT_DIR=%cd%

cls
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║       Polymarket Copy Trading Bot - 一键启动         ║
echo ╚══════════════════════════════════════════════════════╝
echo.

set ERROR_COUNT=0
set ERRORS=

:: ================================================================
:: 检查 Node.js
:: ================================================================

echo 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] 未安装
    set /a ERROR_COUNT+=1
    set "ERRORS=!ERRORS!- 未安装 Node.js，请从 https://nodejs.org 下载安装\n"
    goto :check_results
)

for /f "tokens=1" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] %NODE_VERSION%

:: ================================================================
:: 检查 MongoDB
:: ================================================================

echo 检查 MongoDB...
tasklist /fi "imagename eq mongod.exe" 2>nul | find /i "mongod.exe" >nul
if %errorlevel% equ 0 (
    echo [OK] 运行中
) else (
    where mongod >nul 2>&1
    if %errorlevel% equ 0 (
        echo [!] 已安装但未运行
        echo   尝试启动 MongoDB...
        net start MongoDB >nul 2>&1
        timeout /t 2 >nul
        tasklist /fi "imagename eq mongod.exe" 2>nul | find /i "mongod.exe" >nul
        if %errorlevel% neq 0 (
            set /a ERROR_COUNT+=1
            set "ERRORS=!ERRORS!- MongoDB 未运行，请手动启动 MongoDB 服务\n"
        ) else (
            echo   [OK] 启动成功
        )
    ) else (
        echo [X] 未安装
        set /a ERROR_COUNT+=1
        set "ERRORS=!ERRORS!- 未安装 MongoDB，请从 https://www.mongodb.com/try/download/community 下载安装\n"
    )
)

:: ================================================================
:: 检查 .env 文件
:: ================================================================

echo 检查 .env 配置...
if not exist "%ROOT_DIR%\.env" (
    echo [X] 文件不存在
    set /a ERROR_COUNT+=1
    set "ERRORS=!ERRORS!- .env 文件不存在，请复制 .env.example 为 .env 并填写配置\n"
    goto :check_deps
)

findstr /r "^USER_ADDRESSES.*=.*0x" "%ROOT_DIR%\.env" >nul 2>&1
if %errorlevel% neq 0 (
    set /a ERROR_COUNT+=1
    set "ERRORS=!ERRORS!- 缺少配置: USER_ADDRESSES (要跟单的交易者地址)\n"
)

findstr /r "^PROXY_WALLET.*=.*0x" "%ROOT_DIR%\.env" >nul 2>&1
if %errorlevel% neq 0 (
    set /a ERROR_COUNT+=1
    set "ERRORS=!ERRORS!- 缺少配置: PROXY_WALLET (你的钱包地址)\n"
)

findstr /r "^MONGO_URI.*=.*mongodb" "%ROOT_DIR%\.env" >nul 2>&1
if %errorlevel% neq 0 (
    set /a ERROR_COUNT+=1
    set "ERRORS=!ERRORS!- 缺少配置: MONGO_URI (MongoDB 连接地址)\n"
)

if %ERROR_COUNT% equ 0 (
    echo [OK] 配置完整
) else (
    echo [X] 配置不完整
)

:check_deps
:: ================================================================
:: 检查依赖
:: ================================================================

echo 检查 npm 依赖...
if exist "%ROOT_DIR%\node_modules" (
    echo [OK] 已安装
) else (
    echo [!] 未安装，正在安装...
    cd "%ROOT_DIR%"
    call npm install >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] 安装完成
    ) else (
        set /a ERROR_COUNT+=1
        set "ERRORS=!ERRORS!- npm 依赖安装失败\n"
    )
)

echo 检查 Dashboard 依赖...
if exist "%ROOT_DIR%\web" (
    if exist "%ROOT_DIR%\web\node_modules" (
        echo [OK] 已安装
    ) else (
        echo [!] 未安装，正在安装...
        cd "%ROOT_DIR%\web"
        call npm install >nul 2>&1
        if %errorlevel% equ 0 (
            echo   [OK] 安装完成
        ) else (
            echo   [!] Dashboard 依赖安装失败
        )
    )
) else (
    echo [!] Dashboard 目录不存在
)

:check_results
echo.
echo ────────────────────────────────────────────────────────
echo.

:: ================================================================
:: 显示结果
:: ================================================================

if %ERROR_COUNT% gtr 0 (
    echo ╔══════════════════════════════════════════════════════╗
    echo ║                    启动失败                          ║
    echo ╚══════════════════════════════════════════════════════╝
    echo.
    echo 请解决以下问题后重试:
    echo.
    echo !ERRORS!
    echo.
    echo 提示:
    echo   - .env 文件在项目根目录
    echo   - 可以参考 .env.example 文件
    echo.
    pause
    exit /b 1
)

:: ================================================================
:: 全部通过，启动服务
:: ================================================================

echo ╔══════════════════════════════════════════════════════╗
echo ║                  环境检查通过!                        ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 正在启动服务...
echo.

cd "%ROOT_DIR%"

:: Start bot
echo [Bot] 启动跟单机器人...
start "Polymarket Bot" cmd /c "npm run dev"

:: Wait a moment
timeout /t 3 >nul

:: Start web dashboard
if exist "%ROOT_DIR%\web" (
    echo [Web] 启动 Dashboard...
    cd "%ROOT_DIR%\web"
    start "Polymarket Dashboard" cmd /c "npm run dev"

    timeout /t 3 >nul

    echo.
    echo ════════════════════════════════════════════════════════
    echo.
    echo   [OK] Bot 已启动
    echo   [OK] Dashboard 已启动
    echo.
    echo   打开浏览器访问: http://localhost:3001
    echo.
    echo ════════════════════════════════════════════════════════
    echo.

    :: Open browser
    start http://localhost:3001
)

echo.
echo 服务已在后台运行，关闭此窗口不会停止服务。
echo 要停止服务，请关闭对应的命令行窗口。
echo.
pause
