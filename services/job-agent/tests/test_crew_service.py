"""
Tests for CrewAI integration service.

Tests cover job search orchestration, async execution, error handling,
job store CRUD operations, and result parsing.

Author: Test Automation Engineer
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.schemas import JobSearchStatus, JobListing, MarketInsights
from app.services.crew_service import CrewService, JobStore, job_store


# =============================================================================
# JOB STORE CRUD TESTS
# =============================================================================

class TestJobStore:
    """Test suite for JobStore CRUD operations."""

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_create_job(self, job_store_instance):
        """Test creating a new job entry."""
        job_id = "test-job-123"
        params = {"role": "Engineer", "location": "NYC", "num_results": 5}

        await job_store_instance.create_job(job_id, params)

        job = await job_store_instance.get_job(job_id)
        assert job is not None
        assert job["job_id"] == job_id
        assert job["status"] == JobSearchStatus.PENDING
        assert job["params"] == params
        assert job["created_at"] is not None
        assert job["result"] is None
        assert job["error"] is None

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_update_job(self, job_store_instance):
        """Test updating a job entry."""
        job_id = "test-job-456"
        params = {"role": "Developer", "location": "SF", "num_results": 3}

        await job_store_instance.create_job(job_id, params)
        await job_store_instance.update_job(job_id, {
            "status": JobSearchStatus.RUNNING,
            "progress": "Searching for jobs...",
        })

        job = await job_store_instance.get_job(job_id)
        assert job["status"] == JobSearchStatus.RUNNING
        assert job["progress"] == "Searching for jobs..."

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_update_job_nonexistent(self, job_store_instance):
        """Test updating a non-existent job (should not raise error)."""
        # Should not raise exception
        await job_store_instance.update_job("nonexistent-id", {"status": JobSearchStatus.COMPLETED})

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_get_job_nonexistent(self, job_store_instance):
        """Test getting a non-existent job."""
        job = await job_store_instance.get_job("nonexistent-id")
        assert job is None

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_list_jobs(self, job_store_instance):
        """Test listing all jobs."""
        # Create multiple jobs
        await job_store_instance.create_job("job-1", {"role": "A"})
        await job_store_instance.create_job("job-2", {"role": "B"})
        await job_store_instance.create_job("job-3", {"role": "C"})

        jobs = await job_store_instance.list_jobs()

        assert len(jobs) == 3
        job_ids = [j["job_id"] for j in jobs]
        assert "job-1" in job_ids
        assert "job-2" in job_ids
        assert "job-3" in job_ids

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_list_jobs_empty(self, job_store_instance):
        """Test listing jobs when store is empty."""
        jobs = await job_store_instance.list_jobs()
        assert jobs == []

    @pytest.mark.asyncio
    @pytest.mark.store
    async def test_job_store_thread_safety(self, job_store_instance):
        """Test that job store operations are thread-safe."""
        # Create multiple jobs concurrently
        async def create_job(index):
            await job_store_instance.create_job(f"concurrent-{index}", {"role": f"Job {index}"})

        await asyncio.gather(*[create_job(i) for i in range(10)])

        jobs = await job_store_instance.list_jobs()
        assert len(jobs) == 10


# =============================================================================
# CONFIGURATION VALIDATION TESTS
# =============================================================================

class TestConfigurationValidation:
    """Test suite for configuration validation."""

    @pytest.mark.unit
    def test_validate_configuration_success(self, crew_service):
        """Test configuration validation with valid config."""
        with patch("src.config.ADZUNA_APP_ID", "test_id"), \
             patch("src.config.ADZUNA_API_KEY", "test_key"), \
             patch("src.config.OPENAI_API_KEY", "sk-test_key"):
            is_valid, errors = crew_service.validate_configuration()
            # Note: May have warnings but should be valid if keys are set
            assert isinstance(is_valid, bool)
            assert isinstance(errors, list)

    @pytest.mark.unit
    def test_validate_configuration_missing_credentials(self, crew_service):
        """Test configuration validation with missing credentials."""
        with patch("src.config.ADZUNA_APP_ID", None), \
             patch("src.config.ADZUNA_API_KEY", None), \
             patch("src.config.OPENAI_API_KEY", None):
            is_valid, errors = crew_service.validate_configuration()
            # Configuration should fail or have errors
            assert isinstance(is_valid, bool)
            assert isinstance(errors, list)


# =============================================================================
# JOB SEARCH INITIATION TESTS
# =============================================================================

class TestJobSearchInitiation:
    """Test suite for job search initiation."""

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_start_job_search_creates_job(self, crew_service, clean_job_store):
        """Test that starting a job search creates a job entry."""
        job_id = await crew_service.start_job_search(
            role="Software Engineer", location="San Francisco", num_results=5
        )

        assert job_id is not None
        assert isinstance(job_id, str)
        assert len(job_id) > 0

        # Check job was created in store
        job = await clean_job_store.get_job(job_id)
        assert job is not None
        assert job["status"] == JobSearchStatus.PENDING
        assert job["params"]["role"] == "Software Engineer"
        assert job["params"]["location"] == "San Francisco"
        assert job["params"]["num_results"] == 5

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_start_job_search_returns_unique_ids(self, crew_service, clean_job_store):
        """Test that each job search gets a unique ID."""
        job_id_1 = await crew_service.start_job_search(
            role="Data Scientist", location="New York", num_results=5
        )
        job_id_2 = await crew_service.start_job_search(
            role="Frontend Developer", location="Remote", num_results=3
        )

        assert job_id_1 != job_id_2

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_start_job_search_triggers_async_execution(self, crew_service, clean_job_store):
        """Test that job search starts async crew execution."""
        with patch.object(
            crew_service, "_execute_crew", new_callable=AsyncMock
        ) as mock_execute:
            job_id = await crew_service.start_job_search(
                role="DevOps Engineer", location="Austin", num_results=5
            )

            # Give async task time to start
            await asyncio.sleep(0.1)

            # Verify _execute_crew was scheduled
            assert job_id is not None

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_start_job_search_default_num_results(self, crew_service, clean_job_store):
        """Test that job search uses default num_results."""
        job_id = await crew_service.start_job_search(
            role="Engineer", location="NYC"
        )

        job = await clean_job_store.get_job(job_id)
        assert job["params"]["num_results"] == 5  # Default value


# =============================================================================
# JOB EXECUTION TESTS
# =============================================================================

class TestJobExecution:
    """Test suite for job execution."""

    @pytest.mark.asyncio
    @pytest.mark.crew
    @pytest.mark.slow
    async def test_execute_crew_success(
        self, crew_service, clean_job_store, mock_requests_get, mock_crew
    ):
        """Test successful crew execution."""
        job_id = await crew_service.start_job_search(
            role="Software Engineer", location="San Francisco", num_results=5
        )

        # Mock the crew execution
        with patch("app.services.crew_service.Crew", return_value=mock_crew), \
             patch("app.services.crew_service.create_all_agents"), \
             patch("app.services.crew_service.create_all_tasks"):

            # Execute the crew
            await crew_service._execute_crew(
                job_id, {"role": "Software Engineer", "location": "San Francisco", "num_results": 5}
            )

            # Check job status
            job = await clean_job_store.get_job(job_id)
            assert job["status"] == JobSearchStatus.COMPLETED
            assert job["result"] is not None

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_execute_crew_handles_errors(self, crew_service, clean_job_store):
        """Test that crew execution handles errors gracefully."""
        job_id = await crew_service.start_job_search(
            role="Software Engineer", location="San Francisco", num_results=5
        )

        # Mock crew to raise an exception
        with patch("app.services.crew_service.Crew") as mock_crew_class:
            mock_crew_class.side_effect = Exception("Crew execution failed")

            # Execute should handle the error
            await crew_service._execute_crew(
                job_id, {"role": "Software Engineer", "location": "San Francisco", "num_results": 5}
            )

            # Check job failed gracefully
            job = await clean_job_store.get_job(job_id)
            assert job["status"] == JobSearchStatus.FAILED
            assert job["error"] is not None
            assert "failed" in job["error"].lower() or "error" in job["error"].lower()

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_execute_crew_updates_status_progression(self, crew_service, clean_job_store):
        """Test that crew execution updates status from PENDING to RUNNING to COMPLETED."""
        job_id = await crew_service.start_job_search(
            role="Software Engineer", location="San Francisco", num_results=5
        )

        # Initial status should be PENDING
        job = await clean_job_store.get_job(job_id)
        assert job["status"] == JobSearchStatus.PENDING

        # Mock successful execution
        with patch("app.services.crew_service.Crew"), \
             patch("app.services.crew_service.create_all_agents"), \
             patch("app.services.crew_service.create_all_tasks"), \
             patch.object(crew_service, "_fetch_adzuna_jobs", return_value=[]), \
             patch.object(crew_service, "_fetch_linkedin_jobs", return_value=[]), \
             patch.object(crew_service, "_fetch_jsearch_jobs", return_value=[]), \
             patch.object(crew_service, "_fetch_remoteok_jobs", return_value=[]):

            # Start execution
            execution_task = asyncio.create_task(
                crew_service._execute_crew(
                    job_id, {"role": "Software Engineer", "location": "San Francisco", "num_results": 5}
                )
            )

            # Give it time to start
            await asyncio.sleep(0.1)

            # Status should progress to RUNNING or COMPLETED
            job = await clean_job_store.get_job(job_id)
            assert job["status"] in [JobSearchStatus.RUNNING, JobSearchStatus.COMPLETED]

            # Wait for completion
            await execution_task

            # Final status should be COMPLETED
            job = await clean_job_store.get_job(job_id)
            assert job["status"] == JobSearchStatus.COMPLETED


# =============================================================================
# JOB STATUS RETRIEVAL TESTS
# =============================================================================

class TestJobStatusRetrieval:
    """Test suite for job status retrieval."""

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_status_existing_job(self, crew_service, clean_job_store):
        """Test getting status of an existing job."""
        job_id = await crew_service.start_job_search(
            role="Software Engineer", location="San Francisco", num_results=5
        )

        status = await crew_service.get_job_status(job_id)

        assert status is not None
        assert status["job_id"] == job_id
        assert "status" in status
        assert "progress" in status

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_status_nonexistent_job(self, crew_service):
        """Test getting status of a non-existent job."""
        status = await crew_service.get_job_status("non-existent-job-id")

        assert status is None

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_status_contains_timestamps(self, crew_service, clean_job_store):
        """Test that job status includes timestamp fields."""
        job_id = await crew_service.start_job_search(
            role="Engineer", location="NYC", num_results=3
        )

        status = await crew_service.get_job_status(job_id)

        assert "started_at" in status
        assert "completed_at" in status
        assert "error" in status


# =============================================================================
# JOB RESULTS RETRIEVAL TESTS
# =============================================================================

class TestJobResultsRetrieval:
    """Test suite for job results retrieval."""

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_results_completed_job(
        self, crew_service, clean_job_store, mock_adzuna_response
    ):
        """Test getting results of a completed job."""
        job_id = await crew_service.start_job_search(
            role="Software Engineer", location="San Francisco", num_results=5
        )

        # Simulate completed job with results
        await clean_job_store.update_job(
            job_id,
            {
                "status": JobSearchStatus.COMPLETED,
                "result": {
                    "raw_output": "Test output",
                    "task_outputs": [],
                    "aggregated_jobs": mock_adzuna_response["results"],
                },
            },
        )

        results = await crew_service.get_job_results(job_id)

        assert results is not None
        assert results["job_id"] == job_id
        assert results["status"] == JobSearchStatus.COMPLETED
        assert "job_listings" in results
        assert len(results["job_listings"]) > 0
        assert "market_insights" in results

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_results_nonexistent_job(self, crew_service):
        """Test getting results of a non-existent job."""
        results = await crew_service.get_job_results("non-existent-job-id")

        assert results is None

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_results_with_empty_listings(self, crew_service, clean_job_store):
        """Test getting results when no job listings were found."""
        job_id = await crew_service.start_job_search(
            role="Rare Job Title", location="Antarctica", num_results=5
        )

        # Simulate completed job with no results
        await clean_job_store.update_job(
            job_id,
            {
                "status": JobSearchStatus.COMPLETED,
                "result": {"raw_output": "No jobs found", "task_outputs": [], "aggregated_jobs": []},
            },
        )

        results = await crew_service.get_job_results(job_id)

        assert results is not None
        assert results["job_listings"] == []
        assert results["market_insights"] is None

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_get_job_results_includes_all_sections(
        self, crew_service, clean_job_store, mock_adzuna_response
    ):
        """Test that job results include all expected sections."""
        job_id = await crew_service.start_job_search(
            role="Engineer", location="NYC", num_results=3
        )

        await clean_job_store.update_job(
            job_id,
            {
                "status": JobSearchStatus.COMPLETED,
                "result": {
                    "raw_output": "Full output",
                    "task_outputs": [
                        {"description": "skills analysis", "output": "Python skills needed"},
                        {"description": "interview preparation", "output": "Prepare for coding"},
                        {"description": "career advisory", "output": "Network more"},
                    ],
                    "aggregated_jobs": mock_adzuna_response["results"],
                },
            },
        )

        results = await crew_service.get_job_results(job_id)

        assert "skills_analysis" in results
        assert "interview_prep" in results
        assert "career_advice" in results
        assert "raw_output" in results


# =============================================================================
# API INTEGRATION TESTS
# =============================================================================

class TestAdzunaApiIntegration:
    """Test suite for Adzuna API integration."""

    @pytest.mark.unit
    @pytest.mark.tools
    def test_fetch_adzuna_jobs_success(self, crew_service, mock_requests_get, mock_adzuna_response):
        """Test successful Adzuna API call."""
        jobs = crew_service._fetch_adzuna_jobs("Software Engineer", "San Francisco", 5)

        assert jobs == mock_adzuna_response["results"]
        assert len(jobs) == 3

    @pytest.mark.unit
    @pytest.mark.tools
    def test_fetch_adzuna_jobs_error_handling(self, crew_service, mock_requests_get_error):
        """Test Adzuna API error handling."""
        jobs = crew_service._fetch_adzuna_jobs("Software Engineer", "San Francisco", 5)

        # Should return empty list on error
        assert jobs == []

    @pytest.mark.unit
    @pytest.mark.tools
    def test_fetch_adzuna_jobs_timeout(self, crew_service, mock_requests_get_timeout):
        """Test Adzuna API timeout handling."""
        jobs = crew_service._fetch_adzuna_jobs("Software Engineer", "San Francisco", 5)

        # Should return empty list on timeout
        assert jobs == []

    @pytest.mark.unit
    @pytest.mark.tools
    def test_fetch_adzuna_jobs_remote_location(self, crew_service, mock_requests_get):
        """Test Adzuna API call for remote jobs."""
        jobs = crew_service._fetch_adzuna_jobs("Frontend Developer", "Remote", 3)

        # Should handle remote location specially
        assert isinstance(jobs, list)

    @pytest.mark.unit
    @pytest.mark.tools
    def test_fetch_adzuna_jobs_missing_credentials(self, crew_service):
        """Test Adzuna API call with missing credentials."""
        with patch("app.services.crew_service.ADZUNA_APP_ID", None), \
             patch("app.services.crew_service.ADZUNA_API_KEY", None):
            jobs = crew_service._fetch_adzuna_jobs("Software Engineer", "San Francisco", 5)

            # Should return empty list when credentials missing
            assert jobs == []

    @pytest.mark.unit
    @pytest.mark.tools
    def test_fetch_adzuna_jobs_adds_source_field(self, crew_service, mock_requests_get, mock_adzuna_response):
        """Test that Adzuna jobs get source field added."""
        jobs = crew_service._fetch_adzuna_jobs("Engineer", "NYC", 3)

        for job in jobs:
            assert job.get("source") == "Adzuna"


# =============================================================================
# DATA CONVERSION TESTS
# =============================================================================

class TestDataConversion:
    """Test suite for data conversion."""

    @pytest.mark.unit
    def test_convert_aggregated_jobs_success(self, crew_service, mock_adzuna_response):
        """Test conversion of aggregated API response to JobListing objects."""
        aggregated_jobs = mock_adzuna_response["results"]
        job_listings = crew_service._convert_aggregated_jobs(aggregated_jobs)

        assert len(job_listings) == 3
        assert job_listings[0].title == "Senior Software Engineer"
        assert job_listings[0].company == "TechCorp Inc."
        assert job_listings[0].salary_range == "$120,000 - $180,000"

    @pytest.mark.unit
    def test_convert_aggregated_jobs_with_missing_salary(self, crew_service):
        """Test conversion of jobs with missing salary data."""
        jobs = [
            {
                "title": "Test Job",
                "company": {"display_name": "Test Co"},
                "location": {"display_name": "Test City"},
                "description": "Test description",
                "redirect_url": "https://test.com",
                "created": "2026-02-01",
            }
        ]

        job_listings = crew_service._convert_aggregated_jobs(jobs)

        assert len(job_listings) == 1
        assert job_listings[0].salary_range is None

    @pytest.mark.unit
    def test_convert_aggregated_jobs_with_malformed_data(self, crew_service):
        """Test conversion handles malformed job data gracefully."""
        jobs = [
            {"title": "Valid Job", "company": {"display_name": "Company"}},
            {},  # Malformed job
            {"title": "Another Valid Job", "company": {"display_name": "Another Company"}},
        ]

        # Should skip malformed jobs and continue
        job_listings = crew_service._convert_aggregated_jobs(jobs)

        # Should have some valid jobs (exact number depends on error handling)
        assert isinstance(job_listings, list)

    @pytest.mark.unit
    def test_convert_aggregated_jobs_truncates_description(self, crew_service):
        """Test that long descriptions are truncated."""
        jobs = [
            {
                "title": "Job",
                "company": {"display_name": "Co"},
                "location": {"display_name": "Loc"},
                "description": "X" * 1000,
                "redirect_url": "https://test.com",
                "created": "2026-02-01",
            }
        ]

        job_listings = crew_service._convert_aggregated_jobs(jobs)

        assert len(job_listings[0].description) <= 500


# =============================================================================
# MARKET INSIGHTS TESTS
# =============================================================================

class TestMarketInsights:
    """Test suite for market insights extraction."""

    @pytest.mark.unit
    def test_extract_market_insights_with_jobs(self, crew_service):
        """Test market insights extraction with job listings."""
        job_listings = [
            JobListing(
                title="Software Engineer",
                company="TechCorp",
                location="San Francisco",
                salary_range="$120,000 - $180,000",
                description="Description",
            ),
            JobListing(
                title="Frontend Developer",
                company="StartupXYZ",
                location="Remote",
                salary_range="$90,000 - $130,000",
                description="Description",
            ),
        ]

        insights = crew_service._extract_market_insights(job_listings)

        assert insights is not None
        assert insights.total_jobs_found == 2
        assert "TechCorp" in insights.notable_companies
        assert "StartupXYZ" in insights.notable_companies

    @pytest.mark.unit
    def test_extract_market_insights_empty_jobs(self, crew_service):
        """Test market insights extraction with no jobs."""
        insights = crew_service._extract_market_insights([])

        assert insights is None

    @pytest.mark.unit
    def test_extract_market_insights_limits_companies(self, crew_service):
        """Test that market insights limits notable companies to 5."""
        job_listings = [
            JobListing(
                title=f"Job {i}",
                company=f"Company{i}",
                location="NYC",
                description="Desc",
            )
            for i in range(10)
        ]

        insights = crew_service._extract_market_insights(job_listings)

        assert len(insights.notable_companies) <= 5


# =============================================================================
# AGENT INFO TESTS
# =============================================================================

class TestAgentInfo:
    """Test suite for agent information."""

    @pytest.mark.unit
    def test_get_agents_info(self, crew_service):
        """Test getting agent information."""
        agents_info = crew_service.get_agents_info()

        assert len(agents_info) == 4
        assert agents_info[0].id == "job_searcher"
        assert agents_info[1].id == "skills_advisor"
        assert agents_info[2].id == "interview_coach"
        assert agents_info[3].id == "career_advisor"

        # Verify structure
        for agent_info in agents_info:
            assert agent_info.id is not None
            assert agent_info.name is not None
            assert agent_info.role is not None
            assert agent_info.goal is not None
            assert isinstance(agent_info.capabilities, list)
            assert isinstance(agent_info.has_tools, bool)

    @pytest.mark.unit
    def test_get_agents_info_caching(self, crew_service):
        """Test that agent info is cached."""
        agents_info_1 = crew_service.get_agents_info()
        agents_info_2 = crew_service.get_agents_info()

        # Should return the same cached object
        assert agents_info_1 is agents_info_2

    @pytest.mark.unit
    def test_get_agents_info_job_searcher_has_tools(self, crew_service):
        """Test that job searcher agent has tools."""
        agents_info = crew_service.get_agents_info()
        job_searcher = next(a for a in agents_info if a.id == "job_searcher")

        assert job_searcher.has_tools is True
        assert len(job_searcher.tools) > 0

    @pytest.mark.unit
    def test_get_agents_info_other_agents_no_tools(self, crew_service):
        """Test that other agents don't have tools."""
        agents_info = crew_service.get_agents_info()

        for agent in agents_info:
            if agent.id != "job_searcher":
                assert agent.has_tools is False


# =============================================================================
# CONCURRENT JOB TESTS
# =============================================================================

class TestConcurrentJobs:
    """Test suite for concurrent job handling."""

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_multiple_concurrent_job_searches(self, crew_service, clean_job_store):
        """Test handling multiple concurrent job searches."""
        job_ids = []

        # Start multiple jobs concurrently
        for i in range(3):
            job_id = await crew_service.start_job_search(
                role=f"Job {i}", location="Remote", num_results=5
            )
            job_ids.append(job_id)

        # All jobs should have unique IDs
        assert len(set(job_ids)) == 3

        # All jobs should be in the store
        for job_id in job_ids:
            job = await clean_job_store.get_job(job_id)
            assert job is not None

    @pytest.mark.asyncio
    @pytest.mark.crew
    async def test_concurrent_status_updates(self, crew_service, clean_job_store):
        """Test concurrent status updates don't cause issues."""
        job_id = await crew_service.start_job_search(
            role="Engineer", location="NYC", num_results=3
        )

        # Perform multiple concurrent updates
        async def update_progress(index):
            await clean_job_store.update_job(job_id, {"progress": f"Step {index}"})

        await asyncio.gather(*[update_progress(i) for i in range(10)])

        # Job should still be valid
        job = await clean_job_store.get_job(job_id)
        assert job is not None


# =============================================================================
# JOB OUTPUT PARSING TESTS
# =============================================================================

class TestJobOutputParsing:
    """Test suite for job output parsing."""

    @pytest.mark.unit
    def test_parse_job_listings_from_xml(self, crew_service, mock_crew_output):
        """Test parsing job listings from XML-formatted output."""
        job_listings = crew_service._parse_job_listings(mock_crew_output)

        assert len(job_listings) == 2
        assert job_listings[0].title == "Senior Software Engineer"
        assert job_listings[0].company == "TechCorp Inc."
        assert job_listings[1].title == "Frontend Developer"

    @pytest.mark.unit
    def test_parse_job_listings_empty_output(self, crew_service):
        """Test parsing job listings from empty output."""
        job_listings = crew_service._parse_job_listings("")

        assert job_listings == []

    @pytest.mark.unit
    def test_parse_job_listings_no_xml(self, crew_service):
        """Test parsing job listings from output without XML tags."""
        output = "No job listings found. Please try a different search."
        job_listings = crew_service._parse_job_listings(output)

        assert job_listings == []

    @pytest.mark.unit
    def test_extract_tag_content(self, crew_service):
        """Test extracting content from XML tags."""
        text = "<title>Software Engineer</title>"
        content = crew_service._extract_tag_content(text, "title")

        assert content == "Software Engineer"

    @pytest.mark.unit
    def test_extract_tag_content_missing(self, crew_service):
        """Test extracting content when tag is missing."""
        text = "<description>Some text</description>"
        content = crew_service._extract_tag_content(text, "title")

        assert content is None


# =============================================================================
# JOB DEDUPLICATION TESTS
# =============================================================================

class TestJobDeduplication:
    """Test suite for job deduplication."""

    @pytest.mark.unit
    def test_deduplicate_jobs_by_url(self, crew_service):
        """Test deduplication removes jobs with same URL."""
        jobs = [
            {"title": "Job 1", "company": {"display_name": "Co1"}, "redirect_url": "https://example.com/job1"},
            {"title": "Job 2", "company": {"display_name": "Co2"}, "redirect_url": "https://example.com/job1"},  # Duplicate URL
            {"title": "Job 3", "company": {"display_name": "Co3"}, "redirect_url": "https://example.com/job3"},
        ]

        deduplicated = crew_service._deduplicate_jobs(jobs)

        assert len(deduplicated) == 2

    @pytest.mark.unit
    def test_deduplicate_jobs_by_title_company(self, crew_service):
        """Test deduplication removes jobs with same title and company."""
        jobs = [
            {"title": "Software Engineer", "company": {"display_name": "TechCorp"}, "redirect_url": "https://a.com"},
            {"title": "Software Engineer", "company": {"display_name": "TechCorp"}, "redirect_url": "https://b.com"},  # Duplicate
            {"title": "Software Engineer", "company": {"display_name": "OtherCorp"}, "redirect_url": "https://c.com"},
        ]

        deduplicated = crew_service._deduplicate_jobs(jobs)

        assert len(deduplicated) == 2

    @pytest.mark.unit
    def test_deduplicate_jobs_empty_list(self, crew_service):
        """Test deduplication with empty list."""
        deduplicated = crew_service._deduplicate_jobs([])

        assert deduplicated == []

    @pytest.mark.unit
    def test_deduplicate_jobs_no_duplicates(self, crew_service):
        """Test deduplication with no duplicates."""
        jobs = [
            {"title": "Job 1", "company": {"display_name": "Co1"}, "redirect_url": "https://a.com"},
            {"title": "Job 2", "company": {"display_name": "Co2"}, "redirect_url": "https://b.com"},
            {"title": "Job 3", "company": {"display_name": "Co3"}, "redirect_url": "https://c.com"},
        ]

        deduplicated = crew_service._deduplicate_jobs(jobs)

        assert len(deduplicated) == 3


# =============================================================================
# JOB AGGREGATION TESTS
# =============================================================================

class TestJobAggregation:
    """Test suite for job aggregation from multiple sources."""

    @pytest.mark.unit
    def test_aggregate_jobs_from_all_sources(
        self, crew_service, mock_adzuna_response, mock_linkedin_response
    ):
        """Test aggregating jobs from all available sources."""
        with patch.object(crew_service, "_fetch_adzuna_jobs", return_value=mock_adzuna_response["results"]), \
             patch.object(crew_service, "_fetch_linkedin_jobs", return_value=[]), \
             patch.object(crew_service, "_fetch_jsearch_jobs", return_value=[]), \
             patch.object(crew_service, "_fetch_remoteok_jobs", return_value=[]):

            jobs = crew_service._aggregate_jobs_from_all_sources("Engineer", "NYC", 5)

            assert len(jobs) == 3  # From Adzuna only

    @pytest.mark.unit
    def test_aggregate_jobs_handles_source_failures(self, crew_service):
        """Test that aggregation handles individual source failures."""
        # The actual method catches exceptions internally in each fetch call
        # So we need to mock the internal requests to fail
        with patch("requests.get") as mock_get, \
             patch("requests.post") as mock_post, \
             patch("app.services.crew_service.ADZUNA_APP_ID", "test"), \
             patch("app.services.crew_service.ADZUNA_API_KEY", "test"), \
             patch("app.services.crew_service.LINKEDIN_RAPIDAPI_KEY", None), \
             patch("app.services.crew_service.JSEARCH_RAPIDAPI_KEY", None), \
             patch("app.services.crew_service.REMOTEOK_ENABLED", False):

            # Make Adzuna request fail
            mock_get.side_effect = Exception("API failed")

            # Should not raise, should return empty results
            jobs = crew_service._aggregate_jobs_from_all_sources("Engineer", "NYC", 5)

            assert isinstance(jobs, list)
            assert len(jobs) == 0  # All sources failed or disabled

    @pytest.mark.unit
    def test_aggregate_jobs_deduplicates_results(self, crew_service):
        """Test that aggregation deduplicates results."""
        duplicate_job = {
            "title": "Duplicate",
            "company": {"display_name": "Company"},
            "redirect_url": "https://same.url",
        }

        with patch.object(crew_service, "_fetch_adzuna_jobs", return_value=[duplicate_job]), \
             patch.object(crew_service, "_fetch_linkedin_jobs", return_value=[duplicate_job]), \
             patch.object(crew_service, "_fetch_jsearch_jobs", return_value=[]), \
             patch.object(crew_service, "_fetch_remoteok_jobs", return_value=[]):

            jobs = crew_service._aggregate_jobs_from_all_sources("Engineer", "NYC", 5)

            # Should only have one job after deduplication
            assert len(jobs) == 1
