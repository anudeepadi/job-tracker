# Job Search Platform - Startup Scripts Documentation

This document provides comprehensive guidance on using the unified startup scripts for the Job Search Platform monorepo.

## Overview

The scripts are located in `/scripts/` directory and provide a unified interface for managing the entire monorepo across development, production, and data migration operations.

## Available Scripts

### 1. setup.sh - Initial Project Setup

**Purpose:** Initializes the entire development environment for first-time setup.

**Location:** `/scripts/setup.sh`

**Usage:**
```bash
npm run setup
# or
bash scripts/setup.sh
```

**What it does:**
- Checks and installs pnpm (Node.js package manager) if not available
- Installs all Node.js dependencies using `pnpm install`
- Verifies Python 3 is installed
- Creates a Python virtual environment (`venv`) in `services/job-agent/`
- Installs Python dependencies from `services/job-agent/requirements.txt`
- Creates `.env` file from `.env.example` if it doesn't exist
- Generates Prisma client for database ORM
- Prompts user to configure API keys in `.env` file

**Requirements:**
- Node.js >= 18.0.0
- Python 3.8 or later
- Internet connection for downloading dependencies

**Output:**
- Installed Node.js and Python dependencies
- `.env` file configured
- Ready for development

**Example Output:**
```
========================================
Job Search Platform - Setup Script
========================================

Step 1: Checking pnpm installation...
pnpm is already installed 9.0.0

Step 2: Installing Node.js dependencies with pnpm...
[...installation logs...]

Step 3: Installing Python dependencies...
Creating Python virtual environment...

Step 4: Setting up environment configuration...
.env file created from .env.example

Step 5: Generating Prisma client...

Step 6: Verifying API key configuration...
Please update the .env file with your API keys:
  vim /Users/vuc229/Downloads/Projects/Jobs/.env

========================================
Setup completed successfully!
========================================
```

---

### 2. start-dev.sh - Development Server

**Purpose:** Starts all services in development mode with hot reload capabilities.

**Location:** `/scripts/start-dev.sh`

**Usage:**
```bash
npm run dev
# or
bash scripts/start-dev.sh
```

**What it does:**
- Loads environment variables from `.env` file
- Activates Python virtual environment
- Starts Python FastAPI backend on port 8000 with `--reload` for hot reload
- Starts Next.js development server on port 3000 with hot reload
- Monitors both services and gracefully shuts them down on Ctrl+C
- Checks port availability before starting services
- Provides colored output for easy monitoring

**Requirements:**
- `.env` file must exist (run `npm run setup` first)
- Ports 8000 and 3000 must be available
- Python virtual environment must be initialized

**Services Started:**
- **Python Backend:** http://localhost:8000
- **Python API Docs:** http://localhost:8000/docs
- **Next.js Frontend:** http://localhost:3000

**Key Features:**
- Hot reload for both frontend and backend
- Automatic cleanup on exit (Ctrl+C)
- Port conflict detection
- Colored logging for better visibility
- Real-time logs from both services

**Example Usage Flow:**
```bash
# Terminal 1: Start development servers
npm run dev

# Terminal 2 (Optional): In another terminal, you can run other commands
npm run build
npm run test
```

**To Stop Services:**
- Press `Ctrl+C` in the terminal where the script is running
- All services will gracefully shut down

---

### 3. start-prod.sh - Production Server

**Purpose:** Starts all services in production mode for deployment scenarios.

**Location:** `/scripts/start-prod.sh`

**Usage:**
```bash
npm run start
# or
bash scripts/start-prod.sh
```

**What it does:**
- Loads environment variables from `.env` file
- Verifies `.env` file exists
- Checks if Next.js is built (runs build if needed)
- Activates Python virtual environment
- Starts Python FastAPI backend on port 8000 in production mode (4 workers)
- Starts Next.js in production mode on port 3000
- Monitors services with graceful shutdown on Ctrl+C
- Checks port availability

**Requirements:**
- `.env` file must exist
- Ports 8000 and 3000 must be available
- Python virtual environment must be initialized

**Services Started:**
- **Python Backend:** http://localhost:8000 (with 4 workers)
- **Python API Docs:** http://localhost:8000/docs
- **Next.js Frontend:** http://localhost:3000

**Key Features:**
- Production-ready configuration
- Multi-worker Python backend (4 workers)
- Pre-built Next.js application
- Automatic build if `.next` directory missing
- No hot reload (better performance)
- Port conflict detection

**Configuration Options:**

To modify production settings, edit the script directly:
- Change Python workers: Modify `--workers 4` in the script
- Change ports: Update port numbers in port checks and service starts
- Add environment-specific configs: Modify environment variable loading

---

### 4. migrate-data.sh - Data Migration

**Purpose:** Migrates agent output files from job-search-agent to the data/agent-outputs directory.

**Location:** `/scripts/migrate-data.sh`

**Usage:**
```bash
npm run migrate-data
# or
bash scripts/migrate-data.sh
```

**What it does:**
- Copies all files from `job-search-agent/outputs/` to `data/agent-outputs/`
- Preserves complete directory structure
- Creates `data/agent-outputs/` directory if it doesn't exist
- Backs up existing data with timestamp before migration
- Uses `rsync` for reliable file copying (falls back to `cp` if unavailable)
- Provides detailed migration summary and file listing
- Verifies migration completion

**Source Directory:**
```
job-search-agent/outputs/
├── career_advisory_*.txt
├── career_advisory_*.md
├── interview_prep_*.txt
├── interview_prep_*.md
├── job_search_*.txt
├── job_search_*.md
├── skills_analysis_*.txt
└── ...
```

**Destination Directory:**
```
data/agent-outputs/
├── career_advisory_*.txt
├── career_advisory_*.md
├── interview_prep_*.txt
├── interview_prep_*.md
├── job_search_*.txt
├── job_search_*.md
├── skills_analysis_*.txt
└── ...
```

**Features:**
- Automatic backup creation with timestamp
- Progress indication during copy
- File count verification
- Detailed migration summary
- Safe operation (doesn't delete source)

**Example Output:**
```
========================================
Data Migration Script
========================================

Found 12 files to migrate

Destination directory already contains files
Creating backup: /Users/vuc229/Downloads/Projects/Jobs/data/agent-outputs_backup_1703503200

Migrating data files...
[...file copy progress...]

========================================
Data Migration Completed
========================================

Migration Summary:
  - Source:       /Users/vuc229/Downloads/Projects/Jobs/job-search-agent/outputs
  - Destination:  /Users/vuc229/Downloads/Projects/Jobs/data/agent-outputs
  - Files copied: 12

Backup Information:
  - Location: /Users/vuc229/Downloads/Projects/Jobs/data/agent-outputs_backup_1703503200

Migrated files:
  - /Users/vuc229/Downloads/Projects/Jobs/data/agent-outputs/career_advisory_20251224_205125.txt
  - /Users/vuc229/Downloads/Projects/Jobs/data/agent-outputs/interview_prep_20251224_205003.txt
  ...

Migration completed successfully!
```

---

## Quick Start Guide

### First-Time Setup

```bash
# 1. Clone or navigate to project
cd /Users/vuc229/Downloads/Projects/Jobs

# 2. Run setup script
npm run setup

# 3. Configure API keys in .env
vim .env

# 4. Start development servers
npm run dev
```

### Development Workflow

```bash
# Start development servers
npm run dev

# In another terminal, run tests or build
npm run test
npm run build

# Migrate data from job-search-agent
npm run migrate-data
```

### Production Deployment

```bash
# Setup (if not done yet)
npm run setup

# Start production servers
npm run start

# The application will be available at http://localhost:3000
```

---

## Script Architecture

### Environment Variable Management

All scripts load environment variables from `.env` file:

```bash
export $(cat "$ROOT_DIR/.env" | grep -v '^#' | xargs)
```

This loads all non-comment lines from `.env` as environment variables.

### Port Management

Scripts check for port conflicts before starting services:

- **Port 8000:** Python FastAPI backend
- **Port 3000:** Next.js frontend

If ports are in use:
```
Error: Port XXXX is already in use
Please stop other services first
```

### Process Management

Scripts use background processes with PIDs:

```bash
cd "$ROOT_DIR/services/job-agent"
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000 &
PYTHON_PID=$!
```

This allows:
- Independent process tracking
- Graceful shutdown on Ctrl+C
- Proper cleanup via trap handlers

### Error Handling

All scripts use `set -e` to exit on first error:

```bash
set -e
```

This ensures:
- Script stops if any command fails
- No partial execution
- Clear error reporting

---

## Troubleshooting

### Issue: "pnpm not found"

**Solution:**
```bash
npm install -g pnpm@9.0.0
npm run setup
```

### Issue: "Python not found"

**Solution:**
- macOS: `brew install python3`
- Ubuntu/Debian: `sudo apt-get install python3 python3-venv`
- Windows: Download from https://www.python.org/downloads/

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port (requires script modification)
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port (modify script or .env)
```

### Issue: ".env file not found"

**Solution:**
```bash
npm run setup
# This will create .env from .env.example
```

### Issue: "Virtual environment not found"

**Solution:**
```bash
cd services/job-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: API keys not configured

**Solution:**
1. Get API keys from:
   - **Anthropic:** https://console.anthropic.com/
   - **Adzuna:** https://developer.adzuna.com/
   - **Database:** Your database provider

2. Update `.env` file:
```bash
vim .env
```

3. Restart services:
```bash
npm run dev
```

---

## Script Customization

### Changing Python Port

Edit `start-dev.sh` or `start-prod.sh`:

```bash
# Change from 8000 to 8080
python -m uvicorn app.main:app --reload --port 8080 &
```

### Changing Next.js Port

Set environment variable before running:

```bash
PORT=3001 npm run dev
```

Or edit in `.env`:
```
PORT=3001
```

### Adding More Services

Extend the startup scripts:

```bash
# Start new service
cd "$ROOT_DIR/services/new-service"
npm run dev &
NEW_SERVICE_PID=$!

# Add to cleanup
kill $NEW_SERVICE_PID 2>/dev/null || true
```

### Modifying Python Workers

In `start-prod.sh`, change workers count:

```bash
# Change from 4 to 8 workers
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 8 &
```

---

## Security Considerations

### Environment Variables

- `.env` file contains sensitive information
- Never commit `.env` to version control
- Use `.env.example` template without secrets
- Rotate API keys regularly

### Script Permissions

Scripts are executable with proper permissions:

```bash
chmod +x scripts/*.sh
```

### Production Deployment

For production:
1. Use environment-specific `.env.prod`
2. Implement container orchestration (Docker/Kubernetes)
3. Use process managers (systemd, supervisord)
4. Set up monitoring and logging
5. Use HTTPS with proper certificates

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Setup project
  run: npm run setup

- name: Run tests
  run: npm run test

- name: Build application
  run: npm run build

- name: Start services
  run: npm run start &
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Docker Integration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm run setup

RUN npm run build

EXPOSE 3000 8000

CMD ["npm", "run", "start"]
```

---

## Performance Tips

### Development

- Use `npm run dev` for development with hot reload
- Keep browser open to see changes instantly
- Use Python debugger for backend issues

### Production

- Use `npm run start` for optimized performance
- Configure multiple workers based on CPU cores
- Use monitoring tools for performance tracking
- Implement caching strategies

### Data Migration

- Run `npm run migrate-data` once after initial setup
- Backup exists before each migration
- Monitor disk space for large datasets

---

## Maintenance

### Regular Tasks

1. **Weekly:** Check for dependency updates
   ```bash
   npm outdated
   pip list --outdated
   ```

2. **Monthly:** Clean and rebuild
   ```bash
   npm run clean
   npm run setup
   npm run build
   ```

3. **As needed:** Migrate data
   ```bash
   npm run migrate-data
   ```

### Updating Scripts

To update scripts safely:

1. Test changes in a development environment
2. Create a backup of working scripts
3. Update one script at a time
4. Verify functionality after each update
5. Document any changes

---

## Summary

| Script | Purpose | Usage | Key Features |
|--------|---------|-------|--------------|
| setup.sh | Initial setup | `npm run setup` | Installs dependencies, creates venv |
| start-dev.sh | Development | `npm run dev` | Hot reload, concurrent services |
| start-prod.sh | Production | `npm run start` | Optimized, multi-worker setup |
| migrate-data.sh | Data migration | `npm run migrate-data` | Preserves structure, auto-backup |

---

## Support

For issues or questions:

1. Check troubleshooting section
2. Review script comments
3. Check environment configuration
4. Verify all dependencies are installed
5. Check file permissions

---

**Last Updated:** December 25, 2025

**Maintained by:** DevOps Engineering Team
