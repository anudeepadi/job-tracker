"""
Agents endpoints router for the Job Agent API.

This module defines endpoints for retrieving information about
the available AI agents in the system, as well as specialized
agent action endpoints (cover letter, follow-up, networking).

Author: Backend API Designer
"""

import asyncio
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.schemas import (
    AgentInfo,
    AgentsListResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    FollowupEmailRequest,
    FollowupEmailResponse,
    HealthCheckResponse,
    DependencyStatus,
    NetworkResearchRequest,
    NetworkResearchResponse,
)
from app.services.crew_service import CrewService, executor, get_crew_service


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
# SPECIALIZED AGENT ENDPOINTS
# =============================================================================


def _run_cover_letter_sync(
    job_description: str, resume_text: str, company: str, role: str
) -> str:
    """Run cover letter generation synchronously (for thread pool)."""
    from crewai import Crew, Process
    from app.agents.cover_letter_agent import (
        create_cover_letter_agent,
        create_cover_letter_task,
    )

    agent = create_cover_letter_agent()
    task = create_cover_letter_task(agent, job_description, resume_text, company, role)
    crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
    result = crew.kickoff()
    return str(result)


def _run_followup_sync(
    company: str, role: str, application_date: str, previous_contact: str | None
) -> str:
    """Run follow-up email generation synchronously (for thread pool)."""
    from crewai import Crew, Process
    from app.agents.followup_agent import create_followup_agent, create_followup_task

    agent = create_followup_agent()
    task = create_followup_task(agent, company, role, application_date, previous_contact)
    crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
    result = crew.kickoff()
    return str(result)


def _run_networking_sync(
    company: str, role: str, industry: str | None
) -> str:
    """Run networking research synchronously (for thread pool)."""
    from crewai import Crew, Process
    from app.agents.networking_agent import (
        create_networking_agent,
        create_networking_task,
    )

    agent = create_networking_agent()
    task = create_networking_task(agent, company, role, industry)
    crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
    result = crew.kickoff()
    return str(result)


@router.post(
    "/agents/cover-letter",
    response_model=CoverLetterResponse,
    summary="Generate a cover letter",
    description="Use the Cover Letter Specialist agent to generate a tailored cover letter.",
    tags=["agents"],
)
async def generate_cover_letter(
    request: CoverLetterRequest,
    service: CrewService = Depends(get_crew_service),
) -> CoverLetterResponse:
    """
    Generate a tailored cover letter using the Cover Letter Specialist agent.

    The agent analyzes the job description and resume to produce a
    personalized cover letter highlighting the most relevant experience.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            _run_cover_letter_sync,
            request.job_description,
            request.resume_text,
            request.company,
            request.role,
        )
        return CoverLetterResponse(
            cover_letter=result,
            generated_at=datetime.utcnow(),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "cover_letter_generation_failed",
                "message": f"Failed to generate cover letter: {exc}",
            },
        ) from exc


@router.post(
    "/agents/followup-email",
    response_model=FollowupEmailResponse,
    summary="Generate a follow-up email",
    description="Use the Follow-up Email Specialist agent to draft a professional follow-up.",
    tags=["agents"],
)
async def generate_followup_email(
    request: FollowupEmailRequest,
    service: CrewService = Depends(get_crew_service),
) -> FollowupEmailResponse:
    """
    Generate a professional follow-up email using the Follow-up Email Specialist agent.

    The agent considers the time elapsed since application and any previous
    contact to craft an appropriately toned follow-up.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            _run_followup_sync,
            request.company,
            request.role,
            request.application_date,
            request.previous_contact,
        )
        return FollowupEmailResponse(
            email=result,
            generated_at=datetime.utcnow(),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "followup_email_generation_failed",
                "message": f"Failed to generate follow-up email: {exc}",
            },
        ) from exc


@router.post(
    "/agents/network-research",
    response_model=NetworkResearchResponse,
    summary="Research networking opportunities",
    description="Use the Networking Strategy Advisor agent to research company networking strategies.",
    tags=["agents"],
)
async def research_networking(
    request: NetworkResearchRequest,
    service: CrewService = Depends(get_crew_service),
) -> NetworkResearchResponse:
    """
    Research networking strategies using the Networking Strategy Advisor agent.

    Provides LinkedIn search queries, key roles to connect with,
    relevant events, and conversation starters.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            _run_networking_sync,
            request.company,
            request.role,
            request.industry,
        )
        return NetworkResearchResponse(
            research=result,
            generated_at=datetime.utcnow(),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "network_research_failed",
                "message": f"Failed to generate networking research: {exc}",
            },
        ) from exc


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
