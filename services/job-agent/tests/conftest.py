"""
Shared fixtures and configuration for Job Agent API tests.

This module provides reusable fixtures for mocking external API calls,
creating test data, and setting up test environments.

Author: Test Automation Engineer
"""

import asyncio
import os
from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import requests
from crewai import Agent, Task


# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment variables."""
    os.environ["ADZUNA_APP_ID"] = "test_app_id"
    os.environ["ADZUNA_API_KEY"] = "test_api_key"
    os.environ["ANTHROPIC_API_KEY"] = "test_anthropic_key"
    os.environ["OPENAI_API_KEY"] = "sk-test_openai_key"
    os.environ["LINKEDIN_RAPIDAPI_KEY"] = "test_linkedin_key"
    os.environ["JSEARCH_RAPIDAPI_KEY"] = "test_jsearch_key"
    os.environ["REMOTEOK_ENABLED"] = "true"
    yield
    # Cleanup after all tests


# =============================================================================
# EVENT LOOP FIXTURES
# =============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# =============================================================================
# MOCK DATA FIXTURES - ADZUNA
# =============================================================================

@pytest.fixture
def mock_adzuna_response() -> Dict[str, Any]:
    """Mock successful Adzuna API response."""
    return {
        "results": [
            {
                "id": "12345",
                "title": "Senior Software Engineer",
                "company": {"display_name": "TechCorp Inc."},
                "location": {"display_name": "San Francisco, CA"},
                "description": "We are looking for a talented senior software engineer with experience in Python, JavaScript, and cloud technologies. The ideal candidate will have 5+ years of experience.",
                "salary_min": 120000,
                "salary_max": 180000,
                "redirect_url": "https://example.com/job/12345",
                "created": "2026-02-01T10:00:00Z",
            },
            {
                "id": "67890",
                "title": "Frontend Developer",
                "company": {"display_name": "StartupXYZ"},
                "location": {"display_name": "Remote"},
                "description": "Join our dynamic team as a frontend developer. We use React, TypeScript, and modern web technologies.",
                "salary_min": 90000,
                "salary_max": 130000,
                "redirect_url": "https://example.com/job/67890",
                "created": "2026-02-02T14:30:00Z",
            },
            {
                "id": "11111",
                "title": "Data Scientist",
                "company": {"display_name": "DataCo"},
                "location": {"display_name": "New York, NY"},
                "description": "Seeking an experienced data scientist with expertise in machine learning and statistical analysis.",
                "salary_min": 130000,
                "salary_max": 200000,
                "redirect_url": "https://example.com/job/11111",
                "created": "2026-02-03T09:15:00Z",
            },
        ],
        "count": 150,
    }


@pytest.fixture
def mock_adzuna_empty_response() -> Dict[str, Any]:
    """Mock Adzuna API response with no results."""
    return {"results": [], "count": 0}


@pytest.fixture
def mock_adzuna_error_response() -> Dict[str, Any]:
    """Mock Adzuna API error response."""
    return {"error": "Invalid API credentials"}


# =============================================================================
# MOCK DATA FIXTURES - LINKEDIN
# =============================================================================

@pytest.fixture
def mock_linkedin_response() -> List[Dict[str, Any]]:
    """Mock successful LinkedIn API response."""
    return [
        {
            "job_title": "Backend Engineer",
            "company_name": "BigTech Corp",
            "job_location": "Seattle, WA",
            "job_description": "We are hiring a backend engineer to work on scalable microservices and distributed systems.",
            "linkedin_job_url_cleaned": "https://linkedin.com/jobs/view/12345",
            "posted_date": "2 days ago",
            "job_employment_type": "Full-time",
        },
        {
            "job_title": "DevOps Engineer",
            "company_name": "CloudCo",
            "job_location": "Austin, TX",
            "job_description": "Looking for a DevOps engineer with Kubernetes and AWS experience.",
            "linkedin_job_url_cleaned": "https://linkedin.com/jobs/view/67890",
            "posted_date": "1 week ago",
            "job_employment_type": "Full-time",
        },
    ]


@pytest.fixture
def mock_linkedin_empty_response() -> List[Dict[str, Any]]:
    """Mock LinkedIn API empty response."""
    return []


# =============================================================================
# MOCK DATA FIXTURES - JSEARCH
# =============================================================================

@pytest.fixture
def mock_jsearch_response() -> Dict[str, Any]:
    """Mock successful JSearch API response."""
    return {
        "data": [
            {
                "job_title": "Full Stack Developer",
                "employer_name": "WebDev Inc",
                "job_city": "Los Angeles",
                "job_state": "CA",
                "job_country": "US",
                "job_description": "Full stack developer position using Node.js and React.",
                "job_apply_link": "https://jsearch.com/job/11111",
                "job_posted_at_datetime_utc": "2026-02-01",
                "job_employment_type": "Full-time",
                "job_is_remote": False,
            },
            {
                "job_title": "Python Developer",
                "employer_name": "PyTech",
                "job_city": "",
                "job_state": "",
                "job_country": "US",
                "job_description": "Remote Python developer role for ML projects.",
                "job_apply_link": "https://jsearch.com/job/22222",
                "job_posted_at_datetime_utc": "2026-02-02",
                "job_employment_type": "Full-time",
                "job_is_remote": True,
            },
        ]
    }


# =============================================================================
# MOCK DATA FIXTURES - REMOTEOK
# =============================================================================

@pytest.fixture
def mock_remoteok_response() -> List[Dict[str, Any]]:
    """Mock successful RemoteOK API response."""
    return [
        {"legal": "RemoteOK API"},  # API metadata (first element)
        {
            "position": "Remote Software Engineer",
            "company": "RemoteCo",
            "location": "Remote",
            "description": "Remote software engineering position with flexible hours.",
            "url": "/remote-jobs/123456",
            "date": "2026-02-01",
            "tags": ["python", "javascript", "remote"],
        },
        {
            "position": "Remote Frontend Developer",
            "company": "DistributedTech",
            "location": "Worldwide",
            "description": "Frontend developer for distributed team.",
            "url": "/remote-jobs/789012",
            "date": "2026-02-02",
            "tags": ["react", "typescript", "remote"],
        },
    ]


# =============================================================================
# MOCK CREW OUTPUT FIXTURES
# =============================================================================

@pytest.fixture
def mock_crew_output() -> str:
    """Mock CrewAI crew output."""
    return """
Job Search Results:
==================

<job>
    <title>Senior Software Engineer</title>
    <company>TechCorp Inc.</company>
    <location>San Francisco, CA</location>
    <salary>$120,000 - $180,000</salary>
    <posted_date>2026-02-01T10:00:00Z</posted_date>
    <description>
        We are looking for a talented senior software engineer...
    </description>
    <apply_url>https://example.com/job/12345</apply_url>
</job>

<job>
    <title>Frontend Developer</title>
    <company>StartupXYZ</company>
    <location>Remote</location>
    <salary>$90,000 - $130,000</salary>
    <posted_date>2026-02-02T14:30:00Z</posted_date>
    <description>
        Join our dynamic team as a frontend developer...
    </description>
    <apply_url>https://example.com/job/67890</apply_url>
</job>

Skills Analysis:
===============
Key skills for these positions include Python, JavaScript, React, and cloud technologies.

Interview Preparation:
=====================
Prepare for technical questions on system design and algorithms.

Career Advice:
=============
Focus on building a strong portfolio and networking with professionals.
"""


@pytest.fixture
def mock_crew_output_object(mock_crew_output):
    """Mock CrewAI CrewOutput object."""
    mock_output = MagicMock()
    mock_output.raw = mock_crew_output
    mock_output.__str__ = MagicMock(return_value=mock_crew_output)
    mock_output.tasks_output = [
        MagicMock(description="Job search task", raw="Found 3 jobs"),
        MagicMock(description="Skills analysis task", raw="Key skills: Python, JavaScript"),
        MagicMock(description="Interview preparation task", raw="Prepare for system design"),
        MagicMock(description="Career advisory task", raw="Focus on networking"),
    ]
    return mock_output


# =============================================================================
# MOCK REQUEST FIXTURES - GET
# =============================================================================

@pytest.fixture
def mock_requests_get(mock_adzuna_response):
    """Mock requests.get for API calls."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_adzuna_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def mock_requests_get_empty(mock_adzuna_empty_response):
    """Mock requests.get returning empty results."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_adzuna_empty_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def mock_requests_get_error():
    """Mock requests.get returning an error."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "401 Unauthorized"
        )
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def mock_requests_get_server_error():
    """Mock requests.get returning a server error (500)."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "500 Internal Server Error"
        )
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def mock_requests_get_rate_limit():
    """Mock requests.get returning rate limit error (429)."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "429 Too Many Requests"
        )
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def mock_requests_get_timeout():
    """Mock requests.get timing out."""
    with patch("requests.get") as mock_get:
        mock_get.side_effect = requests.exceptions.Timeout("Request timed out")
        yield mock_get


@pytest.fixture
def mock_requests_get_connection_error():
    """Mock requests.get with connection error."""
    with patch("requests.get") as mock_get:
        mock_get.side_effect = requests.exceptions.ConnectionError("Connection failed")
        yield mock_get


@pytest.fixture
def mock_requests_get_invalid_json():
    """Mock requests.get returning invalid JSON."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        yield mock_get


# =============================================================================
# MOCK REQUEST FIXTURES - POST
# =============================================================================

@pytest.fixture
def mock_requests_post(mock_linkedin_response):
    """Mock requests.post for LinkedIn API calls."""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_linkedin_response
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        yield mock_post


@pytest.fixture
def mock_requests_post_error():
    """Mock requests.post returning an error."""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "401 Unauthorized"
        )
        mock_post.return_value = mock_response
        yield mock_post


@pytest.fixture
def mock_requests_post_rate_limit():
    """Mock requests.post returning rate limit error."""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "429 Too Many Requests"
        )
        mock_post.return_value = mock_response
        yield mock_post


@pytest.fixture
def mock_requests_post_timeout():
    """Mock requests.post timing out."""
    with patch("requests.post") as mock_post:
        mock_post.side_effect = requests.exceptions.Timeout("Request timed out")
        yield mock_post


# =============================================================================
# CREWAI MOCK FIXTURES
# =============================================================================

@pytest.fixture
def mock_crew():
    """Mock CrewAI Crew."""
    with patch("crewai.Crew") as mock_crew_class:
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff.return_value = "Mock crew output"
        mock_crew_class.return_value = mock_crew_instance
        yield mock_crew_instance


@pytest.fixture
def mock_crew_with_output(mock_crew_output_object):
    """Mock CrewAI Crew with structured output."""
    with patch("crewai.Crew") as mock_crew_class:
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff.return_value = mock_crew_output_object
        mock_crew_class.return_value = mock_crew_instance
        yield mock_crew_instance


@pytest.fixture
def mock_crew_execution_error():
    """Mock CrewAI Crew that raises an error."""
    with patch("crewai.Crew") as mock_crew_class:
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff.side_effect = Exception("Crew execution failed")
        mock_crew_class.return_value = mock_crew_instance
        yield mock_crew_instance


@pytest.fixture
def mock_agents():
    """Mock CrewAI agents."""
    return {
        "job_searcher": MagicMock(spec=Agent),
        "skills_advisor": MagicMock(spec=Agent),
        "interview_coach": MagicMock(spec=Agent),
        "career_advisor": MagicMock(spec=Agent),
    }


@pytest.fixture
def mock_tasks():
    """Mock CrewAI tasks."""
    return [
        MagicMock(spec=Task),
        MagicMock(spec=Task),
        MagicMock(spec=Task),
        MagicMock(spec=Task),
    ]


# =============================================================================
# SERVICE FIXTURES
# =============================================================================

@pytest.fixture
def crew_service():
    """Create a fresh CrewService instance for testing."""
    from app.services.crew_service import CrewService

    return CrewService()


@pytest.fixture
async def clean_job_store():
    """Clean the job store before and after tests."""
    from app.services.crew_service import job_store

    # Clear before test
    job_store._jobs = {}
    yield job_store
    # Clear after test
    job_store._jobs = {}


@pytest.fixture
def job_store_instance():
    """Get a fresh JobStore instance for testing."""
    from app.services.crew_service import JobStore

    return JobStore()


# =============================================================================
# SEARCH PARAMETER FIXTURES
# =============================================================================

@pytest.fixture
def valid_search_params() -> Dict[str, Any]:
    """Valid job search parameters."""
    return {"role": "Software Engineer", "location": "San Francisco", "num_results": 5}


@pytest.fixture
def valid_search_params_remote() -> Dict[str, Any]:
    """Valid job search parameters for remote jobs."""
    return {"role": "Frontend Developer", "location": "Remote", "num_results": 3}


@pytest.fixture
def invalid_search_params_missing_role() -> Dict[str, Any]:
    """Invalid search parameters - missing role."""
    return {"location": "San Francisco", "num_results": 5}


@pytest.fixture
def invalid_search_params_empty_role() -> Dict[str, Any]:
    """Invalid search parameters - empty role."""
    return {"role": "", "location": "San Francisco", "num_results": 5}


@pytest.fixture
def invalid_search_params_missing_location() -> Dict[str, Any]:
    """Invalid search parameters - missing location."""
    return {"role": "Software Engineer", "num_results": 5}


@pytest.fixture
def invalid_search_params_empty_location() -> Dict[str, Any]:
    """Invalid search parameters - empty location."""
    return {"role": "Software Engineer", "location": "", "num_results": 5}


@pytest.fixture
def invalid_search_params_bad_num_results() -> Dict[str, Any]:
    """Invalid search parameters - num_results out of range."""
    return {"role": "Software Engineer", "location": "San Francisco", "num_results": 100}


@pytest.fixture
def invalid_search_params_zero_results() -> Dict[str, Any]:
    """Invalid search parameters - num_results is zero."""
    return {"role": "Software Engineer", "location": "San Francisco", "num_results": 0}


@pytest.fixture
def invalid_search_params_negative_results() -> Dict[str, Any]:
    """Invalid search parameters - num_results is negative."""
    return {"role": "Software Engineer", "location": "San Francisco", "num_results": -5}


@pytest.fixture
def invalid_search_params_string_num_results() -> Dict[str, Any]:
    """Invalid search parameters - num_results is a string."""
    return {"role": "Software Engineer", "location": "San Francisco", "num_results": "five"}


@pytest.fixture
def remote_search_params() -> Dict[str, Any]:
    """Search parameters for remote jobs."""
    return {"role": "Frontend Developer", "location": "Remote", "num_results": 3}


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def create_mock_application(
    app_id: str = "app-1",
    company: str = "TechCorp",
    job_title: str = "Software Engineer",
    status: str = "Applied",
) -> Dict[str, Any]:
    """Create a mock application for testing."""
    return {
        "id": app_id,
        "company": company,
        "jobTitle": job_title,
        "status": status,
        "priority": "High",
        "location": "San Francisco",
        "appliedDate": "2026-01-15T00:00:00Z",
        "activities": [],
        "reminders": [],
    }


def create_mock_job_listing(
    title: str = "Software Engineer",
    company: str = "TechCorp",
    location: str = "San Francisco",
    salary_min: int = 100000,
    salary_max: int = 150000,
) -> Dict[str, Any]:
    """Create a mock job listing for testing."""
    return {
        "id": "12345",
        "title": title,
        "company": {"display_name": company},
        "location": {"display_name": location},
        "description": f"Exciting {title} position at {company}.",
        "salary_min": salary_min,
        "salary_max": salary_max,
        "redirect_url": f"https://example.com/job/12345",
        "created": "2026-02-01T10:00:00Z",
    }


@pytest.fixture
def mock_application():
    """Fixture for a single mock application."""
    return create_mock_application()


@pytest.fixture
def mock_applications():
    """Fixture for multiple mock applications."""
    return [
        create_mock_application("app-1", "TechCorp", "Software Engineer", "Applied"),
        create_mock_application("app-2", "StartupXYZ", "Frontend Developer", "Interview"),
        create_mock_application("app-3", "BigCorp", "Backend Developer", "Offered"),
    ]


@pytest.fixture
def mock_job_listing():
    """Fixture for a single mock job listing."""
    return create_mock_job_listing()


@pytest.fixture
def mock_job_listings():
    """Fixture for multiple mock job listings."""
    return [
        create_mock_job_listing("Software Engineer", "TechCorp", "San Francisco"),
        create_mock_job_listing("Frontend Developer", "StartupXYZ", "Remote", 80000, 120000),
        create_mock_job_listing("Data Scientist", "DataCo", "New York", 120000, 180000),
    ]


# =============================================================================
# MISSING CREDENTIALS FIXTURES
# =============================================================================

@pytest.fixture
def mock_missing_adzuna_credentials():
    """Mock environment with missing Adzuna credentials."""
    with patch("src.config.ADZUNA_APP_ID", None), \
         patch("src.config.ADZUNA_API_KEY", None):
        yield


@pytest.fixture
def mock_missing_linkedin_credentials():
    """Mock environment with missing LinkedIn credentials."""
    with patch("src.config.LINKEDIN_RAPIDAPI_KEY", None):
        yield


@pytest.fixture
def mock_missing_jsearch_credentials():
    """Mock environment with missing JSearch credentials."""
    with patch("src.config.JSEARCH_RAPIDAPI_KEY", None):
        yield


@pytest.fixture
def mock_remoteok_disabled():
    """Mock environment with RemoteOK disabled."""
    with patch("src.config.REMOTEOK_ENABLED", False):
        yield


@pytest.fixture
def mock_all_credentials_missing():
    """Mock environment with all API credentials missing."""
    with patch("src.config.ADZUNA_APP_ID", None), \
         patch("src.config.ADZUNA_API_KEY", None), \
         patch("src.config.LINKEDIN_RAPIDAPI_KEY", None), \
         patch("src.config.JSEARCH_RAPIDAPI_KEY", None), \
         patch("src.config.REMOTEOK_ENABLED", False):
        yield
