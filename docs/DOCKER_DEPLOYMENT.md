# Docker Production Deployment Guide

Complete guide for containerizing and deploying the full-stack Job Tracker application.

## Table of Contents

1. [Overview](#overview)
2. [Local Development with Docker](#local-development-with-docker)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Building Images](#building-images)
6. [Health Checks and Monitoring](#health-checks-and-monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Deployment on Railway](#deployment-on-railway)
9. [Deployment on Render](#deployment-on-render)
10. [Best Practices](#best-practices)

## Overview

The containerization consists of three main services:

- **web**: Next.js application running on port 3000
- **job-agent**: FastAPI service running on port 8000
- **postgres**: PostgreSQL 16 database on port 5432

### Architecture

```
┌─────────────────────────────────────────────────┐
│                Load Balancer / Reverse Proxy    │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐      ┌────▼─────────┐
│   web:     │      │ job-agent:   │
│ Next.js    │◄────►│  FastAPI     │
│ :3000      │      │  :8000       │
└───┬────────┘      └────┬─────────┘
    │                    │
    └────────┬───────────┘
             │
        ┌────▼──────────┐
        │  postgres:   │
        │ PostgreSQL   │
        │  :5432       │
        └─────────────┘
```

## Local Development with Docker

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for containers

### Quick Start

1. **Setup environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your local development values
   ```

2. **Start development stack**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Access services**:
   - Web app: http://localhost:3000
   - API docs: http://localhost:8000/docs
   - Database: localhost:5432

4. **View logs**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f web
   docker-compose -f docker-compose.dev.yml logs -f job-agent
   ```

5. **Stop services**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Features in Development Mode

- **Hot reload**: Changes to code automatically trigger rebuild
- **Source mounting**: Local files mapped into containers
- **Debug logging**: Enhanced logging for troubleshooting
- **Database persistence**: Data persists between restarts
- **Network isolation**: Services communicate through Docker network

## Production Deployment

### Prerequisites for Production

- Docker Engine 20.10+ with buildkit support
- Docker Compose 2.0+
- 2+ CPU cores, 4GB+ RAM minimum
- Persistent storage for database (80GB+ recommended)
- Secure secret management solution (HashiCorp Vault, AWS Secrets Manager, etc.)

### Step 1: Prepare Production Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with production values
nano .env.production

# Required fields to update:
# - DB_PASSWORD: Strong random password
# - JWT_SECRET: Cryptographically secure random string (32+ chars)
# - ANTHROPIC_API_KEY: Your actual API key
# - ADZUNA_APP_ID and ADZUNA_API_KEY: Your job search credentials
# - NEXT_PUBLIC_API_URL: Your production domain
```

### Step 2: Build Production Images

```bash
# Build web application
docker build \
  --target runner \
  --tag job-tracker-web:1.0.0 \
  --tag job-tracker-web:latest \
  --file apps/web/Dockerfile \
  apps/web

# Build job agent
docker build \
  --target production \
  --tag job-tracker-agent:1.0.0 \
  --tag job-tracker-agent:latest \
  --file services/job-agent/Dockerfile \
  services/job-agent

# Verify images
docker images | grep job-tracker
```

### Step 3: Deploy Production Stack

```bash
# Using production compose file
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps

# Monitor startup
docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:3000
curl http://localhost:8000/health
```

### Step 4: Post-Deployment Verification

```bash
# Test web app
curl -I http://localhost:3000

# Test API
curl http://localhost:8000/health

# Test database connectivity
docker exec job-tracker-db-prod psql -U jobtracker -d jobtracker -c "SELECT 1"

# Run Prisma migrations if needed
docker-compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
```

## Environment Configuration

### Production Environment Variables

Key environment variables for production deployment:

```bash
# Database (Required)
DB_USER=jobtracker
DB_PASSWORD=<strong_random_password>
DB_NAME=jobtracker
DATABASE_URL=postgresql://...

# Authentication (Required)
JWT_SECRET=<32+_char_random_string>
ENFORCE_AUTH=true

# API Keys (Required)
ANTHROPIC_API_KEY=sk-ant-...
ADZUNA_APP_ID=...
ADZUNA_API_KEY=...

# Optional APIs
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
LINKEDIN_RAPIDAPI_KEY=...

# URLs
NEXT_PUBLIC_API_URL=https://yourdomain.com
PYTHON_BACKEND_URL=http://job-agent:8000

# Logging
LOG_LEVEL=info
ENVIRONMENT=production
```

### Generating Secure Secrets

```bash
# Generate JWT secret (256-bit)
openssl rand -hex 32

# Generate random password
openssl rand -base64 32

# Generate API key format
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Building Images

### Multi-stage Build Benefits

The Dockerfiles use multi-stage builds to:

1. **Reduce image size**: Remove build tools and dev dependencies
2. **Improve layer caching**: Changes to source don't rebuild dependencies
3. **Security**: Non-root users, minimal base images
4. **Performance**: Standalone Next.js output, optimized Python wheels

### Build Performance Tips

```bash
# Enable BuildKit for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with cache from previous images
docker build \
  --cache-from job-tracker-web:latest \
  --tag job-tracker-web:1.0.0 \
  apps/web

# Parallel builds with docker-compose
docker-compose -f docker-compose.prod.yml build --parallel
```

### Image Size Optimization

```bash
# Check final image sizes
docker images | grep job-tracker

# Expected sizes:
# - web: ~300MB (with Next.js, dependencies)
# - job-agent: ~500MB (with FastAPI, crewAI)
# - postgres: ~150MB (postgres:16-alpine)
```

## Health Checks and Monitoring

### Built-in Health Checks

Each service includes health checks:

```yaml
# Web app (Next.js)
GET http://localhost:3000

# Job Agent (FastAPI)
GET http://localhost:8000/health

# Database
pg_isready -U jobtracker -d jobtracker
```

### Monitoring with Docker

```bash
# View container health status
docker-compose -f docker-compose.prod.yml ps

# Check specific service health
docker inspect job-tracker-web | grep -A 10 Health

# Monitor resource usage
docker stats

# View application logs
docker-compose logs -f web --tail=50
docker-compose logs -f job-agent --tail=50
```

### Setting up Monitoring

For production, integrate with:

- **Prometheus**: Metrics collection (requires Prometheus exporters)
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Elasticsearch, Logstash, Kibana for logging
- **Datadog/New Relic**: APM and infrastructure monitoring
- **Sentry**: Error tracking and reporting

## Troubleshooting

### Service Won't Start

```bash
# View detailed logs
docker-compose logs job-agent

# Common issues:
# 1. Port already in use
netstat -tulpn | grep :3000

# 2. Insufficient memory
docker stats

# 3. Missing environment variables
docker inspect <container> | grep Env
```

### Database Connection Issues

```bash
# Test database connectivity
docker exec job-tracker-db-prod psql -U jobtracker -d jobtracker -c "SELECT 1"

# View database logs
docker-compose logs postgres

# Check database URL format
echo $DATABASE_URL
```

### API Communication Issues

```bash
# Test internal service communication
docker exec job-tracker-web wget -O - http://job-agent:8000/health

# Check network connectivity
docker network inspect job-tracker-network

# View container network settings
docker inspect job-tracker-web | grep -A 20 NetworkSettings
```

### Performance Issues

```bash
# Check container resource limits
docker-compose -f docker-compose.prod.yml config | grep -A 5 "deploy:"

# Monitor real-time stats
docker stats --no-stream

# Increase resource limits if needed:
# Edit docker-compose.prod.yml:
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G
```

## Deployment on Railway

Railway.app simplifies container deployment:

### Setup

1. **Connect GitHub repository**:
   - Login to railway.app
   - Create new project
   - Select "Deploy from GitHub"
   - Connect your repository

2. **Configure environment**:
   - Add variables from `.env.production.example`
   - Railway auto-provides DATABASE_URL
   - Set all API keys securely

3. **Build configuration**:
   - Railway auto-detects Docker setup
   - Uses docker-compose.prod.yml automatically

4. **Deploy**:
   - Push to main branch
   - Railway automatically builds and deploys
   - Monitor deployment in dashboard

### Railway-specific Configuration

```yaml
# Optional: railway.toml (if using)
[build]
builder = "dockerfile"
dockerfile = "apps/web/Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
```

### Important Notes for Railway

- Remove `container_name` from docker-compose.prod.yml for Railway deployment
- Use environment variables for all configuration
- Database is auto-provisioned (remove postgres service if using Railway's DB)
- Each service needs its own Railway service configured

## Deployment on Render

Render.com is another excellent container platform:

### Setup

1. **Create new web service**:
   - Login to render.com
   - Create new service
   - Connect GitHub repository

2. **Configure**:
   - Build command: `docker build -f apps/web/Dockerfile -t web apps/web`
   - Start command: `node server.js`
   - Runtime: Docker

3. **Environment variables**:
   - Add all variables from `.env.production.example`
   - Render provides DATABASE_URL if using Render PostgreSQL

4. **Deploy**:
   - Manual or automatic on push
   - Monitor deployment progress

### Multi-Service Deployment on Render

For full stack, deploy each service separately:

1. **Web service** (main, with Dockerfile)
2. **Job Agent service** (background, with separate Dockerfile)
3. **PostgreSQL database** (Render managed, or external)

Use internal networking:
```bash
# Job Agent URL from web container
PYTHON_BACKEND_URL=http://<render-job-agent-service>:8000
```

## Best Practices

### 1. Image Management

```bash
# Use semantic versioning
docker tag job-tracker-web:latest job-tracker-web:1.0.0

# Push to registry
docker push registry.example.com/job-tracker-web:1.0.0

# Use digests for reproducibility
docker pull job-tracker-web@sha256:abc123...
```

### 2. Security

- Use non-root users (✓ implemented)
- Scan images for vulnerabilities:
  ```bash
  docker scan job-tracker-web
  # or use trivy
  trivy image job-tracker-web
  ```
- Keep base images updated
- Use secrets management, not environment variables for sensitive data

### 3. Resource Management

```yaml
# Set resource limits
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### 4. Logging

```bash
# Structured logging
export LOG_LEVEL=info

# Log aggregation
docker-compose logs --tail=100 --timestamps
```

### 5. Backup Strategy

```bash
# Backup database
docker exec job-tracker-db-prod pg_dump \
  -U jobtracker jobtracker > backup.sql

# Restore from backup
docker exec -i job-tracker-db-prod psql \
  -U jobtracker jobtracker < backup.sql
```

### 6. Update Strategy

```bash
# Blue-Green Deployment
# 1. Run new version alongside old
docker-compose -f docker-compose.prod.yml up -d --scale web=2

# 2. Test new version
curl http://new-container:3000

# 3. Switch traffic (requires load balancer)

# 4. Remove old version
docker stop old-container
docker rm old-container
```

### 7. Monitoring Checklist

- [ ] Health check endpoints working
- [ ] Resource limits configured
- [ ] Logging aggregation setup
- [ ] Error tracking (Sentry) integrated
- [ ] Performance monitoring (APM) enabled
- [ ] Database backups automated
- [ ] Security scanning in CI/CD

## Common Commands Reference

```bash
# Development
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f

# Image operations
docker build -t job-tracker-web:1.0.0 apps/web
docker images
docker rmi job-tracker-web:1.0.0

# Container operations
docker ps
docker exec <container> /bin/bash
docker logs <container>
docker inspect <container>

# Network operations
docker network ls
docker network inspect job-tracker-network

# Cleanup
docker-compose down -v
docker system prune -a
```

## Support and Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Specification](https://github.com/compose-spec/compose-spec)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)

---

Last Updated: 2025-02-05
Version: 1.0.0
