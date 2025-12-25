"""
Job Search AI Agent System - Source Package

This package contains the core components for the multi-agent job search system.
"""

from src.config import (
    DEFAULT_JOB_ROLE,
    DEFAULT_LOCATION,
    DEFAULT_NUM_RESULTS,
    OUTPUT_DIR,
    validate_config,
    print_config,
    CREW_PROCESS,
    LLM_MODEL,
    AGENT_VERBOSE,
    AGENT_ALLOW_DELEGATION,
    AGENT_MEMORY,
    ADZUNA_APP_ID,
    ADZUNA_API_KEY,
    ADZUNA_BASE_URL,
    ADZUNA_COUNTRY,
    API_TIMEOUT,
    API_MAX_RETRIES,
    API_RETRY_DELAY,
)
from src.agents import create_all_agents
from src.tasks import create_all_tasks
from src.tools import search_jobs

__all__ = [
    "create_all_agents",
    "create_all_tasks",
    "search_jobs",
    "validate_config",
    "print_config",
    "DEFAULT_JOB_ROLE",
    "DEFAULT_LOCATION",
    "DEFAULT_NUM_RESULTS",
    "OUTPUT_DIR",
    "CREW_PROCESS",
    "LLM_MODEL",
]
