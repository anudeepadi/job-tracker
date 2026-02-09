# Docker Setup - Complete Implementation Summary

Complete production-ready Docker configuration with auto-shutdown on service failure.

**Status**: ✅ All files created and configured

---

## Files Created

### 1. **apps/web/Dockerfile** (2.7 KB)
Multi-stage Next.js production build with:
- Node 18 Alpine builder stage
- Optimized production runtime
- Health checks using curl
- Non-root user execution
- Migration-ready configuration

**Key Features:**
- Standalone output for minimal size
- Automatic Prisma client generation
- Health endpoint checking
- 40s startup grace period
- 30s health check interval

---

### 2. **apps/web/docker-entrypoint.sh** (4.6 KB)
Pre-startup initialization script:
- Database connectivity checks (30 retries with 2s delays)
- Automatic Prisma schema generation
- Automatic database migration execution (`prisma migrate deploy`)
- Color-coded logging for debugging
- Error handling and exit codes

**Execution Flow:**
1. Check database connectivity
2. Generate Prisma client
3. Run migrations
4. Start Node.js server

---

### 3. **services/job-agent/Dockerfile** (2.1 KB)
Multi-stage Python 3.11 FastAPI container:
- Builder stage for wheel compilation
- Production runtime stage
- Security: curl, PostgreSQL client, bash utilities
- Non-root user execution
- 40s startup grace period

**Optimizations:**
- Wheel compilation for faster builds
- Minimal dependencies in final image
- Security: appuser (UID 1001)
- Health checks for `/api/health` endpoint

---

### 4. **docker-compose.prod.yml** (10+ KB)
Complete orchestration with 4 services:

#### Service: postgres
- PostgreSQL 16 Alpine
- Ports: 5432 (configurable)
- Health checks: `pg_isready` every 10s
- Volume: `postgres_data_prod` (named volume)
- Restart: on-failure
- Network: job-tracker-network

#### Service: web
- Build context: `./apps/web/Dockerfile`
- Depends on: postgres (healthy)
- Ports: 3000 (configurable)
- Health checks: `/api/health` every 30s (40s startup)
- Environment: All required variables
- Volume: `.env.docker` read-only mount
- Restart: unless-stopped
- Init: true (signal handling)

#### Service: job-agent
- Build context: `./services/job-agent/Dockerfile`
- Depends on: postgres (healthy)
- Ports: 8000 (configurable)
- Health checks: `/api/health` every 30s (40s startup)
- Environment: All API keys and configuration
- Volume: `.env.docker` read-only mount
- Restart: unless-stopped
- Init: true (signal handling)

#### Service: health-monitor
- Image: curlimages/curl:latest
- Restart: no (intentional - exit triggers compose down)
- Health check logic:
  - Checks PostgreSQL every 30 seconds
  - Checks Web `/api/health`
  - Checks Job-Agent `/api/health`
  - Allows 3 consecutive failures per service
  - **Exits with code 1 if any service fails 3x**
  - **Docker Compose stops all services on exit(1)**

**Network:** job-tracker-network (172.20.0.0/16)

**Volumes:**
- postgres_data_prod: Named volume for persistence
- Automatic creation in data/postgres-prod directory

**Logging:**
- Driver: json-file
- Max size: 10MB per file
- Max files: 3 rotating
- Timestamps: Automatic

---

### 5. **.env.docker** (2.5 KB)
Environment configuration template with:
- Database configuration (DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
- Application settings (NODE_ENV, PYTHON_ENV)
- API configuration (WEB_PORT, AGENT_PORT, PYTHON_BACKEND_URL, NEXT_PUBLIC_API_URL)
- Authentication (JWT_SECRET)
- AI API keys (Anthropic, OpenAI, Google)
- Job search APIs (Adzuna, LinkedIn RapidAPI, JSearch, RemoteOK)
- Docker-specific settings
- Monitoring configuration
- Comments explaining each variable

**Usage:** Copy to `.env.docker` and fill in actual values before running

---

### 6. **apps/web/src/app/api/health/route.ts** (3.5 KB)
Next.js health check endpoint:
- `GET /api/health` - Full health check with database test
- `HEAD /api/health` - Lightweight connectivity check
- Database connectivity verification
- Response includes:
  - Service status (healthy/unhealthy)
  - Timestamp
  - Uptime
  - Database latency
  - Node.js version
  - Memory usage
- Proper error handling
- No caching headers

**Response Format (200 OK):**
```json
{
  "status": "healthy",
  "service": "next-web-app",
  "timestamp": "2025-02-06T...",
  "uptime": 125.456,
  "checks": {
    "database": {
      "connected": true,
      "latency_ms": 2
    },
    "node": {
      "version": "v18.17.0",
      "memory_usage_mb": 145
    }
  }
}
```

---

### 7. **START.sh** (12+ KB)
Comprehensive startup orchestration script:

**Features:**
- Prerequisites checking (Docker, Docker Compose, daemon status)
- Environment validation
- Existing container cleanup
- Directory preparation
- Image building (optional)
- Container startup in correct order
- Service readiness waiting
- Status display
- Log following (optional)

**Usage:**
```bash
./START.sh [--build] [--logs] [--dev] [--no-health-monitor] [--help]
```

**Automatic Actions:**
1. Checks Docker prerequisites
2. Validates environment file
3. Stops existing containers
4. Creates data directories
5. Builds Docker images
6. Starts PostgreSQL first
7. Waits for PostgreSQL health
8. Starts Web and Job-Agent
9. Starts Health Monitor
10. Waits for service readiness
11. Displays endpoints and status
12. Optionally follows logs

---

### 8. **DOCKER.md** (15+ KB)
Comprehensive documentation:

**Sections:**
- Overview and components
- Quick start guide
- Architecture diagrams and flow
- Configuration reference
- Running the application (both manual and automated)
- Health checks and endpoints
- Monitoring and logs
- Troubleshooting guide
- Advanced usage
- Security best practices
- Production considerations

**Features:**
- Architecture diagrams
- Service dependency visualization
- Health check flow explanation
- All command examples
- Common issues and solutions
- Backup and restore procedures
- Network troubleshooting
- Resource usage monitoring

---

### 9. **DOCKER_QUICK_START.md** (2.5 KB)
5-minute quick start guide:
- Prerequisites
- Step-by-step setup
- Common commands
- Troubleshooting quick fixes
- Configuration reference
- Advanced options

---

### 10. **check-health.sh** (6+ KB)
Health verification utility script:

**Checks Performed:**
- Docker daemon status
- Compose file existence
- Container status
- PostgreSQL connectivity
- Web service availability
- Job-Agent availability
- Health monitor status
- Resource usage
- Displays useful commands

**Usage:**
```bash
./check-health.sh
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          Docker Compose Network                 │
│      (job-tracker-network: 172.20.0.0/16)       │
│                                                 │
│  ┌──────────────┐  ┌──────────┐  ┌───────────┐│
│  │  PostgreSQL  │  │   Web    │  │ Job-Agent ││
│  │   :5432      │  │  :3000   │  │  :8000    ││
│  └──────────────┘  └──────────┘  └───────────┘│
│        ▲                ▲              ▲        │
│        └────────────────┴──────────────┘        │
│                  depends_on + healthy           │
│                                                 │
│         ┌──────────────────────────┐            │
│         │    Health Monitor        │            │
│         │  (Auto-exit on failure)  │            │
│         └──────────────────────────┘            │
│                  ▲     ▲     ▲                  │
│           checks every 30s                      │
└─────────────────────────────────────────────────┘
```

---

## Startup Sequence

```
1. START.sh or docker-compose.prod.yml up -d

2. PostgreSQL starts
   - Initializes database
   - Port 5432 listening
   - Health check: pg_isready

3. Web & Job-Agent services:
   - Wait for PostgreSQL to be healthy
   - Build images (if needed)
   - Start containers

4. Web service startup:
   - docker-entrypoint.sh begins
   - Checks database connectivity (30 retries)
   - Runs: prisma generate
   - Runs: prisma migrate deploy
   - Starts Node.js server (port 3000)
   - Health checks enabled

5. Job-Agent startup:
   - Python environment initialization
   - FastAPI app initialization
   - Validates configuration
   - Starts uvicorn (port 8000)
   - Health checks enabled

6. Health Monitor starts:
   - Checks all services every 30 seconds
   - If any service fails 3 consecutive checks → exit(1)
   - Docker Compose sees exit(1) → stops all services
```

---

## Health Check System

### Every 30 Seconds:

```
Health Monitor:
├─ PostgreSQL (pg_isready)
│  ├─ Success → Reset failure counter to 0
│  └─ Failure → Increment counter
│             If counter >= 3 → Exit(1)
│
├─ Web (GET /api/health)
│  ├─ 200 OK → Reset failure counter to 0
│  └─ Error → Increment counter
│             If counter >= 3 → Exit(1)
│
└─ Job-Agent (GET /api/health)
   ├─ 200 OK → Reset failure counter to 0
   └─ Error → Increment counter
             If counter >= 3 → Exit(1)

Result:
├─ All healthy → Log success, continue
└─ Any failed 3x → Exit 1
               └─ Docker Compose down (all services stop)
               └─ Services automatically restart on-failure
               └─ Health monitor doesn't restart (restart: no)
```

---

## Key Features Implemented

### 1. Auto-Shutdown on Failure
- Health monitor checks all services every 30 seconds
- Allows 3 consecutive failures per service
- Exits with code 1 on failure
- Docker Compose stops all services on exit
- Prevents cascading failures

### 2. Migration Handling
- Entrypoint script runs before server starts
- Executes `prisma generate` for client
- Executes `prisma migrate deploy` for database
- Automatic on every container start
- Ensures schema is always up to date

### 3. Dependency Management
- Web and Job-Agent wait for PostgreSQL to be healthy
- Uses `depends_on` with `condition: service_healthy`
- Startup order guaranteed
- No race conditions

### 4. Health Checks
- PostgreSQL: `pg_isready` command
- Web: `GET /api/health` endpoint
- Job-Agent: `GET /api/health` endpoint
- 30-second intervals
- 10-second timeouts
- 3-retry limit
- 40-second startup grace period

### 5. Security
- Non-root users in all containers
- Read-only environment file mounts
- Minimal base images (Alpine)
- No unnecessary tools
- Proper permission handling

### 6. Observability
- Health endpoints with detailed status
- JSON-formatted logs with rotation
- Resource usage monitoring
- Service status visibility
- Health monitor logging

### 7. Production Ready
- Proper signal handling (init: true)
- Auto-restart policies (unless-stopped)
- Named volumes for persistence
- Network isolation
- Resource logging

---

## Usage Examples

### Quick Start (One Command)

```bash
./START.sh --build --logs
```

### Manual Docker Compose

```bash
# Create environment
cp .env.example .env.docker

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Check Health

```bash
./check-health.sh
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f job-agent
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f health-monitor
```

### Stop Everything

```bash
docker-compose -f docker-compose.prod.yml down
```

### Database Access

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U jobtracker -d jobtracker
```

---

## Environment Variables

### Required

- `JWT_SECRET` - Authentication secret (generate: `openssl rand -base64 32`)
- `ANTHROPIC_API_KEY` - Claude API key
- `ADZUNA_APP_ID` - Job search API
- `ADZUNA_API_KEY` - Job search API

### Database

- `DB_USER` - Default: jobtracker
- `DB_PASSWORD` - Default: jobtracker_prod_password
- `DB_NAME` - Default: jobtracker
- `DB_PORT` - Default: 5432

### Service Ports

- `WEB_PORT` - Default: 3000
- `AGENT_PORT` - Default: 8000

### URLs (Internal)

- `PYTHON_BACKEND_URL=http://job-agent:8000`
- `NEXT_PUBLIC_API_URL=http://localhost:3000`

### Optional API Keys

- `OPENAI_API_KEY` - OpenAI
- `GOOGLE_API_KEY` - Google AI
- `LINKEDIN_RAPIDAPI_KEY` - LinkedIn
- `JSEARCH_RAPIDAPI_KEY` - Job aggregator
- `REMOTEOK_ENABLED` - Remote jobs (true/false)

---

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web application |
| Frontend Health | http://localhost:3000/api/health | Health check |
| Backend API | http://localhost:8000 | FastAPI service |
| Backend Docs | http://localhost:8000/docs | API documentation |
| Backend Health | http://localhost:8000/api/health | Health check |
| Database | localhost:5432 | PostgreSQL |

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Services won't start | Check `.env.docker` exists, view logs |
| Port already in use | Change WEB_PORT/AGENT_PORT, kill existing process |
| Database connection error | Verify DATABASE_URL, check postgres logs |
| Migrations fail | Check migrations exist, view web logs |
| Health checks failing | Check individual endpoints, view health-monitor logs |
| Auto-shutdown triggered | Check which service failed, view logs |

---

## Security Considerations

1. **Never commit .env.docker with credentials** - Add to .gitignore
2. **Use strong passwords** - Generate with `openssl rand -base64 32`
3. **Rotate API keys regularly** - Update in .env.docker and restart
4. **Use secrets management in production** - Kubernetes Secrets, Vault
5. **Enable TLS** - Add reverse proxy (nginx, Traefik)
6. **Run as non-root** - Already implemented in all services
7. **Scan images** - `docker scan image-name`
8. **Keep updated** - `docker-compose -f docker-compose.prod.yml pull`

---

## Production Checklist

- [ ] Set strong DATABASE_URL password
- [ ] Generate secure JWT_SECRET
- [ ] Configure all required API keys
- [ ] Set NODE_ENV=production
- [ ] Enable TLS with reverse proxy
- [ ] Configure backup strategy
- [ ] Set up monitoring/alerting
- [ ] Review health check timeouts
- [ ] Set resource limits
- [ ] Test disaster recovery

---

## Files Summary

| File | Size | Purpose |
|------|------|---------|
| apps/web/Dockerfile | 2.7 KB | Next.js container |
| apps/web/docker-entrypoint.sh | 4.6 KB | Startup script |
| services/job-agent/Dockerfile | 2.1 KB | FastAPI container |
| apps/web/src/app/api/health/route.ts | 3.5 KB | Health endpoint |
| docker-compose.prod.yml | 10+ KB | Orchestration |
| .env.docker | 2.5 KB | Configuration template |
| START.sh | 12+ KB | Startup automation |
| DOCKER.md | 15+ KB | Full documentation |
| DOCKER_QUICK_START.md | 2.5 KB | Quick guide |
| check-health.sh | 6+ KB | Health verification |
| **TOTAL** | **~60 KB** | **Complete setup** |

---

## Next Steps

1. **Review .env.docker** - Update with actual API keys
2. **Start with START.sh** - `./START.sh --build --logs`
3. **Verify with check-health.sh** - `./check-health.sh`
4. **Access application** - http://localhost:3000
5. **Monitor services** - `docker-compose -f docker-compose.prod.yml logs -f`
6. **Read full docs** - See DOCKER.md for advanced usage

---

## Support

- Quick start: `DOCKER_QUICK_START.md`
- Full documentation: `DOCKER.md`
- Health verification: `./check-health.sh`
- Manual management: `docker-compose -f docker-compose.prod.yml`

**All files created and ready for production deployment!**
