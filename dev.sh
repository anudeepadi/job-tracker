#!/bin/bash
# =============================================================================
# ONE-COMMAND LOCAL DEV STARTUP
# Job Search Platform — runs everything you need for local development
# =============================================================================
# Usage: ./dev.sh
#   - Starts PostgreSQL via Docker
#   - Installs dependencies if needed
#   - Runs database migrations
#   - Starts Next.js frontend (port 3000) + Python backend (port 8000)
#   - Press Ctrl+C to stop everything
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Track background PIDs for cleanup
PIDS=()

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    # Don't stop the DB container — it's fine to leave running
    echo -e "${GREEN}All services stopped. Database container still running (use 'docker compose down' to stop it).${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ─── Preflight Checks ───────────────────────────────────────────────────────

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           Job Search Platform — Local Dev                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
if ! command -v docker &>/dev/null; then
    echo -e "${RED}Docker is not installed. Install it from https://docker.com${NC}"
    exit 1
fi
if ! docker info &>/dev/null 2>&1; then
    echo -e "${RED}Docker daemon is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &>/dev/null; then
    echo -e "${RED}Node.js is not installed. Install from https://nodejs.org${NC}"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &>/dev/null; then
    echo -e "${YELLOW}pnpm not found, installing...${NC}"
    npm install -g pnpm@9
fi

# Check Python
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Python 3 is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites OK${NC} ${DIM}(docker, node, pnpm, python3)${NC}"

# ─── Load Environment ───────────────────────────────────────────────────────

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    echo -e "${YELLOW}Please edit .env with your API keys, then re-run ./dev.sh${NC}"
    exit 1
fi

set -a
source "$ROOT_DIR/.env"
set +a

# ─── Step 1: Start PostgreSQL ───────────────────────────────────────────────

echo -e "\n${BLUE}[1/5]${NC} Starting PostgreSQL database..."

# Use the base docker-compose.yml (just postgres on port 5433)
docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null

# Wait for DB to be healthy
echo -n "  Waiting for PostgreSQL"
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U jobtracker &>/dev/null 2>&1; then
        echo -e " ${GREEN}ready${NC}"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo -e " ${RED}timed out${NC}"
        echo -e "${RED}Could not connect to PostgreSQL. Check 'docker compose logs postgres'${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done

# ─── Step 2: Install Node dependencies ──────────────────────────────────────

echo -e "${BLUE}[2/5]${NC} Checking Node.js dependencies..."

if [ ! -d "$ROOT_DIR/apps/web/node_modules" ] || [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo "  Installing dependencies with pnpm..."
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
fi
echo -e "  ${GREEN}Node dependencies OK${NC}"

# ─── Step 3: Setup Python venv ──────────────────────────────────────────────

echo -e "${BLUE}[3/5]${NC} Checking Python environment..."

AGENT_DIR="$ROOT_DIR/services/job-agent"
if [ ! -d "$AGENT_DIR/venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv "$AGENT_DIR/venv"
    source "$AGENT_DIR/venv/bin/activate"
    pip install --upgrade pip setuptools wheel -q
    pip install -r "$AGENT_DIR/requirements.txt" -q
    echo -e "  ${GREEN}Python dependencies installed${NC}"
else
    source "$AGENT_DIR/venv/bin/activate"
    echo -e "  ${GREEN}Python venv OK${NC}"
fi

# ─── Step 4: Run database migrations ────────────────────────────────────────

echo -e "${BLUE}[4/5]${NC} Running database migrations..."

cd "$ROOT_DIR/apps/web"
npx prisma generate --no-hints 2>/dev/null
npx prisma db push --accept-data-loss 2>/dev/null && echo -e "  ${GREEN}Database schema synced${NC}" || {
    echo -e "  ${YELLOW}Trying prisma migrate deploy...${NC}"
    npx prisma migrate deploy 2>/dev/null || echo -e "  ${YELLOW}Migration skipped (may need manual review)${NC}"
}
cd "$ROOT_DIR"

# ─── Step 5: Start services ─────────────────────────────────────────────────

echo -e "${BLUE}[5/5]${NC} Starting application services..."

# Start Python FastAPI backend (use venv python directly for reliability)
echo -e "  Starting Python backend on port 8000..."
cd "$AGENT_DIR"
PYTHONPATH="$AGENT_DIR:$PYTHONPATH" ./venv/bin/python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
PIDS+=($!)
cd "$ROOT_DIR"

# Give backend time to start (CrewAI validation takes a few seconds)
sleep 4

# Start Next.js frontend
echo -e "  Starting Next.js frontend on port 3000..."
cd "$ROOT_DIR/apps/web"
PYTHON_BACKEND_URL="http://localhost:8000" npx next dev --turbopack --port 3000 &
PIDS+=($!)
cd "$ROOT_DIR"

# ─── Ready! ─────────────────────────────────────────────────────────────────

sleep 3
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗"
echo -e "║                    All services running!                   ║"
echo -e "╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Web App:${NC}          http://localhost:3000"
echo -e "  ${CYAN}API Backend:${NC}      http://localhost:8000"
echo -e "  ${CYAN}API Docs:${NC}         http://localhost:8000/docs"
echo -e "  ${CYAN}DB Studio:${NC}        npx prisma studio  ${DIM}(run in apps/web/)${NC}"
echo -e "  ${CYAN}Database:${NC}         localhost:5433      ${DIM}(user: jobtracker)${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for background processes
wait
