"""
Configuration module for the Job Search AI Agent System.

This module contains all configuration settings, environment variable loading,
and validation functions for the multi-agent job search system.

Author: Claude Builder Club @ UC Irvine
Workshop: Intro to AI Agents (October 20, 2025)
"""

import os
from pathlib import Path
from typing import List, Tuple
from dotenv import load_dotenv
from crewai import Process

# =============================================================================
# ENVIRONMENT LOADING
# =============================================================================

# Load environment variables from .env file
# Look for .env in the project root (3 levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    # Try loading from current directory as fallback
    load_dotenv()

# =============================================================================
# API KEYS & CREDENTIALS
# =============================================================================

# Anthropic Claude API Key
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Adzuna Job Search API Credentials
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_API_KEY = os.getenv("ADZUNA_API_KEY", "")

# =============================================================================
# ADZUNA API CONFIGURATION
# =============================================================================

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
ADZUNA_COUNTRY = "us"  # United States job listings

# =============================================================================
# LINKEDIN JOBS API (via RapidAPI)
# =============================================================================

LINKEDIN_RAPIDAPI_KEY = os.getenv("LINKEDIN_RAPIDAPI_KEY", "")
LINKEDIN_BASE_URL = "https://linkedin-jobs-search.p.rapidapi.com"
LINKEDIN_RAPIDAPI_HOST = "linkedin-jobs-search.p.rapidapi.com"

# =============================================================================
# JSEARCH API (via RapidAPI - aggregates multiple job boards)
# =============================================================================

JSEARCH_RAPIDAPI_KEY = os.getenv("JSEARCH_RAPIDAPI_KEY", "")
JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com"
JSEARCH_RAPIDAPI_HOST = "jsearch.p.rapidapi.com"

# =============================================================================
# REMOTEOK API (free, no auth needed - focused on remote jobs)
# =============================================================================

REMOTEOK_ENABLED = os.getenv("REMOTEOK_ENABLED", "true").lower() == "true"
REMOTEOK_BASE_URL = "https://remoteok.com/api"

# =============================================================================
# API REQUEST SETTINGS
# =============================================================================

API_TIMEOUT = 30  # Request timeout in seconds
API_MAX_RETRIES = 3  # Maximum retry attempts
API_RETRY_DELAY = 2  # Delay between retries in seconds
API_RATE_LIMIT_DELAY = 1  # Delay between API calls to respect rate limits

# =============================================================================
# LLM CONFIGURATION
# =============================================================================

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# LLM model to use for all agents (switched from Claude to OpenAI)
# Options: gpt-4o, gpt-4o-mini, gpt-4-turbo
LLM_MODEL = "gpt-4o-mini"  # Cost-effective and fast

# =============================================================================
# AGENT CONFIGURATION
# =============================================================================

AGENT_VERBOSE = True  # Show detailed agent output
AGENT_ALLOW_DELEGATION = False  # Disable delegation for simpler workflow
AGENT_MEMORY = True  # Enable agent memory

# =============================================================================
# CREW CONFIGURATION
# =============================================================================

CREW_PROCESS = Process.sequential  # Run tasks one after another

# =============================================================================
# DEFAULT JOB SEARCH PARAMETERS
# =============================================================================

DEFAULT_JOB_ROLE = "Software Engineer"
DEFAULT_LOCATION = "San Francisco"
DEFAULT_NUM_RESULTS = 5

# =============================================================================
# OUTPUT CONFIGURATION
# =============================================================================

# Directory for saving output files
OUTPUT_DIR = PROJECT_ROOT / "data" / "agent-outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

def validate_config() -> Tuple[bool, List[str]]:
    """
    Validate that all required configuration is present.

    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []

    # Check OpenAI API key (now using OpenAI instead of Anthropic)
    if not OPENAI_API_KEY:
        errors.append("OPENAI_API_KEY is not set. Please add it to your .env file.")
    elif not OPENAI_API_KEY.startswith("sk-"):
        errors.append("OPENAI_API_KEY appears to be invalid (should start with 'sk-').")

    # Check Adzuna credentials
    if not ADZUNA_APP_ID:
        errors.append("ADZUNA_APP_ID is not set. Please add it to your .env file.")

    if not ADZUNA_API_KEY:
        errors.append("ADZUNA_API_KEY is not set. Please add it to your .env file.")

    return (len(errors) == 0, errors)


def print_config():
    """Print current configuration (without sensitive values)."""
    print("\n" + "=" * 80)
    print("CONFIGURATION")
    print("=" * 80)
    print(f"  OpenAI API Key:      {'✅ Set' if OPENAI_API_KEY else '❌ Missing'}")
    print(f"  Adzuna App ID:       {'✅ Set' if ADZUNA_APP_ID else '❌ Missing'}")
    print(f"  Adzuna API Key:      {'✅ Set' if ADZUNA_API_KEY else '❌ Missing'}")
    print(f"  LinkedIn API Key:    {'✅ Set' if LINKEDIN_RAPIDAPI_KEY else '⚠️  Optional'}")
    print(f"  JSearch API Key:     {'✅ Set' if JSEARCH_RAPIDAPI_KEY else '⚠️  Optional'}")
    print(f"  RemoteOK Enabled:    {'✅ Enabled' if REMOTEOK_ENABLED else '❌ Disabled'}")
    print(f"  LLM Model:           {LLM_MODEL}")
    print(f"  Output Directory:    {OUTPUT_DIR}")
    print("=" * 80 + "\n")


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "OPENAI_API_KEY",
    "ADZUNA_APP_ID",
    "ADZUNA_API_KEY",
    "ADZUNA_BASE_URL",
    "ADZUNA_COUNTRY",
    "LINKEDIN_RAPIDAPI_KEY",
    "LINKEDIN_BASE_URL",
    "LINKEDIN_RAPIDAPI_HOST",
    "JSEARCH_RAPIDAPI_KEY",
    "JSEARCH_BASE_URL",
    "JSEARCH_RAPIDAPI_HOST",
    "REMOTEOK_ENABLED",
    "REMOTEOK_BASE_URL",
    "API_TIMEOUT",
    "API_MAX_RETRIES",
    "API_RETRY_DELAY",
    "API_RATE_LIMIT_DELAY",
    "LLM_MODEL",
    "AGENT_VERBOSE",
    "AGENT_ALLOW_DELEGATION",
    "AGENT_MEMORY",
    "CREW_PROCESS",
    "DEFAULT_JOB_ROLE",
    "DEFAULT_LOCATION",
    "DEFAULT_NUM_RESULTS",
    "OUTPUT_DIR",
    "validate_config",
    "print_config",
]
