# Job Search Platform - Deployment & Operations Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Job Search Platform                          │
│                      (Monorepo Setup)                           │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                        npm Scripts Layer                        │
├────────────────────────────────────────────────────────────────┤
│  npm run setup     → initialize project (first-time only)       │
│  npm run dev       → development with hot reload               │
│  npm run start     → production mode                           │
│  npm run migrate-data → copy agent outputs to data directory   │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                      Bash Scripts Layer                         │
├────────────────────────────────────────────────────────────────┤
│  scripts/setup.sh          [Environment Initialization]        │
│  scripts/start-dev.sh      [Development Services]              │
│  scripts/start-prod.sh     [Production Services]               │
│  scripts/migrate-data.sh   [Data Migration]                    │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    Services & Applications                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │  Next.js Web App │          │ Python FastAPI   │           │
│  │  (Port 3000)     │◄────────►│ (Port 8000)      │           │
│  │  /apps/web       │          │ /services/job-   │           │
│  │                  │          │      agent       │           │
│  └──────────────────┘          └──────────────────┘           │
│         ▲                              ▲                       │
│         │                              │                       │
│         │                              │                       │
│  ┌──────┴──────────────────────────────┴────────┐             │
│  │     Environment Variables (.env)            │             │
│  │  - DATABASE_URL                             │             │
│  │  - ANTHROPIC_API_KEY                        │             │
│  │  - ADZUNA_API_KEY, APP_ID                   │             │
│  │  - Service URLs                             │             │
│  └─────────────────────────────────────────────┘             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                      Data & Storage                            │
├────────────────────────────────────────────────────────────────┤
│  /data/agent-outputs     [Migrated Data]                       │
│  /job-search-agent/outputs [Source Data]                      │
│  PostgreSQL Database     [Primary Storage]                    │
└────────────────────────────────────────────────────────────────┘
```

## Deployment Workflow

### Phase 1: Initial Setup (First Time)

```
┌─────────────────┐
│   npm run       │
│   setup         │
└────────┬────────┘
         │
         ├──► Check/Install pnpm
         ├──► Install Node.js deps (pnpm install)
         ├──► Install Python deps (pip install)
         ├──► Create Python venv
         ├──► Create .env from .env.example
         ├──► Generate Prisma client
         └──► Prompt for API keys
              │
              ▼
         ✓ Ready for Development
```

### Phase 2: Development Mode

```
┌──────────────────┐
│   npm run dev    │
└────────┬─────────┘
         │
         ├──► Load .env variables
         ├──► Activate Python venv
         │
         ├─┬──► Start Python Backend (Port 8000)
         │ │    - uvicorn --reload
         │ │    - Hot reload on code changes
         │ │
         └─┬──► Start Next.js (Port 3000)
           │    - dev mode with hot reload
           │    - Changes reflected instantly
           │
           ▼
      ✓ Both services running
         │
      Press Ctrl+C to stop
```

### Phase 3: Production Deployment

```
┌──────────────────┐
│  npm run start   │
└────────┬─────────┘
         │
         ├──► Load .env variables
         ├──► Activate Python venv
         │
         ├─┬──► Build Next.js (if needed)
         │ │    - Optimized production build
         │ │    - Generate .next directory
         │ │
         ├─┬──► Start Python Backend (Port 8000)
         │ │    - 4 worker processes
         │ │    - Production mode (no reload)
         │ │
         └─┬──► Start Next.js (Port 3000)
           │    - Production mode
           │    - Optimized serving
           │
           ▼
      ✓ Services ready for production
```

### Phase 4: Data Migration

```
┌──────────────────────┐
│  npm run migrate-data│
└────────┬─────────────┘
         │
         ├──► Check source: job-search-agent/outputs/
         ├──► Create dest: data/agent-outputs/
         ├──► Create backup (if needed)
         │
         ├──► Copy files with rsync/cp
         │    - Preserves directory structure
         │    - Shows progress
         │
         └──► Verify & Report
              │
              ▼
         ✓ Data migrated successfully
```

## Service Dependencies

### Development Mode

```
setup.sh
   ↓
start-dev.sh
   ├── Python venv (created in setup.sh)
   ├── .env file (created in setup.sh)
   ├── Node.js dependencies (installed in setup.sh)
   └── Python dependencies (installed in setup.sh)
```

### Production Mode

```
setup.sh → build → start-prod.sh
   ↓        ↓         ↓
 venv    .next    Python Backend
  ↓        ↓         ↓
  ✓ All dependencies ready
```

## Environment Separation

### Development (.env example)

```
NODE_ENV=development
DATABASE_LOG_LEVEL=info
PYTHON_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production (.env example)

```
NODE_ENV=production
DATABASE_LOG_LEVEL=warn
PYTHON_BACKEND_URL=https://api.example.com
NEXT_PUBLIC_API_URL=https://example.com
```

## Process Management

### Single Service Management

```bash
# Start just the backend
cd services/job-agent
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Start just the frontend
cd apps/web
npm run dev
```

### All Services Together

```bash
npm run dev      # Start all services at once (recommended)
npm run start    # Start all services in production
```

## Monitoring & Health Checks

### During Development

```
Terminal Output:
├── Python: INFO:     Uvicorn running on http://0.0.0.0:8000
├── Python: INFO:     Application startup complete
├── Next.js: ▲ Next.js 14.0.0
└── Next.js: Local:        http://localhost:3000
```

### Checking Service Status

```bash
# Check if ports are listening
lsof -i :3000
lsof -i :8000

# Check if processes are running
ps aux | grep uvicorn
ps aux | grep next

# API health check
curl http://localhost:8000/docs  # Python docs
curl http://localhost:3000       # Frontend
```

## Troubleshooting Decision Tree

```
Problem?
├─ Port already in use?
│  └─ Kill process: lsof -i :PORT | grep LISTEN | awk '{print $2}' | xargs kill -9
│
├─ .env not found?
│  └─ Run: npm run setup
│
├─ Dependencies missing?
│  └─ Run: npm run setup
│
├─ Python venv not found?
│  └─ Run: npm run setup
│
├─ API keys not configured?
│  └─ Edit: vim .env
│     Then: npm run dev
│
├─ Can't connect to backend?
│  └─ Check: lsof -i :8000
│     Restart: npm run dev
│
└─ Build fails?
   └─ Clean: npm run clean
      Setup: npm run setup
      Dev: npm run dev
```

## Performance Optimization

### Development

- Hot reload enabled for faster iteration
- Minimal optimization for quick feedback
- Database logging at INFO level

### Production

- Next.js optimized build
- Python with multiple workers (4)
- Minimal logging at WARN level
- Code splitting and tree-shaking applied

## Scaling Considerations

### Horizontal Scaling

```
Development:
- Single instance of each service
- Suitable for development/testing

Production:
- Multiple Python backend instances (load balanced)
- CDN for static Next.js assets
- Database connection pooling required
```

### Vertical Scaling

```
Python Backend:
- Increase workers: --workers 8 (for 8-core system)
- Adjust memory: consider server resources

Next.js:
- Increase Node.js memory: NODE_OPTIONS=--max-old-space-size=4096
- Optimize images and bundles
```

## Deployment Checklist

- [ ] Run `npm run setup` to initialize
- [ ] Configure `.env` with production API keys
- [ ] Update database URL for production database
- [ ] Run `npm run build` to verify build succeeds
- [ ] Test with `npm run start` locally
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Plan disaster recovery
- [ ] Document runbooks for operations team

## Operational Tasks

### Daily

- Monitor application logs
- Check error rates
- Verify data integrity
- Monitor disk space

### Weekly

- Review performance metrics
- Check dependency vulnerabilities
- Backup database
- Review security logs

### Monthly

- Update dependencies
- Run security scans
- Capacity planning review
- Disaster recovery test

---

**Remember:** Always test changes in development before deploying to production!
