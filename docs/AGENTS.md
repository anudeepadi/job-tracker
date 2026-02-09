# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A full-stack job search platform with AI-powered job tracking. Monorepo containing:
- **Next.js 15 frontend** (`apps/web/`) - Job application tracker with Prisma/PostgreSQL
- **Python FastAPI backend** (`services/job-agent/`) - CrewAI multi-agent job search service

## Commands

### Development
```bash
npm run setup              # First-time setup (installs deps, creates venv, generates Prisma client)
npm run dev                # Start both services (Next.js on :3342, FastAPI on :8342)
npm run dev:web            # Start Next.js frontend only
npm run dev:agent          # Start Python backend only
```

### Database
```bash
npm run db:start           # Start PostgreSQL via Docker
npm run db:reset           # Reset database and run migrations
npm run db:studio          # Open Prisma Studio
cd apps/web && pnpm prisma migrate dev --name <name>   # Create new migration
cd apps/web && pnpm prisma migrate deploy              # Apply migrations
```

### Build & Lint
```bash
npm run build              # Build all packages
npm run lint               # Lint all packages
cd apps/web && pnpm prisma generate   # Regenerate Prisma client after schema changes
```

### Python Backend
```bash
cd services/job-agent
source venv/bin/activate   # Always activate venv before running
pip install -r requirements.txt
pytest                     # Run tests (when available)
```

## Architecture

### Frontend → Backend Communication
- Next.js API routes (`apps/web/src/app/api/`) handle frontend requests
- API routes call Python backend at `PYTHON_BACKEND_URL` for AI agent operations
- Direct Prisma calls for CRUD operations on applications, users, reminders

### Python CrewAI Service
- `app/main.py` - FastAPI entry point with CORS configured for localhost:3000
- `app/services/crew_service.py` - Orchestrates 4 AI agents via CrewAI:
  - Job Search Specialist (uses Adzuna API)
  - Skills Development Advisor
  - Interview Preparation Coach
  - Career Strategy Advisor
- Jobs run asynchronously in a ThreadPoolExecutor, stored in-memory (`JobStore`)

### Database Schema (Prisma)
Key models in `apps/web/prisma/schema.prisma`:
- `User`, `Session` - JWT auth
- `Application`, `Activity`, `Reminder` - Job tracking
- `JobSearch`, `JobResult`, `AgentOutput` - AI search results

### Key Files
- `apps/web/src/middleware.ts` - Auth middleware
- `apps/web/src/lib/` - Shared utilities and types
- `services/job-agent/src/agents.py` - CrewAI agent definitions
- `services/job-agent/src/tasks.py` - CrewAI task definitions

## Environment Variables

Required in root `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - For authentication
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - For AI agents
- `ADZUNA_APP_ID`, `ADZUNA_API_KEY` - For job search

## File Organization

- Frontend code: `apps/web/src/`
- Backend code: `services/job-agent/app/`
- Never save working files to root folder
- Prefer editing existing files over creating new ones
