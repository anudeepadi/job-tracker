"""
Search endpoints router for the Job Agent API.

This module defines all endpoints related to job searching, including
triggering searches, checking status, and retrieving results.

Author: Backend API Designer
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status, Depends

from app.models.schemas import (
    JobSearchRequest,
    JobSearchResponse,
    JobSearchStatus,
    JobSearchStatusResponse,
    JobSearchResultsResponse,
    SkillsAnalysisRequest,
    SkillsAnalysisResponse,
    ErrorResponse,
    ErrorDetail,
)
from app.services.crew_service import CrewService, get_crew_service


# =============================================================================
# ROUTER CONFIGURATION
# =============================================================================

router = APIRouter(
    prefix="/api",
    tags=["search"],
    responses={
        404: {"model": ErrorResponse, "description": "Job search not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)


# =============================================================================
# SEARCH ENDPOINTS
# =============================================================================

@router.post(
    "/search",
    response_model=JobSearchResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger a job search",
    description="""
Initiate an asynchronous job search using the CrewAI multi-agent system.

The search will be processed in the background by four specialized AI agents:
1. **Job Search Specialist** - Searches for job listings using the Adzuna API
2. **Skills Development Advisor** - Analyzes required skills and creates learning roadmaps
3. **Interview Preparation Coach** - Generates interview questions and preparation materials
4. **Career Strategy Advisor** - Provides resume, LinkedIn, and application advice

Use the returned `job_id` to check status and retrieve results.
""",
    responses={
        202: {
            "description": "Job search initiated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "job_id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "pending",
                        "message": "Job search initiated. Use GET /api/search/{job_id}/status to check progress.",
                        "created_at": "2025-01-15T10:30:00Z"
                    }
                }
            }
        },
        400: {"description": "Invalid request parameters"},
        503: {"description": "Service configuration error"},
    },
)
async def trigger_job_search(
    request: JobSearchRequest,
    service: CrewService = Depends(get_crew_service),
) -> JobSearchResponse:
    """
    Trigger a new job search with the specified parameters.

    This endpoint initiates an asynchronous job search. The actual search
    is performed in the background by the CrewAI multi-agent system.

    Args:
        request: Job search parameters (role, location, num_results)
        service: CrewAI service dependency

    Returns:
        JobSearchResponse with job_id for tracking

    Raises:
        HTTPException: If service is not properly configured
    """
    # Validate service configuration
    is_valid, errors = service.validate_configuration()
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "configuration_error",
                "message": "Service is not properly configured",
                "errors": errors,
            }
        )

    # Start the job search
    job_id = await service.start_job_search(
        role=request.role,
        location=request.location,
        num_results=request.num_results,
    )

    return JobSearchResponse(
        job_id=job_id,
        status=JobSearchStatus.PENDING,
        message="Job search initiated. Use GET /api/search/{job_id}/status to check progress.",
        created_at=datetime.utcnow(),
    )


@router.get(
    "/search/{job_id}/status",
    response_model=JobSearchStatusResponse,
    summary="Check job search status",
    description="""
Check the current status of a job search.

Possible status values:
- `pending` - Search is queued but not yet started
- `running` - Search is in progress
- `completed` - Search finished successfully
- `failed` - Search encountered an error
""",
    responses={
        200: {
            "description": "Job status retrieved successfully",
            "content": {
                "application/json": {
                    "examples": {
                        "pending": {
                            "summary": "Pending status",
                            "value": {
                                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                                "status": "pending",
                                "progress": "Waiting to start",
                                "started_at": None,
                                "completed_at": None,
                                "error": None
                            }
                        },
                        "running": {
                            "summary": "Running status",
                            "value": {
                                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                                "status": "running",
                                "progress": "Processing with Interview Preparation Coach...",
                                "started_at": "2025-01-15T10:30:05Z",
                                "completed_at": None,
                                "error": None
                            }
                        },
                        "completed": {
                            "summary": "Completed status",
                            "value": {
                                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                                "status": "completed",
                                "progress": "Completed successfully",
                                "started_at": "2025-01-15T10:30:05Z",
                                "completed_at": "2025-01-15T10:35:00Z",
                                "error": None
                            }
                        },
                    }
                }
            }
        },
        404: {"description": "Job search not found"},
    },
)
async def get_job_status(
    job_id: str,
    service: CrewService = Depends(get_crew_service),
) -> JobSearchStatusResponse:
    """
    Get the current status of a job search.

    Args:
        job_id: Unique job identifier
        service: CrewAI service dependency

    Returns:
        JobSearchStatusResponse with current status

    Raises:
        HTTPException: If job_id is not found
    """
    job_status = await service.get_job_status(job_id)

    if not job_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "job_not_found",
                "message": f"Job search with ID '{job_id}' not found",
            }
        )

    return JobSearchStatusResponse(
        job_id=job_status["job_id"],
        status=job_status["status"],
        progress=job_status.get("progress"),
        started_at=job_status.get("started_at"),
        completed_at=job_status.get("completed_at"),
        error=job_status.get("error"),
    )


@router.get(
    "/search/{job_id}/results",
    response_model=JobSearchResultsResponse,
    summary="Get job search results",
    description="""
Retrieve the results of a completed job search.

The results include:
- **job_listings** - List of job listings found
- **market_insights** - Market trends and patterns
- **skills_analysis** - Skills roadmap from the Skills Advisor
- **interview_prep** - Interview preparation from the Interview Coach
- **career_advice** - Career strategy from the Career Advisor
- **raw_output** - Full raw output from all agents

Note: Results are only available when status is `completed`.
""",
    responses={
        200: {"description": "Job results retrieved successfully"},
        404: {"description": "Job search not found"},
        400: {"description": "Job search not yet completed"},
    },
)
async def get_job_results(
    job_id: str,
    include_raw: bool = Query(
        default=True,
        description="Include raw agent output in response"
    ),
    service: CrewService = Depends(get_crew_service),
) -> JobSearchResultsResponse:
    """
    Get the results of a completed job search.

    Args:
        job_id: Unique job identifier
        include_raw: Whether to include raw output
        service: CrewAI service dependency

    Returns:
        JobSearchResultsResponse with full results

    Raises:
        HTTPException: If job_id is not found or search not completed
    """
    results = await service.get_job_results(job_id)

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "job_not_found",
                "message": f"Job search with ID '{job_id}' not found",
            }
        )

    # Check if job is completed
    if results["status"] not in [JobSearchStatus.COMPLETED, JobSearchStatus.FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "job_not_completed",
                "message": f"Job search is still in progress. Current status: {results['status']}",
            }
        )

    # Optionally exclude raw output
    raw_output = results.get("raw_output") if include_raw else None

    return JobSearchResultsResponse(
        job_id=results["job_id"],
        status=results["status"],
        search_params=results["search_params"],
        job_listings=results.get("job_listings", []),
        market_insights=results.get("market_insights"),
        skills_analysis=results.get("skills_analysis"),
        interview_prep=results.get("interview_prep"),
        career_advice=results.get("career_advice"),
        raw_output=raw_output,
        completed_at=results.get("completed_at"),
    )


# =============================================================================
# ANALYSIS ENDPOINTS
# =============================================================================

@router.post(
    "/analyze",
    response_model=SkillsAnalysisResponse,
    summary="Run skills analysis on job listings",
    description="""
Run a standalone skills analysis on a completed job search.

This endpoint allows you to re-run or customize the skills analysis
for a previous job search without running the full crew again.

**Note:** This is a simplified version that returns the skills analysis
from the original search. Full custom analysis would require additional
agent execution.
""",
    responses={
        200: {"description": "Skills analysis completed"},
        404: {"description": "Job search not found"},
        400: {"description": "Job search not completed"},
    },
)
async def run_skills_analysis(
    request: SkillsAnalysisRequest,
    service: CrewService = Depends(get_crew_service),
) -> SkillsAnalysisResponse:
    """
    Run skills analysis on a completed job search.

    Args:
        request: Skills analysis request parameters
        service: CrewAI service dependency

    Returns:
        SkillsAnalysisResponse with skills recommendations

    Raises:
        HTTPException: If job_id is not found or search not completed
    """
    results = await service.get_job_results(request.job_id)

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "job_not_found",
                "message": f"Job search with ID '{request.job_id}' not found",
            }
        )

    if results["status"] != JobSearchStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "job_not_completed",
                "message": f"Job search must be completed for analysis. Current status: {results['status']}",
            }
        )

    # Parse skills analysis from agent output
    from app.services.skills_parser import parse_skills_analysis
    
    skills_analysis_text = results.get("skills_analysis", "")
    parsed_skills = parse_skills_analysis(skills_analysis_text) if skills_analysis_text else {}
    
    return SkillsAnalysisResponse(
        job_id=request.job_id,
        status=JobSearchStatus.COMPLETED,
        total_skills_identified=parsed_skills.get("total_skills_identified", 0),
        skills_by_category=parsed_skills.get("skills_by_category", {}),
        priority_skills=parsed_skills.get("priority_skills", []),
        quick_start_plan=parsed_skills.get("quick_start_plan"),
        long_term_plan=parsed_skills.get("long_term_plan"),
        raw_output=skills_analysis_text,
    )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["router"]
