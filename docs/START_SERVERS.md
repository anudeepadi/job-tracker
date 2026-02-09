# Starting Frontend and Backend Servers

## Quick Start - Two Terminal Setup

### Terminal 1: Backend (Python FastAPI)

```bash
# Navigate to project root
cd /Users/vuc229/Documents/Development/Active-Projects/effective-barnacle

# Navigate to backend service
cd services/job-agent

# Activate virtual environment (if it exists)
source venv/bin/activate 2>/dev/null || true

# Install dependencies if needed
pip install -r requirements.txt

# Start the backend server
python run.py --reload --port 8000
```

**Backend will be available at:**
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

### Terminal 2: Frontend (Next.js)

```bash
# Navigate to project root
cd /Users/vuc229/Documents/Development/Active-Projects/effective-barnacle

# Start the frontend server
pnpm run dev:web
```

**Frontend will be available at:**
- Web App: http://localhost:3000

---

## Alternative: Using npm scripts

### Terminal 1 (Backend):
```bash
cd /Users/vuc229/Documents/Development/Active-Projects/effective-barnacle
pnpm run dev:agent
```

### Terminal 2 (Frontend):
```bash
cd /Users/vuc229/Documents/Development/Active-Projects/effective-barnacle
pnpm run dev:web
```

---

## Before Starting - Database Setup

### Option 1: Remote Database (Tailscale)

1. **Install and connect Tailscale:**
   ```bash
   # Download from: https://tailscale.com/download
   # Connect to your Tailnet
   ```

2. **Verify connection:**
   ```bash
   tailscale status
   ping 100.94.61.91
   ```

3. **Run migrations:**
   ```bash
   cd apps/web
   pnpm prisma generate
   pnpm prisma migrate deploy
   ```

### Option 2: Local Docker Database

1. **Start Docker database:**
   ```bash
   pnpm db:start
   ```

2. **Update `.env` in `apps/web/`:**
   ```env
   DATABASE_URL="postgresql://jobtracker:jobtracker_dev_password@localhost:5432/jobtracker"
   ```

3. **Run migrations:**
   ```bash
   cd apps/web
   pnpm prisma migrate deploy
   ```

---

## Troubleshooting

### Backend: Port 8000 Already in Use

```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
python run.py --reload --port 8001
```

### Backend: Module 'uvicorn' Not Found

```bash
cd services/job-agent
source venv/bin/activate
pip install uvicorn[standard]
pip install -r requirements.txt
```

### Frontend: Database Connection Error

1. **Check Tailscale connection** (for remote DB):
   ```bash
   tailscale status
   ```

2. **Check Docker** (for local DB):
   ```bash
   docker-compose ps
   ```

3. **Verify `.env` file:**
   ```bash
   cat apps/web/.env | grep DATABASE_URL
   ```

### Frontend: Missing Modules

All required modules should already be created:
- `@/lib/auth` ✅
- `@/lib/prisma` ✅
- `@/lib/utils` ✅
- `@/lib/types` ✅
- `@/lib/keyboard-shortcuts` ✅
- `@/lib/rate-limit` ✅

If you see errors, restart the dev server:
```bash
# Stop the server (Ctrl+C)
# Then restart
pnpm run dev:web
```

---

## Current Database Configuration

**Remote PostgreSQL (Tailscale):**
- Host: `100.94.61.91`
- Database: `app_dev`
- Connection: `postgresql://postgres:PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT@100.94.61.91:5432/app_dev`

**Note:** Make sure Tailscale is connected before starting the application!

---

## One-Command Alternative (Single Terminal)

If you prefer to run both in one terminal:

```bash
cd /Users/vuc229/Documents/Development/Active-Projects/effective-barnacle
pnpm run dev
```

This uses the unified script that starts both services together.

---

## Recommended Workflow

1. **Start Tailscale** (if using remote DB)
2. **Start Database** (Docker or verify remote connection)
3. **Terminal 1:** Start backend (`pnpm run dev:agent`)
4. **Terminal 2:** Start frontend (`pnpm run dev:web`)
5. **Open browser:** http://localhost:3000

---

## Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| Backend Docs | 8000 | http://localhost:8000/docs |
| Database (Remote) | 5432 | 100.94.61.91:5432 |
| Database (Local) | 5432 | localhost:5432 |
