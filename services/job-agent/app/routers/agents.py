"""
Agents endpoints router for the Job Agent API.

This module defines endpoints for retrieving information about
the available AI agents in the system.

Author: Backend API Designer
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends

from app.models.schemas import (
    AgentInfo,
    AgentsListResponse,
    HealthCheckResponse,
    DependencyStatus,
)
from app.services.crew_service import CrewService, get_crew_service


# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

router = APIRouter(
    prefix="/api",
    tags=["agents"],
)


# =============================================================================
# AGENT ENDPOINTS
# =============================================================================

@router.get(
    "/agents",
    response_model=AgentsListResponse,
    summary="List available agents",
    description="""
List all available AI agents in the job search system.

Each agent has specialized capabilities:

- **Job Search Specialist** - Searches for jobs using the Adzuna API
- **Skills Development Advisor** - Analyzes skills and creates learning roadmaps
- **Interview Preparation Coach** - Generates interview questions and preparation materials
- **Career Strategy Advisor** - Provides resume, LinkedIn, and application advice

The response includes each agent's role, goal, capabilities, and available tools.
""",
    responses={
        200: {
            "description": "List of agents retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "agents": [
                            {
                                "id": "job_searcher",
                                "name": "Job Search Specialist",
                                "role": "Job Search Specialist",
                                "goal": "Find highly relevant job listings matching the candidate's criteria",
                                "capabilities": [
                                    {
                                        "name": "Job Search",
                                        "description": "Search for jobs using the Adzuna API"
                                    }
                                ],
                                "has_tools": True,
                                "tools": ["Job Search Tool (Adzuna API)"]
                            }
                        ],
                        "total_count": 4
                    }
                }
            }
        },
    },
)
async def list_agents(
    service: CrewService = Depends(get_crew_service),
) -> AgentsListResponse:
    """
    List all available AI agents and their capabilities.

    Args:
        service: CrewAI service dependency

    Returns:
        AgentsListResponse with list of all agents
    """
    agents = service.get_agents_info()

    return AgentsListResponse(
        agents=agents,
        total_count=len(agents),
    )


@router.get(
    "/agents/{agent_id}",
    response_model=AgentInfo,
    summary="Get agent details",
    description="""
Get detailed information about a specific agent.

Valid agent IDs:
- `job_searcher` - Job Search Specialist
- `skills_advisor` - Skills Development Advisor
- `interview_coach` - Interview Preparation Coach
- `career_advisor` - Career Strategy Advisor
""",
    responses={
        200: {"description": "Agent details retrieved successfully"},
        404: {"description": "Agent not found"},
    },
)
async def get_agent(
    agent_id: str,
    service: CrewService = Depends(get_crew_service),
) -> AgentInfo:
    """
    Get detailed information about a specific agent.

    Args:
        agent_id: Agent identifier
        service: CrewAI service dependency

    Returns:
        AgentInfo with agent details

    Raises:
        HTTPException: If agent_id is not found
    """
    from fastapi import HTTPException, status

    agents = service.get_agents_info()

    for agent in agents:
        if agent.id == agent_id:
            return agent

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "code": "agent_not_found",
            "message": f"Agent with ID '{agent_id}' not found",
            "valid_ids": [a.id for a in agents],
        }
    )


# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================

@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check",
    description="""
Check the health status of the Job Agent API service.

Returns:
- Overall service status
- Service version
- Status of key dependencies (Anthropic API, Adzuna API)
""",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "service": "job-agent-api",
                        "version": "1.0.0",
                        "timestamp": "2025-01-15T10:30:00Z",
                        "dependencies": [
                            {
                                "name": "anthropic_api",
                                "status": "healthy",
                                "message": "API key configured"
                            },
                            {
                                "name": "adzuna_api",
                                "status": "healthy",
                                "message": "API credentials configured"
                            }
                        ]
                    }
                }
            }
        },
        503: {
            "description": "Service is unhealthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "unhealthy",
                        "service": "job-agent-api",
                        "version": "1.0.0",
                        "timestamp": "2025-01-15T10:30:00Z",
                        "dependencies": [
                            {
                                "name": "anthropic_api",
                                "status": "unhealthy",
                                "message": "API key not configured"
                            }
                        ]
                    }
                }
            }
        },
    },
    tags=["health"],
)
async def health_check(
    service: CrewService = Depends(get_crew_service),
) -> HealthCheckResponse:
    """
    Perform a health check on the service.

    Checks:
    - Anthropic API key configuration
    - Adzuna API credentials configuration

    Args:
        service: CrewAI service dependency

    Returns:
        HealthCheckResponse with service status
    """
    from fastapi import Response

    dependencies: List[DependencyStatus] = []
    overall_status = "healthy"

    # Check configuration
    is_valid, errors = service.validate_configuration()

    # Check Anthropic API
    anthropic_configured = not any("ANTHROPIC_API_KEY" in err for err in errors)
    dependencies.append(DependencyStatus(
        name="anthropic_api",
        status="healthy" if anthropic_configured else "unhealthy",
        message="API key configured" if anthropic_configured else "API key not configured"
    ))
    if not anthropic_configured:
        overall_status = "unhealthy"

    # Check Adzuna API
    adzuna_app_configured = not any("ADZUNA_APP_ID" in err for err in errors)
    adzuna_key_configured = not any("ADZUNA_API_KEY" in err for err in errors)
    adzuna_configured = adzuna_app_configured and adzuna_key_configured

    dependencies.append(DependencyStatus(
        name="adzuna_api",
        status="healthy" if adzuna_configured else "unhealthy",
        message="API credentials configured" if adzuna_configured else "API credentials not configured"
    ))
    if not adzuna_configured:
        overall_status = "degraded" if overall_status == "healthy" else overall_status

    return HealthCheckResponse(
        status=overall_status,
        service="job-agent-api",
        version="1.0.0",
        timestamp=datetime.utcnow(),
        dependencies=dependencies,
    )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["router"]
