#!/bin/bash

# ================================================================
# Polymarket Copy Trading Bot - 一键启动
# 双击此文件即可自动检查环境并启动
# ================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Get script directory
cd "$(dirname "$0")"
ROOT_DIR="$(pwd)"

clear
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║       Polymarket Copy Trading Bot - 一键启动         ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=()
WARNINGS=()

# ================================================================
# 检查函数
# ================================================================

check_node() {
    echo -n "检查 Node.js... "
    if command -v node &> /dev/null; then
        VERSION=$(node -v)
        MAJOR=$(echo $VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$MAJOR" -ge 18 ]; then
            echo -e "${GREEN}✓${NC} $VERSION"
            return 0
        else
            echo -e "${RED}✗${NC} 版本太低 ($VERSION, 需要 18+)"
            ERRORS+=("Node.js 版本太低，请升级到 18 或更高版本")
            return 1
        fi
    else
        echo -e "${RED}✗${NC} 未安装"
        ERRORS+=("未安装 Node.js，请从 https://nodejs.org 下载安装")
        return 1
    fi
}

check_mongodb() {
    echo -n "检查 MongoDB... "
    if pgrep -x mongod > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} 运行中"
        return 0
    else
        # Check if installed
        if command -v mongod &> /dev/null; then
            echo -e "${YELLOW}⚠${NC} 已安装但未运行"
            WARNINGS+=("MongoDB 未运行")
            # Try to start it
            echo -n "  尝试启动 MongoDB... "
            if brew services start mongodb-community > /dev/null 2>&1; then
                sleep 2
                if pgrep -x mongod > /dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC} 启动成功"
                    return 0
                fi
            fi
            echo -e "${YELLOW}请手动启动${NC}"
            ERRORS+=("MongoDB 未运行。请运行: brew services start mongodb-community")
            return 1
        else
            echo -e "${RED}✗${NC} 未安装"
            ERRORS+=("未安装 MongoDB。请运行: brew tap mongodb/brew && brew install mongodb-community")
            return 1
        fi
    fi
}

check_env() {
    echo -n "检查 .env 配置... "
    ENV_FILE="$ROOT_DIR/.env"

    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}✗${NC} 文件不存在"
        ERRORS+=(".env 文件不存在，请复制 .env.example 为 .env 并填写配置")
        return 1
    fi

    # Check required variables
    MISSING=()

    # USER_ADDRESSES
    if ! grep -q "^USER_ADDRESSES.*=.*0x" "$ENV_FILE"; then
        MISSING+=("USER_ADDRESSES (要跟单的交易者地址)")
    fi

    # PROXY_WALLET
    if ! grep -q "^PROXY_WALLET.*=.*0x" "$ENV_FILE"; then
        MISSING+=("PROXY_WALLET (你的钱包地址)")
    fi

    # PRIVATE_KEY
    if grep -q "^PRIVATE_KEY.*=.*your_private_key" "$ENV_FILE" || ! grep -q "^PRIVATE_KEY.*=.*[a-fA-F0-9]" "$ENV_FILE"; then
        MISSING+=("PRIVATE_KEY (你的私钥)")
    fi

    # MONGO_URI
    if ! grep -q "^MONGO_URI.*=.*mongodb" "$ENV_FILE"; then
        MISSING+=("MONGO_URI (MongoDB 连接地址)")
    fi

    # RPC_URL
    if grep -q "^RPC_URL.*=.*YOUR_INFURA_KEY" "$ENV_FILE" || ! grep -q "^RPC_URL.*=.*http" "$ENV_FILE"; then
        MISSING+=("RPC_URL (Polygon RPC 地址)")
    fi

    if [ ${#MISSING[@]} -gt 0 ]; then
        echo -e "${RED}✗${NC} 配置不完整"
        for item in "${MISSING[@]}"; do
            ERRORS+=("缺少配置: $item")
        done
        return 1
    fi

    echo -e "${GREEN}✓${NC} 配置完整"
    return 0
}

check_dependencies() {
    echo -n "检查 npm 依赖... "
    if [ -d "$ROOT_DIR/node_modules" ]; then
        echo -e "${GREEN}✓${NC} 已安装"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} 未安装，正在安装..."
        cd "$ROOT_DIR"
        if npm install > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} 安装完成"
            return 0
        else
            ERRORS+=("npm 依赖安装失败")
            return 1
        fi
    fi
}

check_web_dependencies() {
    echo -n "检查 Dashboard 依赖... "
    if [ ! -d "$ROOT_DIR/web" ]; then
        echo -e "${YELLOW}⚠${NC} Dashboard 目录不存在"
        WARNINGS+=("Dashboard 未安装")
        return 1
    fi

    if [ -d "$ROOT_DIR/web/node_modules" ]; then
        echo -e "${GREEN}✓${NC} 已安装"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} 未安装，正在安装..."
        cd "$ROOT_DIR/web"
        if npm install > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} 安装完成"
            return 0
        else
            WARNINGS+=("Dashboard 依赖安装失败")
            return 1
        fi
    fi
}

# ================================================================
# 运行检查
# ================================================================

echo -e "${BOLD}正在检查环境...${NC}"
echo "────────────────────────────────────────────────────────"

check_node
check_mongodb
check_env
check_dependencies
check_web_dependencies

echo "────────────────────────────────────────────────────────"
echo ""

# ================================================================
# 显示结果
# ================================================================

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║                    启动失败                          ║${NC}"
    echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}请解决以下问题后重试:${NC}"
    echo ""
    for i in "${!ERRORS[@]}"; do
        echo -e "  ${RED}$((i+1)).${NC} ${ERRORS[$i]}"
    done
    echo ""
    echo -e "${YELLOW}提示:${NC}"
    echo "  - .env 文件在项目根目录"
    echo "  - 可以参考 .env.example 文件"
    echo "  - MongoDB 安装: brew tap mongodb/brew && brew install mongodb-community"
    echo ""
    echo -e "${CYAN}按任意键退出...${NC}"
    read -n 1
    exit 1
fi

# ================================================================
# 全部通过，启动服务
# ================================================================

echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                  环境检查通过!                        ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}正在启动服务...${NC}"
echo ""

cd "$ROOT_DIR"

# Start bot in background
echo -e "${BLUE}[Bot]${NC} 启动跟单机器人..."
npm run dev &
BOT_PID=$!

# Wait a moment
sleep 3

# Start web dashboard
if [ -d "$ROOT_DIR/web" ]; then
    echo -e "${CYAN}[Web]${NC} 启动 Dashboard..."
    cd "$ROOT_DIR/web"
    npm run dev &
    WEB_PID=$!

    sleep 3
    echo ""
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}✓${NC} Bot 已启动"
    echo -e "  ${GREEN}✓${NC} Dashboard 已启动"
    echo ""
    echo -e "  ${CYAN}打开浏览器访问:${NC} ${BOLD}http://localhost:3001${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    echo ""
fi

# Handle shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"
    kill $BOT_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo -e "${GREEN}已停止${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep running
wait
