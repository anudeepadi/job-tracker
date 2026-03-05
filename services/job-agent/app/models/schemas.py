"""
Pydantic models for request/response schemas.

This module defines all the data models used for API request validation
and response serialization in the FastAPI job search service.

Author: Backend API Designer
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# =============================================================================
# ENUMS
# =============================================================================

class JobSearchStatus(str, Enum):
    """Status of a job search task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentType(str, Enum):
    """Types of available agents."""
    JOB_SEARCHER = "job_searcher"
    SKILLS_ADVISOR = "skills_advisor"
    INTERVIEW_COACH = "interview_coach"
    CAREER_ADVISOR = "career_advisor"


# =============================================================================
# REQUEST MODELS
# =============================================================================

class JobSearchRequest(BaseModel):
    """Request model for initiating a job search."""
    role: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Job role/title to search for",
        examples=["Data Scientist", "Software Engineer", "Product Manager"]
    )
    location: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Location for job search",
        examples=["Austin", "San Francisco", "Remote", "New York"]
    )
    num_results: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Number of job listings to retrieve (1-50)"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "role": "Data Scientist",
                    "location": "Austin",
                    "num_results": 5
                }
            ]
        }
    }


class SkillsAnalysisRequest(BaseModel):
    """Request model for running skills analysis on job listings."""
    job_id: str = Field(
        ...,
        description="Job search ID to analyze"
    )
    include_learning_resources: bool = Field(
        default=True,
        description="Include specific learning resource recommendations"
    )
    include_timeline: bool = Field(
        default=True,
        description="Include learning timeline estimates"
    )


class CoverLetterRequest(BaseModel):
    """Request model for generating a cover letter."""
    job_description: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Full job description text",
    )
    resume_text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Candidate's resume content",
    )
    company: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Target company name",
    )
    role: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Target job title/role",
    )


class CoverLetterResponse(BaseModel):
    """Response model for a generated cover letter."""
    cover_letter: str = Field(..., description="Generated cover letter text")
    generated_at: datetime = Field(..., description="Timestamp of generation")


class FollowupEmailRequest(BaseModel):
    """Request model for generating a follow-up email."""
    company: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Company the candidate applied to",
    )
    role: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Job title the candidate applied for",
    )
    application_date: str = Field(
        ...,
        min_length=1,
        description="Date the application was submitted (ISO string)",
    )
    previous_contact: Optional[str] = Field(
        None,
        max_length=5000,
        description="Notes about prior communication",
    )


class FollowupEmailResponse(BaseModel):
    """Response model for a generated follow-up email."""
    email: str = Field(..., description="Generated follow-up email text")
    generated_at: datetime = Field(..., description="Timestamp of generation")


class NetworkResearchRequest(BaseModel):
    """Request model for networking research."""
    company: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Target company to research",
    )
    role: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Target job title/role",
    )
    industry: Optional[str] = Field(
        None,
        max_length=200,
        description="Industry context for research",
    )


class NetworkResearchResponse(BaseModel):
    """Response model for networking research."""
    research: str = Field(..., description="Structured networking strategy")
    generated_at: datetime = Field(..., description="Timestamp of generation")


# =============================================================================
# RESPONSE MODELS - Job Listings
# =============================================================================

class JobListing(BaseModel):
    """Model representing a single job listing."""
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    salary_range: Optional[str] = Field(None, description="Salary range if available")
    description: str = Field(..., description="Job description excerpt")
    posted_date: Optional[str] = Field(None, description="Date the job was posted")
    apply_url: Optional[str] = Field(None, description="URL to apply for the job")
    required_skills: List[str] = Field(default_factory=list, description="List of required skills")


class MarketInsights(BaseModel):
    """Market insights derived from job listings."""
    total_jobs_found: int = Field(..., description="Total number of matching jobs in the market")
    common_skills: List[str] = Field(default_factory=list, description="Most commonly required skills")
    experience_levels: List[str] = Field(default_factory=list, description="Experience levels mentioned")
    salary_trends: Optional[str] = Field(None, description="Salary trend observations")
    notable_companies: List[str] = Field(default_factory=list, description="Notable companies hiring")


# =============================================================================
# RESPONSE MODELS - Search Results
# =============================================================================

class JobSearchResponse(BaseModel):
    """Response model for job search initiation."""
    job_id: str = Field(..., description="Unique identifier for this search job")
    status: JobSearchStatus = Field(..., description="Current status of the search")
    message: str = Field(..., description="Status message")
    created_at: datetime = Field(..., description="When the search was created")


class JobSearchStatusResponse(BaseModel):
    """Response model for job search status check."""
    job_id: str = Field(..., description="Unique identifier for this search job")
    status: JobSearchStatus = Field(..., description="Current status of the search")
    progress: Optional[str] = Field(None, description="Current progress description")
    started_at: Optional[datetime] = Field(None, description="When the search started")
    completed_at: Optional[datetime] = Field(None, description="When the search completed")
    error: Optional[str] = Field(None, description="Error message if failed")


class JobSearchResultsResponse(BaseModel):
    """Response model for completed job search results."""
    job_id: str = Field(..., description="Unique identifier for this search job")
    status: JobSearchStatus = Field(..., description="Status of the search")
    search_params: Dict[str, Any] = Field(..., description="Original search parameters")
    job_listings: List[JobListing] = Field(default_factory=list, description="List of job listings found")
    market_insights: Optional[MarketInsights] = Field(None, description="Market insights from the search")
    skills_analysis: Optional[str] = Field(None, description="Skills analysis from the agent")
    interview_prep: Optional[str] = Field(None, description="Interview preparation content")
    career_advice: Optional[str] = Field(None, description="Career strategy advice")
    raw_output: Optional[str] = Field(None, description="Raw output from the crew")
    completed_at: Optional[datetime] = Field(None, description="When the search completed")


# =============================================================================
# RESPONSE MODELS - Skills Analysis
# =============================================================================

class SkillPriority(str, Enum):
    """Priority level for a skill."""
    CRITICAL = "critical"
    IMPORTANT = "important"
    NICE_TO_HAVE = "nice_to_have"


class SkillRecommendation(BaseModel):
    """Model for a single skill recommendation."""
    skill_name: str = Field(..., description="Name of the skill")
    category: str = Field(..., description="Category (technical, tools, soft skills, domain)")
    frequency: int = Field(..., description="Number of jobs mentioning this skill")
    priority: SkillPriority = Field(..., description="Priority level")
    learning_resources: List[str] = Field(default_factory=list, description="Recommended learning resources")
    estimated_time: Optional[str] = Field(None, description="Estimated time to learn")
    projects: List[str] = Field(default_factory=list, description="Suggested portfolio projects")


class SkillsAnalysisResponse(BaseModel):
    """Response model for skills analysis."""
    job_id: str = Field(..., description="Original job search ID")
    status: JobSearchStatus = Field(..., description="Status of the analysis")
    total_skills_identified: int = Field(default=0, description="Total unique skills found")
    skills_by_category: Dict[str, List[str]] = Field(default_factory=dict, description="Skills grouped by category")
    priority_skills: List[SkillRecommendation] = Field(default_factory=list, description="Prioritized skill recommendations")
    quick_start_plan: Optional[str] = Field(None, description="30-day quick start plan")
    long_term_plan: Optional[str] = Field(None, description="3-6 month development plan")
    raw_output: Optional[str] = Field(None, description="Raw output from the skills advisor agent")


# =============================================================================
# RESPONSE MODELS - Agents
# =============================================================================

class AgentCapability(BaseModel):
    """Model representing a single agent capability."""
    name: str = Field(..., description="Capability name")
    description: str = Field(..., description="Capability description")


class AgentInfo(BaseModel):
    """Model representing an agent's information."""
    id: str = Field(..., description="Agent identifier")
    name: str = Field(..., description="Agent display name")
    role: str = Field(..., description="Agent's role in the system")
    goal: str = Field(..., description="Agent's goal")
    capabilities: List[AgentCapability] = Field(default_factory=list, description="List of agent capabilities")
    has_tools: bool = Field(default=False, description="Whether the agent has access to tools")
    tools: List[str] = Field(default_factory=list, description="List of tools the agent can use")


class AgentsListResponse(BaseModel):
    """Response model for listing all agents."""
    agents: List[AgentInfo] = Field(..., description="List of all available agents")
    total_count: int = Field(..., description="Total number of agents")


# =============================================================================
# RESPONSE MODELS - Health Check
# =============================================================================

class DependencyStatus(BaseModel):
    """Status of a single dependency."""
    name: str = Field(..., description="Dependency name")
    status: str = Field(..., description="Status: healthy, degraded, or unhealthy")
    message: Optional[str] = Field(None, description="Additional status message")


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str = Field(..., description="Overall service status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(..., description="Current server time")
    dependencies: List[DependencyStatus] = Field(default_factory=list, description="Status of dependencies")


# =============================================================================
# ERROR RESPONSE MODELS
# =============================================================================

class ErrorDetail(BaseModel):
    """Model for error details."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    field: Optional[str] = Field(None, description="Field that caused the error, if applicable")


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: ErrorDetail = Field(..., description="Error details")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Enums
    "JobSearchStatus",
    "AgentType",
    "SkillPriority",
    # Request Models
    "JobSearchRequest",
    "SkillsAnalysisRequest",
    "CoverLetterRequest",
    "CoverLetterResponse",
    "FollowupEmailRequest",
    "FollowupEmailResponse",
    "NetworkResearchRequest",
    "NetworkResearchResponse",
    # Job Listing Models
    "JobListing",
    "MarketInsights",
    # Search Response Models
    "JobSearchResponse",
    "JobSearchStatusResponse",
    "JobSearchResultsResponse",
    # Skills Analysis Models
    "SkillRecommendation",
    "SkillsAnalysisResponse",
    # Agent Models
    "AgentCapability",
    "AgentInfo",
    "AgentsListResponse",
    # Health Check Models
    "DependencyStatus",
    "HealthCheckResponse",
    # Error Models
    "ErrorDetail",
    "ErrorResponse",
]
