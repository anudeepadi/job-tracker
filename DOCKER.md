# Docker Setup Guide - Job Tracker Application

Complete production-ready Docker setup with auto-shutdown on service failure.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Health Checks](#health-checks)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

## Overview

This Docker setup provides a complete production-ready deployment with:

- **Multi-stage builds**: Minimal image sizes
- **Health checks**: Every 30 seconds with auto-restart
- **Auto-shutdown on failure**: Health monitor container stops all services if any service fails
- **Database migrations**: Automatic Prisma migration execution
- **Non-root users**: Security best practice
- **Dependency management**: Services wait for PostgreSQL to be healthy before starting
- **Persistent storage**: Named volumes for data durability
- **Logging**: JSON-formatted logs with size limits

### Components

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **postgres** | PostgreSQL 16 | 5432 | Database |
| **web** | Next.js 15 | 3000 | Frontend application |
| **job-agent** | FastAPI + Python 3.11 | 8000 | Backend API service |
| **health-monitor** | curl-based | N/A | Monitors all services, auto-shutdown on failure |

## Quick Start

### Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0
- At least 4GB of free disk space
- 2GB of RAM available

### One-Line Start

```bash
# Make sure you're in the project root directory
cd /path/to/effective-barnacle

# Create environment file (will auto-create if missing)
# cp .env.example .env.docker

# Start everything
./START.sh --build --logs
```

Or manually:

```bash
# Create and configure environment
cp .env.example .env.docker
# Edit .env.docker and fill in API keys

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Architecture

### Service Dependencies

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Docker Compose Network                 │
│         (job-tracker-network: 172.20.0.0/16)        │
│                                                     │
│  ┌──────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  PostgreSQL  │  │   Web    │  │  Job-Agent  │  │
│  │   (Port:     │  │ (Port:   │  │  (Port:     │  │
│  │   5432)      │  │  3000)   │  │  8000)      │  │
│  └──────────────┘  └──────────┘  └─────────────┘  │
│        ▲                ▲              ▲            │
│        │                │              │            │
│        │  depends_on    │  depends_on  │            │
│        └────────────────┴──────────────┘            │
│                        ▲                            │
│                        │                            │
│                  ┌─────────────┐                    │
│                  │    Health   │                    │
│                  │   Monitor   │                    │
│                  │  (Auto-exit │                    │
│                  │ on failure) │                    │
│                  └─────────────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘

Host Machine
┌─────────────────────────────────────────────────────┐
│  Port 3000 ──→ Web Frontend                         │
│  Port 8000 ──→ Job Agent API                        │
│  Port 5432 ──→ PostgreSQL (optional, for clients)   │
└─────────────────────────────────────────────────────┘
```

### Startup Sequence

1. **Docker Compose starts all services**
2. **PostgreSQL initializes and becomes healthy**
3. **Web and Job-Agent wait for PostgreSQL to be healthy**
4. **Web service:**
   - Runs `prisma migrate deploy` (via docker-entrypoint.sh)
   - Generates Prisma client
   - Starts Next.js server
5. **Job-Agent service:**
   - Initializes FastAPI application
   - Validates configuration
   - Starts uvicorn server
6. **Health Monitor starts:**
   - Checks all services every 30 seconds
   - If any service fails 3 consecutive health checks, exits with code 1
   - Docker Compose stops all services on health-monitor exit

### Health Check Flow

```
Every 30 seconds:
┌──────────────────────────────────────────┐
│  Health Monitor Checks:                   │
├──────────────────────────────────────────┤
│ 1. PostgreSQL: pg_isready                │
│    ✓ OK   → Reset failure counter        │
│    ✗ FAIL → Increment failure counter    │
│             If >= 3 failures → EXIT(1)   │
│                                          │
│ 2. Web: curl http://web:3000/api/health │
│    ✓ 200  → Reset failure counter        │
│    ✗ FAIL → Increment failure counter    │
│             If >= 3 failures → EXIT(1)   │
│                                          │
│ 3. Job-Agent: curl http://job-agent:... │
│    ✓ 200  → Reset failure counter        │
│    ✗ FAIL → Increment failure counter    │
│             If >= 3 failures → EXIT(1)   │
└──────────────────────────────────────────┘
       │
       ├─→ All healthy? Log success
       │
       └─→ Any failed 3x?
           Exit 1 → Docker Compose down
```

## Configuration

### Environment File (.env.docker)

Create `.env.docker` in the project root with the following variables:

```env
# Database
DB_USER=jobtracker
DB_PASSWORD=secure_password_change_me
DB_NAME=jobtracker
DB_PORT=5432
DATABASE_URL=postgresql://jobtracker:secure_password_change_me@postgres:5432/jobtracker

# Application
NODE_ENV=production
WEB_PORT=3000
AGENT_PORT=8000

# API URLs (for inter-service communication)
PYTHON_BACKEND_URL=http://job-agent:8000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Authentication
JWT_SECRET=generate_with_openssl_rand_base64_32

# API Keys (required)
ANTHROPIC_API_KEY=sk-ant-...
ADZUNA_APP_ID=...
ADZUNA_API_KEY=...

# API Keys (optional)
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
LINKEDIN_RAPIDAPI_KEY=...
JSEARCH_RAPIDAPI_KEY=...
REMOTEOK_ENABLED=true
```

### Generating Secure Values

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -hex 32

# Generate random API key simulation
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Running the Application

### Using START.sh (Recommended)

```bash
# Start with default production setup
./START.sh

# Start with image rebuilding
./START.sh --build

# Start and follow logs
./START.sh --logs

# Rebuild and follow logs
./START.sh --build --logs

# Start development environment
./START.sh --dev --logs

# Skip health monitor
./START.sh --no-health-monitor
```

### Manual Docker Compose Commands

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f job-agent
docker-compose -f docker-compose.prod.yml logs -f postgres

# Check status
docker-compose -f docker-compose.prod.yml ps

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (careful!)
docker-compose -f docker-compose.prod.yml down -v

# Restart a service
docker-compose -f docker-compose.prod.yml restart web

# Execute command in container
docker-compose -f docker-compose.prod.yml exec web sh
docker-compose -f docker-compose.prod.yml exec postgres psql -U jobtracker -d jobtracker
```

## Health Checks

### Endpoints

| Service | Endpoint | Description |
|---------|----------|-------------|
| Web | `GET /api/health` | Returns 200 if database connected |
| Job-Agent | `GET /api/health` | Returns service status and dependency checks |
| PostgreSQL | `pg_isready` | Returns 0 if accepting connections |

### Response Formats

**Web Health Check** (`GET http://localhost:3000/api/health`):

```json
{
  "status": "healthy",
  "service": "next-web-app",
  "timestamp": "2025-02-06T10:30:45.123Z",
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

**Job-Agent Health Check** (`GET http://localhost:8000/api/health`):

```json
{
  "status": "healthy",
  "timestamp": "2025-02-06T10:30:45.123Z",
  "dependencies": {
    "anthropic": {
      "status": "healthy",
      "configured": true
    },
    "adzuna": {
      "status": "healthy",
      "configured": true
    }
  }
}
```

### Manual Health Checks

```bash
# Web frontend
curl -v http://localhost:3000/api/health

# Job agent
curl -v http://localhost:8000/api/health

# Database (from host)
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U jobtracker

# All services
docker-compose -f docker-compose.prod.yml ps
```

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f job-agent
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f health-monitor

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# With timestamps
docker-compose -f docker-compose.prod.yml logs -f --timestamps
```

### Log Files

Logs are stored locally in JSON format with rotation:

- Max size: 10MB per file
- Max files: 3 rotating files per service
- Driver: json-file

### System Resource Usage

```bash
# Show container resource usage
docker stats

# Show specific container
docker stats job-tracker-web-prod

# Show disk usage
docker system df

# Prune unused images and volumes (careful!)
docker system prune -a
```

## Troubleshooting

### Container Fails to Start

**Problem**: Containers start but immediately exit

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs web

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Inspect specific container
docker inspect job-tracker-web-prod
```

**Solutions**:
- Verify `.env.docker` file exists and has required variables
- Check database connection string is correct
- Ensure ports 3000, 8000, 5432 are not in use
- Verify sufficient disk space: `df -h`

### Database Connection Issues

**Problem**: Web/Job-Agent cannot connect to PostgreSQL

```bash
# Test database directly
docker-compose -f docker-compose.prod.yml exec postgres psql -U jobtracker -d jobtracker -c "SELECT 1"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Reset database (WARNING: Deletes data)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d postgres
```

**Solutions**:
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is healthy before web/agent start
- Check network connectivity: `docker network ls`
- Restart services in correct order

### Health Checks Failing

**Problem**: Health monitor exits and stops all containers

```bash
# View health monitor logs
docker-compose -f docker-compose.prod.yml logs health-monitor

# Manually test endpoints
curl -v http://localhost:3000/api/health
curl -v http://localhost:8000/api/health
curl -v http://localhost:5432 (should fail - not HTTP)

# Check individual service logs
docker-compose -f docker-compose.prod.yml logs web
docker-compose -f docker-compose.prod.yml logs job-agent
```

**Solutions**:
- Ensure web service has completed migrations (check logs)
- Verify API keys are configured if services depend on them
- Check network connectivity between containers
- Restart individual service: `docker-compose -f docker-compose.prod.yml restart web`

### Port Already in Use

**Problem**: Error "bind: address already in use"

```bash
# Find what's using port 3000
lsof -i :3000

# Find what's using port 8000
lsof -i :8000

# Kill process using port
kill -9 <PID>

# Or change ports in .env.docker
WEB_PORT=3001
AGENT_PORT=8001
```

### Slow Performance

**Problem**: Services are slow or timing out

```bash
# Check resource usage
docker stats

# Check database query performance
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U jobtracker -d jobtracker -c "SELECT * FROM pg_stat_statements LIMIT 10;"

# Increase health check timeouts in docker-compose.prod.yml
# Modify: healthcheck timeout, start_period
```

### Migrations Fail

**Problem**: Web service fails due to Prisma migration errors

```bash
# Check migration logs
docker-compose -f docker-compose.prod.yml logs web

# Manually run migrations
docker-compose -f docker-compose.prod.yml exec web npx prisma migrate deploy

# Reset migrations (WARNING: Deletes data)
docker-compose -f docker-compose.prod.yml exec web npx prisma migrate reset

# Check migration status
docker-compose -f docker-compose.prod.yml exec web npx prisma migrate status
```

## Advanced Usage

### Custom Environment Variables

Override variables for specific deployments:

```bash
# Export before running
export DB_PASSWORD=my_custom_password
export WEB_PORT=3001
export AGENT_PORT=8001

# Then run
./START.sh
```

### Accessing Database from Host

```bash
# Install PostgreSQL client (if not installed)
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Connect to database
psql -h localhost -p 5432 -U jobtracker -d jobtracker

# Run query
psql -h localhost -p 5432 -U jobtracker -d jobtracker -c "SELECT 1"
```

### Backup and Restore

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U jobtracker jobtracker > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U jobtracker jobtracker < backup.sql

# Backup volumes
docker run --rm -v postgres_data_prod:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v postgres_data_prod:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

### Development Mode

```bash
# Use development compose file with hot-reload
./START.sh --dev --logs

# This uses docker-compose.dev.yml which may have:
# - Volume mounts for source code
# - Development servers with file watching
# - Exposed debug ports
```

### Scaling Services

To run multiple instances of job-agent:

```bash
# Edit docker-compose.prod.yml
# Change job-agent service to:
#   deploy:
#     replicas: 3
# Then use:
docker-compose -f docker-compose.prod.yml up -d --scale job-agent=3

# Note: Load balancing would need additional configuration (nginx, etc.)
```

### Network Troubleshooting

```bash
# Inspect network
docker network inspect job-tracker-network

# Test connectivity between containers
docker-compose -f docker-compose.prod.yml exec web ping job-agent
docker-compose -f docker-compose.prod.yml exec web curl http://job-agent:8000/

# DNS resolution
docker-compose -f docker-compose.prod.yml exec web nslookup postgres
```

### Security Best Practices

1. **Never commit .env.docker with credentials**
2. **Use strong passwords**: `openssl rand -base64 32`
3. **Rotate API keys regularly**
4. **Use secrets management in production**: Docker Secrets, Kubernetes Secrets, or HashiCorp Vault
5. **Enable TLS for external connections**
6. **Keep Docker images updated**: `docker-compose -f docker-compose.prod.yml pull`
7. **Use resource limits**: Configure memory and CPU limits in compose file
8. **Run containers as non-root**: All services use dedicated users
9. **Scan images for vulnerabilities**: `docker scan image-name`

### Production Considerations

1. **Add reverse proxy**: nginx/Traefik for SSL termination
2. **Add load balancing**: For scaling web/agent services
3. **Add monitoring**: Prometheus/Grafana for metrics
4. **Add logging aggregation**: ELK stack or Splunk
5. **Add backup strategy**: Automated PostgreSQL backups
6. **Use external secrets**: Don't embed credentials
7. **Enable auto-restart**: Already configured (restart: unless-stopped)
8. **Monitor health checks**: Alert on health-monitor exit
9. **Set resource limits**: CPU and memory constraints
10. **Plan disaster recovery**: Backup and restore procedures

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [FastAPI Docker Guide](https://fastapi.tiangolo.com/deployment/docker/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## Support

For issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Check health: `docker-compose -f docker-compose.prod.yml ps`
3. Verify environment: `cat .env.docker`
4. Test connectivity: `curl http://localhost:3000/api/health`
