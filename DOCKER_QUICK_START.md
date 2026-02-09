# Docker Quick Start Guide

Get the Job Tracker application running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- API keys configured (see Configuration section)

## 5-Minute Setup

### Step 1: Navigate to Project

```bash
cd /path/to/effective-barnacle
```

### Step 2: Create Environment File

```bash
# Copy template
cp .env.example .env.docker

# Edit with your API keys (use your favorite editor)
# Minimum required:
# - JWT_SECRET (can use random string)
# - ANTHROPIC_API_KEY
# - ADZUNA_APP_ID and ADZUNA_API_KEY
```

### Step 3: Start Application

```bash
# Make script executable (one-time)
chmod +x START.sh

# Start with one command
./START.sh --build --logs
```

Or manually:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Verify Services

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# Expected output should show:
# - postgres: UP (healthy)
# - web: UP (healthy)
# - job-agent: UP (healthy)
# - health-monitor: UP
```

### Step 5: Access Application

Open in browser:

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:3000/api/health

## Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web

# Follow job-agent logs
docker-compose -f docker-compose.prod.yml logs -f job-agent
```

### Stop Application

```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart web
```

### Access Database

```bash
# Open PostgreSQL shell
docker-compose -f docker-compose.prod.yml exec postgres psql -U jobtracker -d jobtracker

# Run query
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U jobtracker -d jobtracker -c "SELECT COUNT(*) FROM \"User\";"
```

### View Container Status

```bash
# Detailed status
docker-compose -f docker-compose.prod.yml ps -a

# Resource usage
docker stats

# Inspect specific container
docker inspect job-tracker-web-prod
```

## What Gets Created

| File | Purpose |
|------|---------|
| `.env.docker` | Environment variables (create from template) |
| `postgres_data_prod/` | Database storage (created in `data/` directory) |
| Docker images | Built from Dockerfiles |
| Docker containers | Running instances of each service |
| Docker network | `job-tracker-network` for inter-service communication |

## Health Check System

The `health-monitor` container:

- Checks all services every 30 seconds
- If any service fails 3 consecutive checks → **automatic shutdown**
- Ensures **zero-downtime restarts** when services recover

**Monitored endpoints:**

- PostgreSQL: `pg_isready`
- Web: `http://web:3000/api/health` → 200 OK
- Job-Agent: `http://job-agent:8000/api/health` → 200 OK

## Troubleshooting

### Services won't start

```bash
# Check detailed logs
docker-compose -f docker-compose.prod.yml logs

# Ensure .env.docker exists
ls -la .env.docker

# Check if ports are in use
lsof -i :3000
lsof -i :8000
lsof -i :5432
```

### Database connection error

```bash
# Verify PostgreSQL is running
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Reset database (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d postgres
```

### Health checks failing

```bash
# Check health monitor logs
docker-compose -f docker-compose.prod.yml logs health-monitor

# Test endpoints manually
curl http://localhost:3000/api/health
curl http://localhost:8000/api/health

# Check individual service logs
docker-compose -f docker-compose.prod.yml logs web
docker-compose -f docker-compose.prod.yml logs job-agent
```

## Configuration Reference

### Required Variables

```env
# Must set in .env.docker
JWT_SECRET=your_secret_here
ANTHROPIC_API_KEY=sk-ant-...
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key
```

### Generate Secure Values

```bash
# Generate random JWT_SECRET
openssl rand -base64 32

# Generate random password
openssl rand -hex 32

# Generate Python secrets
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Service Ports

| Service | Port | Variable |
|---------|------|----------|
| Frontend | 3000 | `WEB_PORT` |
| Job Agent API | 8000 | `AGENT_PORT` |
| PostgreSQL | 5432 | `DB_PORT` |

To change ports, edit `.env.docker`:

```env
WEB_PORT=3001
AGENT_PORT=8001
DB_PORT=5433
```

## Advanced Options

### Use Development Mode

```bash
./START.sh --dev --logs
```

Uses `docker-compose.dev.yml` with hot-reload.

### Rebuild Images

```bash
./START.sh --build
```

Useful after code changes.

### Skip Health Monitor

```bash
./START.sh --no-health-monitor
```

Manual control without auto-shutdown.

## Next Steps

1. Configure API keys in `.env.docker`
2. Start with `./START.sh --build --logs`
3. Access http://localhost:3000
4. View full docs in `DOCKER.md`

## Support

- Full documentation: See `DOCKER.md`
- View logs: `docker-compose -f docker-compose.prod.yml logs -f`
- Check status: `docker-compose -f docker-compose.prod.yml ps`
