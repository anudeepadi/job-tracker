# Session Memory Storage

## Purpose
This directory stores session-based memory data, conversation history, and contextual information for development sessions using the Claude-Flow orchestration system in the Jobs monorepo.

## Structure
Sessions are organized by date and session ID for easy retrieval:

```
orchestration/memory/sessions/
├── 2025-12-25/
│   ├── session_001/
│   │   ├── metadata.json        # Session metadata and configuration
│   │   ├── conversation.md      # Full conversation history
│   │   ├── decisions.md         # Key decisions and rationale
│   │   ├── artifacts/           # Generated files and outputs
│   │   └── coordination_state/  # Coordination system snapshots
│   └── ...
└── shared/
    ├── patterns.md              # Common session patterns
    └── templates/               # Session template files
```

## Monorepo Session Types
- **Full-Stack Sessions**: Coordinate between apps/web and services/job-agent
- **Frontend Sessions**: Focus on Next.js job tracker UI
- **Backend Sessions**: Focus on Python FastAPI job search agent
- **Integration Sessions**: Cross-service API development

## Usage Guidelines
1. **Session Isolation**: Each session gets its own directory
2. **Metadata Completeness**: Always fill out session metadata
3. **Conversation Logging**: Document all significant interactions
4. **Artifact Organization**: Structure generated files clearly
5. **State Preservation**: Snapshot coordination state regularly
6. **Output Directory**: Store generated artifacts in data/agent-outputs

## Last Updated
2025-12-25
