#!/bin/bash

# Polymarket Copy Trading Bot - Quick Start Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Polymarket Copy Trading Bot - Quick Start        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if web/node_modules exists
if [ -d "web" ] && [ ! -d "web/node_modules" ]; then
    echo -e "${YELLOW}Installing web dependencies...${NC}"
    cd web && npm install && cd ..
fi

# Menu
echo -e "${GREEN}What would you like to do?${NC}"
echo ""
echo "  1) Setup & Check (First time setup)"
echo "  2) Start All (Bot + Dashboard)"
echo "  3) Start Bot Only"
echo "  4) Start Dashboard Only"
echo "  5) Health Check"
echo "  0) Exit"
echo ""
read -p "Enter your choice [2]: " choice
choice=${choice:-2}

case $choice in
    1)
        echo -e "\n${BLUE}Running setup check...${NC}\n"
        npm run setup:check
        ;;
    2)
        echo -e "\n${BLUE}Starting all services...${NC}\n"
        npm run start:all
        ;;
    3)
        echo -e "\n${BLUE}Starting bot...${NC}\n"
        npm run dev
        ;;
    4)
        echo -e "\n${BLUE}Starting dashboard on http://localhost:3001 ...${NC}\n"
        npm run web
        ;;
    5)
        echo -e "\n${BLUE}Running health check...${NC}\n"
        npm run health-check
        ;;
    0)
        echo -e "${GREEN}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
