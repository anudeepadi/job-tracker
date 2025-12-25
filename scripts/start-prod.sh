#!/bin/bash

# Production Startup Script for Job Search Platform Monorepo
# Starts all services in production mode

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
echo -e "${BLUE}Job Search Platform - Production Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "$ROOT_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in root directory${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ROOT_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please run setup first to initialize the project"
    exit 1
fi

# Load environment variables
export $(cat "$ROOT_DIR/.env" | grep -v '^#' | xargs)

# Verify Python virtual environment exists
if [ ! -d "$ROOT_DIR/services/job-agent/venv" ]; then
    echo -e "${RED}Error: Python virtual environment not found${NC}"
    echo "Please run setup first to initialize the project"
    exit 1
fi

# Check if Next.js is built
if [ ! -d "$ROOT_DIR/apps/web/.next" ]; then
    echo -e "${YELLOW}Building Next.js application...${NC}"
    cd "$ROOT_DIR/apps/web"
    npm run build
    echo -e "${GREEN}Next.js build completed${NC}"
    echo ""
fi

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down production servers...${NC}"

    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    echo -e "${GREEN}All servers stopped${NC}"
    exit 0
}

# Set up trap to handle cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo -e "${YELLOW}Starting production servers...${NC}"
echo ""

# Check port availability
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}Error: Port 8000 is already in use${NC}"
    echo "Please stop other services first"
    exit 1
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}Error: Port 3000 is already in use${NC}"
    echo "Please stop other services first"
    exit 1
fi

# Start Python FastAPI backend (production mode)
echo -e "${BLUE}Starting Python FastAPI backend (port 8000)...${NC}"
cd "$ROOT_DIR/services/job-agent"
source venv/bin/activate
export PYTHONPATH="$ROOT_DIR/services/job-agent:$PYTHONPATH"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 &
PYTHON_PID=$!
echo -e "${GREEN}Python backend started (PID: $PYTHON_PID)${NC}"
sleep 2  # Wait for backend to start
echo ""

# Start Next.js frontend (production mode)
echo -e "${BLUE}Starting Next.js frontend (port 3000)...${NC}"
cd "$ROOT_DIR/apps/web"
npm run start &
NEXTJS_PID=$!
echo -e "${GREEN}Next.js frontend started (PID: $NEXTJS_PID)${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Production servers are running${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  - Python Backend: http://localhost:8000"
echo "  - Python Docs:    http://localhost:8000/docs"
echo "  - Next.js:        http://localhost:3000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait
