#!/bin/bash

# =============================================================================
# Docker Database Setup Script
# =============================================================================
# This script sets up and starts the PostgreSQL database in Docker
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Docker Database Setup"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo "On macOS: Open Docker Desktop from Applications"
    echo "On Linux: Run 'sudo systemctl start docker'"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Starting PostgreSQL database container..."
docker-compose up -d postgres

echo ""
echo "Waiting for database to be ready..."
sleep 5

# Check if container is running
if docker-compose ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
else
    echo -e "${RED}❌ Failed to start PostgreSQL container${NC}"
    echo "Check logs with: docker-compose logs postgres"
    exit 1
fi

echo ""
echo "Running database migrations..."
cd apps/web

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "Applying database migrations..."
pnpm prisma migrate deploy

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Database setup complete!"
echo "==========================================${NC}"
echo ""
echo "Database connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: jobtracker"
echo "  Username: jobtracker"
echo "  Password: jobtracker_dev_password"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f postgres"
echo "  Stop DB: docker-compose down"
echo "  Access CLI: docker-compose exec postgres psql -U jobtracker -d jobtracker"
echo "  Prisma Studio: cd apps/web && pnpm prisma studio"
echo ""
