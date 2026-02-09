# Scripts Quick Reference

## Available Commands

```bash
# Initial Setup (First Time Only)
npm run setup

# Development (Hot Reload Enabled)
npm run dev

# Production (Optimized)
npm run start

# Data Migration (Copy agent outputs)
npm run migrate-data

# Legacy Commands (Still Available)
npm run dev:parallel      # Run all services in parallel (old method)
npm run build             # Build all packages
npm run build:web         # Build Next.js app only
npm run test              # Run tests
npm run lint              # Run linting
npm run clean             # Clean dependencies and build artifacts
npm run orchestrate       # Run Claude Flow orchestration
```

## Quick Start

### First Time Setup

```bash
# Navigate to project
cd /Users/vuc229/Downloads/Projects/Jobs

# Run setup (installs dependencies, creates .env, etc.)
npm run setup

# Edit .env with your API keys
vim .env

# Start development
npm run dev
```

### Development Workflow

```bash
# Terminal 1: Start all services
npm run dev

# Terminal 2: Run tests
npm run test

# Terminal 3: Build for production
npm run build
```

### Production Deployment

```bash
npm run start
```

### Migrate Data

```bash
npm run migrate-data
```

## Service URLs (When Running)

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Troubleshooting Quick Links

| Problem | Quick Fix |
|---------|-----------|
| Port 8000 in use | `lsof -i :8000` then `kill -9 <PID>` |
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| Missing .env | Run `npm run setup` |
| Python errors | Run `npm run setup` again |
| pnpm not found | `npm install -g pnpm@9.0.0` |

## File Locations

- Scripts: `/scripts/`
- Frontend: `/apps/web/`
- Backend: `/services/job-agent/`
- Data: `/data/agent-outputs/`
- Configuration: `/env` and `/env.example`
- Documentation: `/SCRIPTS_DOCUMENTATION.md`

## Environment Variables

Edit `.env` to configure:

```
DATABASE_URL=<your-database-url>
ANTHROPIC_API_KEY=<your-api-key>
ADZUNA_APP_ID=<your-app-id>
ADZUNA_API_KEY=<your-api-key>
PYTHON_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## Behind the Scenes

- `npm run setup` → runs `scripts/setup.sh`
- `npm run dev` → runs `scripts/start-dev.sh`
- `npm run start` → runs `scripts/start-prod.sh`
- `npm run migrate-data` → runs `scripts/migrate-data.sh`

All scripts are executable bash scripts in `/scripts/` directory.

## Getting Help

For detailed information, see `/SCRIPTS_DOCUMENTATION.md`

---

**Pro Tip:** Press `Ctrl+C` to stop all services gracefully when using `npm run dev` or `npm run start`.
