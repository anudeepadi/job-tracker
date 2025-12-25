# Jobs Monorepo Orchestration - Claude Code Configuration

## Project Overview

This is the unified orchestration configuration for the Jobs monorepo, coordinating the Next.js frontend with the Python FastAPI backend using SPARC methodology and Claude-Flow orchestration.

## Monorepo Structure

```
Jobs/
├── apps/
│   └── web/                     # Next.js job tracker frontend
│       ├── src/
│       │   ├── app/             # Next.js App Router
│       │   ├── components/      # React components
│       │   └── lib/             # Utilities and types
│       └── prisma/              # Database schema
├── services/
│   └── job-agent/               # Python FastAPI job search agent
│       ├── app/
│       │   ├── models/          # Pydantic schemas
│       │   ├── routers/         # API endpoints
│       │   └── services/        # CrewAI service
│       └── run.py               # Entry point
├── data/
│   └── agent-outputs/           # Generated agent outputs
├── orchestration/               # Orchestration configs (this directory)
│   ├── .hive-mind/              # Hive mind configuration
│   ├── .swarm/                  # Swarm configurations
│   ├── coordination/            # Coordination configs
│   ├── memory/                  # Memory bank
│   ├── .mcp.json                # MCP server config
│   └── CLAUDE.md                # This file
├── packages/                    # Shared packages
└── scripts/                     # Utility scripts
```

## CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently

### GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message

## Path Mappings (Legacy -> Monorepo)

| Legacy Path | Monorepo Path |
|-------------|---------------|
| `job-tracker/` | `apps/web/` |
| `job-search-agent/` | `services/job-agent/` |
| `outputs/` | `data/agent-outputs/` |
| `job-search/` | `orchestration/` |

## Running the Integrated System

### Frontend (Next.js Job Tracker)
```bash
cd apps/web
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend (Python Job Agent)
```bash
cd services/job-agent
pip install -r requirements.txt
python run.py
# Runs on http://localhost:8000
```

### Full Stack Development
```bash
# From monorepo root
pnpm install           # Install all dependencies
pnpm run dev           # Start all services

# Or use the scripts
./scripts/dev.sh       # Development mode
./scripts/build.sh     # Production build
```

## Swarm Patterns for Frontend-Backend Coordination

### Pattern 1: Full-Stack Feature Development

```javascript
// Single message with coordinated agents
[Parallel Agent Execution]:
  Task("Frontend Architect", "Design React component for job search UI in apps/web/src/components. Create TypeScript interfaces matching backend schemas.", "frontend-architect")
  Task("Backend Architect", "Design FastAPI endpoint in services/job-agent/app/routers. Create Pydantic models for request/response.", "backend-architect")
  Task("API Integrator", "Create API client in apps/web/src/lib to call services/job-agent. Ensure type safety.", "api-integrator")
  Task("Test Engineer", "Write tests for both frontend and backend. Ensure API contract compliance.", "tester")
```

### Pattern 2: API Integration Swarm

```javascript
// Coordinate API changes across stack
[Message 1 - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 4 }
  mcp__claude-flow__agent_spawn { type: "api-integrator" }

[Message 2 - Parallel Execution]:
  Task("Backend API", "Create/update endpoint in services/job-agent/app/routers/search.py. Document OpenAPI schema.", "backend-dev")
  Task("Frontend API Client", "Create/update API client in apps/web/src/lib. Add proper error handling.", "coder")
  Task("Type Synchronizer", "Ensure TypeScript types in apps/web match Pydantic models in services/job-agent.", "reviewer")
```

### Pattern 3: Job Search Workflow

```javascript
// Coordinate job search feature across services
[Single Message - Full Stack]:
  Task("CrewAI Agent", "Implement job search crew in services/job-agent/app/services/crew_service.py", "backend-dev")
  Task("API Router", "Create search endpoint in services/job-agent/app/routers/search.py", "backend-dev")
  Task("React UI", "Create job search panel in apps/web/src/components/job-search/", "coder")
  Task("State Manager", "Implement search state management in apps/web", "coder")
  Task("Integration", "Wire up frontend to backend API", "api-integrator")
```

### Pattern 4: Database Schema Changes

```javascript
// Coordinate database changes across stack
[Parallel Execution]:
  Task("Schema Designer", "Update Prisma schema in apps/web/prisma/schema.prisma", "architect")
  Task("Migration Runner", "Generate and apply migrations for apps/web", "implementer")
  Task("Backend Sync", "Update Pydantic models in services/job-agent to match new schema", "backend-dev")
  Task("API Update", "Update API contracts between frontend and backend", "api-integrator")
```

## Agent Coordination Protocol

### Every Agent MUST:

**1. BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2. DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3. AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## Available Agents

### Core Development
- `coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized for Monorepo
- `frontend-architect` - Next.js/React expertise
- `backend-architect` - Python/FastAPI expertise
- `api-integrator` - Cross-service coordination
- `database-architect` - Prisma/schema design

### Swarm Coordination
- `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository
- `github-modes`, `pr-manager`, `code-review-swarm`

## Technology Stack

### Frontend (apps/web)
- Next.js 14+ with App Router
- React 18+
- TypeScript
- Tailwind CSS
- Prisma ORM
- shadcn/ui components

### Backend (services/job-agent)
- Python 3.11+
- FastAPI
- CrewAI for AI agents
- Pydantic for validation
- Uvicorn ASGI server

### Integration
- REST API communication
- Shared type definitions
- Environment-based configuration

## Environment Variables

### Root Level (.env)
```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
JOB_AGENT_URL=http://localhost:8000

# AI Keys
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

### Frontend (apps/web/.env)
```env
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (services/job-agent/.env)
```env
OPENAI_API_KEY=your_key
SERPER_API_KEY=your_key
```

## Build Commands

### Frontend
```bash
cd apps/web
npm run build        # Production build
npm run dev          # Development mode
npm run lint         # Linting
npm run typecheck    # Type checking
```

### Backend
```bash
cd services/job-agent
pip install -r requirements.txt
python run.py        # Start server
pytest               # Run tests
```

### Monorepo
```bash
pnpm install         # Install all
pnpm run dev         # Start all services
pnpm run build       # Build all
pnpm run test        # Test all
```

## MCP Tool Categories

### Coordination
- `swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
- `swarm_status`, `agent_list`, `agent_metrics`

### Memory & Neural
- `memory_usage`, `neural_status`, `neural_patterns`

### GitHub Integration
- `github_swarm`, `repo_analyze`, `pr_enhance`

## Quick Setup

```bash
# Add MCP servers
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start
claude mcp add flow-nexus npx flow-nexus@latest mcp start
```

## File Organization Rules

**NEVER save to root folder. Use these directories:**
- `apps/web/src/` - Frontend source code
- `apps/web/src/components/` - React components
- `services/job-agent/app/` - Backend source code
- `data/agent-outputs/` - Generated outputs
- `orchestration/` - Orchestration configs

## Important Reminders

1. Do what has been asked; nothing more, nothing less
2. NEVER create files unless absolutely necessary
3. ALWAYS prefer editing existing files to creating new ones
4. NEVER proactively create documentation unless requested
5. Never save working files to the root folder
6. Coordinate frontend and backend changes together
7. Ensure type safety across the stack

---

**Remember: Claude Flow coordinates, Claude Code creates!**
