"""
Agent modules for specialized CrewAI agents.

Each module provides agent creation and task creation functions
for a specific AI-powered capability.
"""

from app.agents.cover_letter_agent import (
    create_cover_letter_agent,
    create_cover_letter_task,
)
from app.agents.followup_agent import (
    create_followup_agent,
    create_followup_task,
)
from app.agents.networking_agent import (
    create_networking_agent,
    create_networking_task,
)

__all__ = [
    "create_cover_letter_agent",
    "create_cover_letter_task",
    "create_followup_agent",
    "create_followup_task",
    "create_networking_agent",
    "create_networking_task",
]
