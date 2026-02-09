# Unified Startup Scripts - Index & Getting Started

Welcome to the Job Search Platform monorepo! This README provides an overview of the unified startup scripts and where to find detailed documentation.

## Files Overview

### Startup Scripts (`/scripts/`)

| Script | Purpose | Command |
|--------|---------|---------|
| **setup.sh** | Initialize development environment (first-time only) | `npm run setup` |
| **start-dev.sh** | Start all services in development mode with hot reload | `npm run dev` |
| **start-prod.sh** | Start all services in production mode | `npm run start` |
| **migrate-data.sh** | Migrate job-search-agent outputs to data directory | `npm run migrate-data` |

All scripts are:
- Fully executable (`chmod +x`)
- Syntax validated
- Error handled
- Colored output for clarity
- Documented with inline comments

### Documentation Files

| Document | Purpose | Best For |
|----------|---------|----------|
| **SCRIPTS_QUICK_REFERENCE.md** | One-page command reference | Quick lookups and common tasks |
| **SCRIPTS_DOCUMENTATION.md** | Comprehensive guide | Understanding all features and options |
| **DEPLOYMENT_GUIDE.md** | Operations and architecture | DevOps and production deployment |
| **SCRIPTS_README.md** | This file | Navigation and getting started |

## Getting Started (5 Minutes)

### Step 1: Run Setup

```bash
npm run setup
```

This initializes everything:
- Installs pnpm (Node package manager)
- Installs Node.js dependencies
- Creates Python virtual environment
- Installs Python dependencies
- Creates .env file from template
- Generates database client

### Step 2: Configure API Keys

```bash
vim .env
```

Add your API keys:
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/
- `ADZUNA_APP_ID` & `ADZUNA_API_KEY` - Get from https://developer.adzuna.com/
- `DATABASE_URL` - Your PostgreSQL connection string

### Step 3: Start Development

```bash
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Step 4: (Optional) Migrate Data

```bash
npm run migrate-data
```

Copies job search results from `job-search-agent/outputs/` to `data/agent-outputs/`

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start all services with hot reload
npm run dev:web         # Start only Next.js frontend
npm run dev:agent       # Start only Python backend

# Production
npm run start            # Start all services production mode
npm run build            # Build all packages
npm run build:web        # Build Next.js only

# Quality
npm run test             # Run all tests
npm run lint             # Run linters

# Maintenance
npm run setup            # Initialize/reinitialize project
npm run migrate-data     # Copy agent outputs to data directory
npm run clean            # Clean all dependencies and builds
npm run orchestrate      # Run Claude Flow orchestration
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Next.js web application |
| Backend API | http://localhost:8000 | Python FastAPI backend |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Database | PostgreSQL connection | Data storage |

## Directory Structure

```
Jobs/
├── scripts/                          # Startup scripts
│   ├── setup.sh                      # Environment initialization
│   ├── start-dev.sh                  # Development startup
│   ├── start-prod.sh                 # Production startup
│   └── migrate-data.sh               # Data migration
│
├── apps/
│   └── web/                          # Next.js frontend
│
├── services/
│   └── job-agent/                    # Python FastAPI backend
│
├── data/
│   └── agent-outputs/                # Migrated data storage
│
├── .env                              # Environment configuration (git ignored)
├── .env.example                      # Environment template
│
├── SCRIPTS_README.md                 # This file
├── SCRIPTS_QUICK_REFERENCE.md        # Quick command reference
├── SCRIPTS_DOCUMENTATION.md          # Comprehensive documentation
└── DEPLOYMENT_GUIDE.md               # Architecture & operations
```

## Common Tasks

### Task: Start Development

```bash
npm run dev
```

Starts both Next.js (port 3000) and Python (port 8000) with hot reload. Press Ctrl+C to stop.

### Task: Deploy to Production

```bash
npm run setup
npm run build
npm run start
```

Initializes, builds, and starts production servers.

### Task: Test Changes

```bash
npm run dev              # Terminal 1: Start services
npm run test             # Terminal 2: Run tests
npm run lint             # Terminal 3: Check code quality
```

### Task: Reset Environment

```bash
npm run clean
npm run setup
npm run dev
```

Clears dependencies and rebuilds everything.

### Task: Move Agent Outputs

```bash
npm run migrate-data
```

Copies files with automatic backup of existing data.

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000    # for port 3000
lsof -i :8000    # for port 8000

# Kill the process
kill -9 <PID>
```

### Missing .env

Run setup to create it:
```bash
npm run setup
```

### Dependencies Not Installing

```bash
npm run clean
npm run setup
```

### Python Errors

Make sure Python 3.8+ is installed:
```bash
python3 --version
npm run setup
```

### Can't Access Frontend

Make sure port 3000 is available:
```bash
npm run dev
# Check: http://localhost:3000
```

### Can't Access Backend

Make sure port 8000 is available:
```bash
npm run dev
# Check: http://localhost:8000/docs
```

## What Each Script Does

### setup.sh Flow

```
Check pnpm → Install Node deps → Install Python deps →
Create venv → Create .env → Generate Prisma → Done
```

### start-dev.sh Flow

```
Load .env → Activate venv →
Start Python (8000) → Start Next.js (3000) →
Monitor services → Cleanup on exit
```

### start-prod.sh Flow

```
Load .env → Activate venv → Build if needed →
Start Python (4 workers) → Start Next.js prod →
Monitor services → Cleanup on exit
```

### migrate-data.sh Flow

```
Check source → Create destination → Backup if exists →
Copy files → Verify → Report
```

## For Detailed Information

- **Quick Commands?** → See SCRIPTS_QUICK_REFERENCE.md
- **How to Use Each Script?** → See SCRIPTS_DOCUMENTATION.md
- **Architecture & Ops?** → See DEPLOYMENT_GUIDE.md
- **API Reference?** → See http://localhost:8000/docs (when running)

## Integration Points

### GitHub Actions

```yaml
- name: Setup
  run: npm run setup

- name: Build
  run: npm run build

- name: Deploy
  run: npm run start
```

### Docker

```dockerfile
RUN npm run setup
RUN npm run build
CMD ["npm", "run", "start"]
```

### PM2/systemd

```bash
npm run setup
npm run build
# Then configure process manager
```

## Performance Tips

### Development
- Use `npm run dev` for hot reload
- Keep browser refresh to see changes instantly

### Production
- Use `npm run start` for optimized performance
- Monitor logs for errors
- Use external reverse proxy (nginx)

### Data
- Run `npm run migrate-data` once after setup
- Monitor disk space

## Maintenance

### Weekly
- Check for outdated packages: `npm outdated`
- Review logs for errors

### Monthly
- Update dependencies: `npm update`
- Run security audit: `npm audit`
- Test disaster recovery

### As Needed
- Rebuild: `npm run build`
- Migrate data: `npm run migrate-data`
- Clean & reset: `npm run clean && npm run setup`

## Key Behaviors

All scripts:
- Load environment variables from `.env`
- Check prerequisites before starting
- Provide colored, readable output
- Handle errors gracefully
- Clean up on exit (Ctrl+C)
- Validate port availability
- Log important actions

## Environment Variables

Required in `.env`:
```
DATABASE_URL=<your-database-url>
ANTHROPIC_API_KEY=<your-api-key>
ADZUNA_APP_ID=<your-app-id>
ADZUNA_API_KEY=<your-api-key>
```

Optional:
```
NODE_ENV=development|production
PYTHON_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Security Notes

- `.env` contains secrets - never commit to git
- Use `.env.example` as template without secrets
- Rotate API keys regularly
- Run in secure environment
- For production, use environment-specific configs

## Support & Help

1. Check this README
2. Review SCRIPTS_QUICK_REFERENCE.md
3. Read SCRIPTS_DOCUMENTATION.md
4. Check DEPLOYMENT_GUIDE.md
5. Review inline script comments
6. Check terminal output for error messages

---

## Quick Start Summary

```bash
# First time
npm run setup

# Configure
vim .env

# Start development
npm run dev

# Done! Access at http://localhost:3000
```

---

**Last Updated:** December 25, 2025

**Project:** Job Search Platform

**Monorepo Type:** pnpm workspaces with Node.js and Python services

**Questions?** See the documentation files in the root directory.
