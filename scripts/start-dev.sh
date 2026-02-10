#!/bin/bash

# Development Startup Script for Job Search Platform Monorepo
# Starts all services in development mode with hot reload

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
echo -e "${BLUE}Job Search Platform - Development Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "$ROOT_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in root directory${NC}"
    exit 1
fi

# Load environment variables if possible, but don't fail hard on permission issues.
if [ -f "$ROOT_DIR/.env" ] && [ -r "$ROOT_DIR/.env" ]; then
    # shellcheck disable=SC1090
    set -a
    source "$ROOT_DIR/.env"
    set +a
elif [ -f "$ROOT_DIR/.env" ] && [ ! -r "$ROOT_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: $ROOT_DIR/.env exists but is not readable (permission issue).${NC}"
    echo -e "${YELLOW}Continuing without sourcing .env. Set env vars in your shell or fix file permissions.${NC}"
    echo ""
else
    echo -e "${YELLOW}Warning: .env not found. Continuing without sourcing .env.${NC}"
    echo ""
fi

# Verify Python virtual environment exists
if [ ! -d "$ROOT_DIR/services/job-agent/venv" ]; then
    echo -e "${RED}Error: Python virtual environment not found${NC}"
    echo "Please run 'npm run setup' first to initialize the project"
    exit 1
fi

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down development servers...${NC}"

    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    echo -e "${GREEN}All servers stopped${NC}"
    exit 0
}

# Set up trap to handle cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo -e "${YELLOW}Starting development servers...${NC}"
echo ""

# Allow overriding ports via environment variables; default to standard dev ports.
# (These can be set in .env or inline: WEB_PORT=3000 PYTHON_PORT=8000 npm run dev)
PYTHON_PORT="${PYTHON_PORT:-8000}"
WEB_PORT="${WEB_PORT:-3000}"

# Ensure Prisma client is generated for the web app (required for API routes using @prisma/client)
echo -e "${BLUE}Generating Prisma client (apps/web)...${NC}"
cd "$ROOT_DIR/apps/web"
npx prisma generate
echo -e "${GREEN}Prisma client generated${NC}"
echo ""

# Check if Python backend is already running
if lsof -Pi :"$PYTHON_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Something is already listening on port ${PYTHON_PORT}${NC}"
    echo "Please stop other services or use a different port"
    exit 1
fi

# Check if Next.js dev server is already running
if lsof -Pi :"$WEB_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Something is already listening on port ${WEB_PORT}${NC}"
    echo "Please stop other services or use a different port"
    exit 1
fi

# Start Python FastAPI backend
echo -e "${BLUE}Starting Python FastAPI backend (port ${PYTHON_PORT})...${NC}"
cd "$ROOT_DIR/services/job-agent"
source venv/bin/activate
export PYTHONPATH="$ROOT_DIR/services/job-agent:$PYTHONPATH"
python -m uvicorn app.main:app --reload --port "$PYTHON_PORT" &
PYTHON_PID=$!
echo -e "${GREEN}Python backend started (PID: $PYTHON_PID)${NC}"
sleep 2  # Wait for backend to start
echo ""

# Start Next.js frontend
echo -e "${BLUE}Starting Next.js frontend (port ${WEB_PORT})...${NC}"
cd "$ROOT_DIR/apps/web"
PYTHON_BACKEND_URL="http://localhost:${PYTHON_PORT}" PORT="$WEB_PORT" npm run dev &
NEXTJS_PID=$!
echo -e "${GREEN}Next.js frontend started (PID: $NEXTJS_PID)${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Development servers are running${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  - Python Backend: http://localhost:${PYTHON_PORT}"
echo "  - Python Docs:    http://localhost:${PYTHON_PORT}/docs"
echo "  - Next.js:        http://localhost:${WEB_PORT}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait
