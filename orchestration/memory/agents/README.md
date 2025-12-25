# Agent Memory Storage

## Purpose
This directory stores agent-specific memory data, configurations, and persistent state information for individual Claude agents in the monorepo orchestration system.

## Structure
Each agent gets its own subdirectory for isolated memory storage:

```
orchestration/memory/agents/
├── frontend-agent/
│   ├── state.json           # Agent state and configuration
│   ├── knowledge.md         # Agent-specific knowledge base
│   ├── tasks.json          # Completed and active tasks
│   └── calibration.json    # Agent-specific calibrations
├── backend-agent/
│   └── ...
├── coordinator-agent/
│   └── ...
└── shared/
    ├── common_knowledge.md  # Shared knowledge across agents
    └── global_config.json  # Global agent configurations
```

## Monorepo Path Mappings
- **Frontend Agent** -> apps/web (Next.js job tracker)
- **Backend Agent** -> services/job-agent (Python FastAPI)
- **Coordinator Agent** -> Orchestrates cross-service communication
- **Data Agent** -> data/agent-outputs (Generated outputs)

## Usage Guidelines
1. **Agent Isolation**: Each agent should only read/write to its own directory
2. **Shared Resources**: Use the `shared/` directory for cross-agent information
3. **State Persistence**: Update state.json whenever agent status changes
4. **Knowledge Sharing**: Document discoveries in knowledge.md files
5. **Cross-Service Coordination**: Use shared memory for frontend-backend sync
6. **Cleanup**: Remove directories for terminated agents periodically

## Last Updated
2025-12-25
