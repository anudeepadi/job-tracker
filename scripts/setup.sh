#!/bin/bash

# Setup Script for Job Search Platform Monorepo
# Installs dependencies and initializes the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the root directory of the project
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Job Search Platform - Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "$ROOT_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in root directory${NC}"
    echo "Please run this script from the root of the project"
    exit 1
fi

# Step 1: Install pnpm if not available
echo -e "${YELLOW}Step 1: Checking pnpm installation...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing pnpm globally...${NC}"
    npm install -g pnpm@9.0.0
    echo -e "${GREEN}pnpm installed successfully${NC}"
else
    echo -e "${GREEN}pnpm is already installed$(pnpm --version)${NC}"
fi
echo ""

# Step 2: Install Node.js dependencies
echo -e "${YELLOW}Step 2: Installing Node.js dependencies with pnpm...${NC}"
cd "$ROOT_DIR"
pnpm install
echo -e "${GREEN}Node.js dependencies installed${NC}"
echo ""

# Step 3: Install Python dependencies
echo -e "${YELLOW}Step 3: Installing Python dependencies...${NC}"
if [ ! -f "$ROOT_DIR/services/job-agent/requirements.txt" ]; then
    echo -e "${RED}Error: requirements.txt not found in services/job-agent${NC}"
    exit 1
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3.8 or later"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$ROOT_DIR/services/job-agent/venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    cd "$ROOT_DIR/services/job-agent"
    python3 -m venv venv
    echo -e "${GREEN}Virtual environment created${NC}"
fi

# Activate virtual environment and install dependencies
cd "$ROOT_DIR/services/job-agent"
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo -e "${GREEN}Python dependencies installed${NC}"
cd "$ROOT_DIR"
echo ""

# Step 4: Setup environment file
echo -e "${YELLOW}Step 4: Setting up environment configuration...${NC}"
if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        echo -e "${GREEN}.env file created from .env.example${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}.env file already exists${NC}"
fi
echo ""

# Step 5: Generate Prisma client
echo -e "${YELLOW}Step 5: Generating Prisma client...${NC}"
if command -v npx &> /dev/null; then
    npx prisma generate 2>/dev/null || echo -e "${YELLOW}Note: Prisma client generation skipped (optional)${NC}"
else
    echo -e "${YELLOW}Note: npx not available, skipping Prisma generation${NC}"
fi
echo ""

# Step 6: Prompt for API keys
echo -e "${YELLOW}Step 6: Verifying API key configuration...${NC}"
echo ""
echo -e "${BLUE}The following API keys should be configured in your .env file:${NC}"
echo "  - ANTHROPIC_API_KEY: Get from https://console.anthropic.com/"
echo "  - ADZUNA_APP_ID & ADZUNA_API_KEY: Get from https://developer.adzuna.com/"
echo "  - DATABASE_URL: Your PostgreSQL connection string"
echo ""
echo -e "${YELLOW}Please update the .env file with your API keys:${NC}"
echo "  vim $ROOT_DIR/.env"
echo ""

# Step 7: Verify installation
echo -e "${YELLOW}Step 7: Verifying installation...${NC}"
echo ""
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"
echo "Python version: $(python3 --version)"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Update .env file with your API keys"
echo "  2. Run 'npm run dev' to start development servers"
echo "  3. Run 'npm run migrate-data' to import existing job search outputs"
echo ""
