# Hive Mind System - Jobs Monorepo

This directory contains the Claude Flow Hive Mind system configuration and data for the Jobs monorepo orchestration.

## Directory Structure

- **config/**: Configuration files for queens, workers, and system settings
- **sessions/**: Active and historical session data
- **memory/**: Collective memory and knowledge base
- **logs/**: System and debug logs
- **backups/**: Automated backups of system state
- **templates/**: Templates for agents and workflows
- **exports/**: Exported data and reports

## Database Files

- **hive.db**: Main SQLite database (or memory.json as fallback)
- **config.json**: Primary system configuration

## Monorepo Structure

```
Jobs/
├── apps/
│   └── web/                 # Next.js job tracker frontend
├── services/
│   └── job-agent/           # Python FastAPI job search agent
├── data/
│   └── agent-outputs/       # Generated agent outputs
├── orchestration/           # This directory - orchestration configs
│   ├── .hive-mind/          # Hive mind configuration
│   ├── .swarm/              # Swarm configurations
│   ├── coordination/        # Coordination configs
│   ├── memory/              # Memory bank
│   └── CLAUDE.md            # Main orchestration config
└── packages/                # Shared packages
```

## Getting Started

1. Initialize: `npx claude-flow@alpha hive-mind init`
2. Spawn swarm: `npx claude-flow@alpha hive-mind spawn "your objective"`
3. Check status: `npx claude-flow@alpha hive-mind status`

## Full-Stack Coordination

The hive mind coordinates between:
- **Frontend Workers** (apps/web): Next.js, React, TypeScript, Prisma
- **Backend Workers** (services/job-agent): Python, FastAPI, CrewAI
- **Integration Workers**: API contracts, type safety, error handling

## Features

- **Collective Intelligence**: Multiple AI agents working together
- **Consensus Building**: Democratic decision-making process
- **Adaptive Learning**: System improves over time
- **Fault Tolerance**: Self-healing and recovery capabilities
- **Performance Monitoring**: Real-time metrics and optimization
- **Cross-Stack Coordination**: Next.js and Python service integration

## Configuration

Edit `.hive-mind/config.json` to customize:
- Queen type and capabilities
- Worker specializations
- Consensus algorithms
- Memory settings
- Integration options
- Monorepo path mappings

For more information, see the [Hive Mind Documentation](https://github.com/ruvnet/claude-flow/docs/hive-mind.md).
