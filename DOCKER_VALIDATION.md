# Docker Setup Validation Checklist

Verify all Docker setup files are correctly created and configured.

## File Existence Checks

Run this to verify all files are in place:

```bash
# From project root
cd /Users/vuc229/Documents/Development/Active-Projects/specialized/effective-barnacle

# Check all files exist
echo "=== Docker Setup Files ==="

# Root level files
echo "Checking root level files..."
test -f START.sh && echo "✓ START.sh" || echo "✗ START.sh MISSING"
test -f check-health.sh && echo "✓ check-health.sh" || echo "✗ check-health.sh MISSING"
test -f docker-compose.prod.yml && echo "✓ docker-compose.prod.yml" || echo "✗ docker-compose.prod.yml MISSING"
test -f .env.docker && echo "✓ .env.docker" || echo "✗ .env.docker MISSING"
test -f DOCKER.md && echo "✓ DOCKER.md" || echo "✗ DOCKER.md MISSING"
test -f DOCKER_QUICK_START.md && echo "✓ DOCKER_QUICK_START.md" || echo "✗ DOCKER_QUICK_START.md MISSING"
test -f DOCKER_SETUP_SUMMARY.md && echo "✓ DOCKER_SETUP_SUMMARY.md" || echo "✗ DOCKER_SETUP_SUMMARY.md MISSING"

# Web app files
echo ""
echo "Checking web app files..."
test -f apps/web/Dockerfile && echo "✓ apps/web/Dockerfile" || echo "✗ apps/web/Dockerfile MISSING"
test -f apps/web/docker-entrypoint.sh && echo "✓ apps/web/docker-entrypoint.sh" || echo "✗ apps/web/docker-entrypoint.sh MISSING"
test -f apps/web/src/app/api/health/route.ts && echo "✓ apps/web/src/app/api/health/route.ts" || echo "✗ apps/web/src/app/api/health/route.ts MISSING"

# Job agent files
echo ""
echo "Checking job-agent files..."
test -f services/job-agent/Dockerfile && echo "✓ services/job-agent/Dockerfile" || echo "✗ services/job-agent/Dockerfile MISSING"

echo ""
echo "=== All checks complete ==="
```

## File Content Verification

### 1. apps/web/Dockerfile
Should contain:
- [ ] Multi-stage build (builder and runner stages)
- [ ] Node 18 Alpine base
- [ ] pnpm package manager
- [ ] Prisma schema copying
- [ ] docker-entrypoint.sh reference
- [ ] Health check with curl
- [ ] Non-root user (nextjs)

```bash
grep -q "FROM node:18-alpine" apps/web/Dockerfile && echo "✓ Dockerfile structure OK" || echo "✗ Issue found"
grep -q "entrypoint.sh" apps/web/Dockerfile && echo "✓ Entrypoint referenced" || echo "✗ Entrypoint missing"
grep -q "curl" apps/web/Dockerfile && echo "✓ Health check setup" || echo "✗ Health check missing"
```

### 2. apps/web/docker-entrypoint.sh
Should contain:
- [ ] Database connectivity check
- [ ] Prisma generate command
- [ ] Prisma migrate deploy command
- [ ] Color-coded logging
- [ ] Error handling

```bash
grep -q "pg_isready" apps/web/docker-entrypoint.sh && echo "✓ DB check present" || echo "✗ DB check missing"
grep -q "prisma generate" apps/web/docker-entrypoint.sh && echo "✓ Prisma generate present" || echo "✗ Prisma generate missing"
grep -q "prisma migrate deploy" apps/web/docker-entrypoint.sh && echo "✓ Migrations present" || echo "✗ Migrations missing"
```

### 3. services/job-agent/Dockerfile
Should contain:
- [ ] Multi-stage build (builder and production)
- [ ] Python 3.11 Alpine
- [ ] Non-root user (appuser)
- [ ] Health check for /api/health
- [ ] Uvicorn startup command

```bash
grep -q "FROM python:3.11-slim" services/job-agent/Dockerfile && echo "✓ Python 3.11 present" || echo "✗ Wrong Python version"
grep -q "curl.*8000/api/health" services/job-agent/Dockerfile && echo "✓ Health check present" || echo "✗ Health check missing"
grep -q "appuser" services/job-agent/Dockerfile && echo "✓ Non-root user" || echo "✗ Root user issue"
```

### 4. docker-compose.prod.yml
Should contain:
- [ ] PostgreSQL service with health check
- [ ] Web service with depends_on postgres
- [ ] Job-agent service with depends_on postgres
- [ ] Health-monitor service with exit on failure
- [ ] Named volume for postgres data
- [ ] Network definition
- [ ] Environment variables

```bash
grep -q "postgres:" docker-compose.prod.yml && echo "✓ Postgres service present" || echo "✗ Postgres missing"
grep -q "web:" docker-compose.prod.yml && echo "✓ Web service present" || echo "✗ Web service missing"
grep -q "job-agent:" docker-compose.prod.yml && echo "✓ Job-agent service present" || echo "✗ Job-agent missing"
grep -q "health-monitor:" docker-compose.prod.yml && echo "✓ Health monitor present" || echo "✗ Health monitor missing"
grep -q "service_healthy" docker-compose.prod.yml && echo "✓ Health dependencies present" || echo "✗ Dependencies missing"
```

### 5. .env.docker
Should contain:
- [ ] Database configuration variables
- [ ] JWT_SECRET placeholder
- [ ] API key placeholders
- [ ] Port configuration
- [ ] Service URLs

```bash
grep -q "DB_USER" .env.docker && echo "✓ DB config present" || echo "✗ DB config missing"
grep -q "JWT_SECRET" .env.docker && echo "✓ JWT_SECRET present" || echo "✗ JWT_SECRET missing"
grep -q "ANTHROPIC_API_KEY" .env.docker && echo "✓ API keys present" || echo "✗ API keys missing"
```

### 6. apps/web/src/app/api/health/route.ts
Should contain:
- [ ] GET handler
- [ ] Database connectivity check
- [ ] Prisma query execution
- [ ] Status response (healthy/unhealthy)
- [ ] HTTP 200 on success, 503 on failure
- [ ] Proper error handling

```bash
grep -q "export async function GET" apps/web/src/app/api/health/route.ts && echo "✓ GET handler present" || echo "✗ GET handler missing"
grep -q "prisma" apps/web/src/app/api/health/route.ts && echo "✓ Prisma check present" || echo "✗ Prisma check missing"
grep -q "status.*healthy" apps/web/src/app/api/health/route.ts && echo "✓ Status check present" || echo "✗ Status check missing"
```

### 7. START.sh
Should contain:
- [ ] Docker prerequisites check
- [ ] Docker Compose detection
- [ ] Environment file validation
- [ ] Container startup sequence
- [ ] Service readiness waiting
- [ ] Log following option
- [ ] Help text

```bash
test -x START.sh && echo "✓ START.sh executable" || echo "✗ START.sh not executable"
grep -q "docker" START.sh && echo "✓ Docker commands present" || echo "✗ Docker commands missing"
grep -q "check_database" START.sh && echo "✓ Database check present" || echo "✗ Database check missing"
```

### 8. check-health.sh
Should contain:
- [ ] Docker prerequisites check
- [ ] Curl-based health checks
- [ ] Postgres health verification
- [ ] Web service verification
- [ ] Job-agent verification
- [ ] Resource usage display

```bash
test -x check-health.sh && echo "✓ check-health.sh executable" || echo "✗ check-health.sh not executable"
grep -q "pg_isready" check-health.sh && echo "✓ Postgres check present" || echo "✗ Postgres check missing"
grep -q "curl.*localhost" check-health.sh && echo "✓ Curl checks present" || echo "✗ Curl checks missing"
```

## Docker Prerequisites Check

```bash
echo "=== Docker Requirements ==="

# Docker installed
docker --version && echo "✓ Docker installed" || echo "✗ Docker not installed"

# Docker daemon running
docker info > /dev/null 2>&1 && echo "✓ Docker daemon running" || echo "✗ Docker daemon not running"

# Docker Compose available
docker-compose --version > /dev/null 2>&1 && echo "✓ Docker Compose available" || echo "✗ Docker Compose not available"

# Minimum versions
DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null | cut -d. -f1)
if [ "$DOCKER_VERSION" -ge 20 ]; then
  echo "✓ Docker version >= 20 (found $DOCKER_VERSION)"
else
  echo "✗ Docker version < 20 (found $DOCKER_VERSION)"
fi

# Disk space
DISK_FREE=$(df . | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -gt 4194304 ]; then  # > 4GB in KB
  echo "✓ Sufficient disk space ($(numfmt --to=iec $DISK_FREE 2>/dev/null || echo "$DISK_FREE KB"))"
else
  echo "✗ Low disk space"
fi
```

## Environment Configuration Check

```bash
echo "=== Environment Configuration ==="

# Check .env.docker exists
if [ -f ".env.docker" ]; then
  echo "✓ .env.docker exists"
  
  # Check key variables
  grep -q "DB_USER" .env.docker && echo "  ✓ DB_USER configured" || echo "  ✗ DB_USER missing"
  grep -q "DB_PASSWORD" .env.docker && echo "  ✓ DB_PASSWORD configured" || echo "  ✗ DB_PASSWORD missing"
  
  # Check for placeholder values that need updating
  if grep -q "your_" .env.docker; then
    echo "  ! REMINDER: Update placeholder values (your_*) in .env.docker"
  fi
else
  echo "✗ .env.docker missing"
  echo "  Run: cp .env.example .env.docker"
fi
```

## Docker Compose Validation

```bash
echo "=== Docker Compose Validation ==="

# Validate YAML syntax
docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1 && \
  echo "✓ docker-compose.prod.yml is valid" || \
  echo "✗ docker-compose.prod.yml has syntax errors"

# Check service count
SERVICE_COUNT=$(docker-compose -f docker-compose.prod.yml config --services 2>/dev/null | wc -l)
if [ "$SERVICE_COUNT" -ge 4 ]; then
  echo "✓ All 4 services defined ($SERVICE_COUNT found)"
else
  echo "✗ Missing services ($SERVICE_COUNT found, need 4)"
fi

# List services
echo ""
echo "Services defined:"
docker-compose -f docker-compose.prod.yml config --services 2>/dev/null | sed 's/^/  /'
```

## Port Availability Check

```bash
echo "=== Port Availability ==="

# Check ports
check_port() {
  local port=$1
  local service=$2
  if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✓ Port $port available ($service)"
  else
    echo "✗ Port $port in use ($service) - Process: $(lsof -Pi :$port -sTCP:LISTEN -t)"
  fi
}

check_port 3000 "Web"
check_port 8000 "Job-Agent"
check_port 5432 "PostgreSQL"
```

## Quick Start Test

```bash
echo "=== Quick Start Test ==="
echo "To verify everything works:"
echo ""
echo "1. Update .env.docker with your API keys:"
echo "   nano .env.docker"
echo ""
echo "2. Start the application:"
echo "   ./START.sh --build --logs"
echo ""
echo "3. In another terminal, verify health:"
echo "   ./check-health.sh"
echo ""
echo "4. Access application:"
echo "   Open http://localhost:3000 in browser"
```

## Complete Validation Script

Save as `validate-setup.sh` and run:

```bash
#!/bin/bash
set -e

echo "=========================================="
echo "Docker Setup Validation"
echo "=========================================="
echo ""

# File checks
echo "Checking files..."
test -f START.sh && echo "✓ START.sh" || (echo "✗ START.sh MISSING" && exit 1)
test -f check-health.sh && echo "✓ check-health.sh" || (echo "✗ check-health.sh MISSING" && exit 1)
test -f docker-compose.prod.yml && echo "✓ docker-compose.prod.yml" || (echo "✗ docker-compose.prod.yml MISSING" && exit 1)
test -f apps/web/Dockerfile && echo "✓ apps/web/Dockerfile" || (echo "✗ apps/web/Dockerfile MISSING" && exit 1)
test -f apps/web/docker-entrypoint.sh && echo "✓ apps/web/docker-entrypoint.sh" || (echo "✗ apps/web/docker-entrypoint.sh MISSING" && exit 1)
test -f services/job-agent/Dockerfile && echo "✓ services/job-agent/Dockerfile" || (echo "✗ services/job-agent/Dockerfile MISSING" && exit 1)
test -f apps/web/src/app/api/health/route.ts && echo "✓ apps/web/src/app/api/health/route.ts" || (echo "✗ apps/web/src/app/api/health/route.ts MISSING" && exit 1)

echo ""
echo "Checking Docker..."
docker --version || (echo "✗ Docker not installed" && exit 1)
docker info > /dev/null || (echo "✗ Docker daemon not running" && exit 1)
docker-compose --version || (echo "✗ Docker Compose not available" && exit 1)

echo ""
echo "Validating Compose file..."
docker-compose -f docker-compose.prod.yml config > /dev/null || (echo "✗ Invalid compose file" && exit 1)

echo ""
echo "Checking executable permissions..."
test -x START.sh && echo "✓ START.sh executable" || chmod +x START.sh
test -x check-health.sh && echo "✓ check-health.sh executable" || chmod +x check-health.sh

echo ""
echo "=========================================="
echo "✓ All validations passed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env.docker with your API keys"
echo "2. Run: ./START.sh --build --logs"
echo "3. Open: http://localhost:3000"
```

## Checklist Summary

- [ ] All Docker files created
- [ ] All files have correct content
- [ ] START.sh and check-health.sh are executable
- [ ] .env.docker exists and is configured
- [ ] docker-compose.prod.yml is valid
- [ ] Docker is installed and running
- [ ] Docker Compose is available
- [ ] Required ports are available
- [ ] API keys are configured in .env.docker
- [ ] Sufficient disk space available

If all checks pass, you're ready to start:

```bash
./START.sh --build --logs
```
