"""
Tests for API tools (Adzuna, LinkedIn, JSearch, RemoteOK).

Tests cover job search tools, error handling, API response parsing,
and data validation.

Author: Test Automation Engineer
"""

import json
from unittest.mock import MagicMock, patch

import pytest
import requests

from src.tools import (
    _format_job_listing,
    _format_linkedin_job,
    _format_jsearch_job,
    _format_remoteok_job,
    _make_api_request_with_retry,
    _validate_search_input,
    search_jobs,
    search_linkedin_jobs,
    search_jsearch_jobs,
    search_remoteok_jobs,
)


# =============================================================================
# HELPER FUNCTIONS FOR CREWAI TOOLS
# =============================================================================

def call_tool(tool, **kwargs):
    """
    Call a CrewAI tool with the given arguments.

    CrewAI tools are Tool objects, not regular functions.
    We need to use the .run() method or ._run() to invoke them.
    """
    # Try different ways to call the tool
    if hasattr(tool, 'run'):
        return tool.run(**kwargs)
    elif hasattr(tool, '_run'):
        return tool._run(**kwargs)
    elif callable(tool):
        return tool(**kwargs)
    else:
        raise TypeError(f"Cannot call tool: {type(tool)}")


# =============================================================================
# INPUT VALIDATION TESTS
# =============================================================================

class TestValidateSearchInput:
    """Test suite for input validation."""

    @pytest.mark.unit
    def test_validate_search_input_valid(self, valid_search_params):
        """Test input validation with valid parameters."""
        is_valid, error = _validate_search_input(valid_search_params)

        assert is_valid is True
        assert error == ""

    @pytest.mark.unit
    def test_validate_search_input_missing_role(self, invalid_search_params_missing_role):
        """Test input validation with missing role."""
        is_valid, error = _validate_search_input(invalid_search_params_missing_role)

        assert is_valid is False
        assert "role" in error.lower()

    @pytest.mark.unit
    def test_validate_search_input_empty_role(self, invalid_search_params_empty_role):
        """Test input validation with empty role."""
        is_valid, error = _validate_search_input(invalid_search_params_empty_role)

        assert is_valid is False
        assert "role" in error.lower()

    @pytest.mark.unit
    def test_validate_search_input_invalid_num_results(self, invalid_search_params_bad_num_results):
        """Test input validation with num_results out of range."""
        is_valid, error = _validate_search_input(invalid_search_params_bad_num_results)

        assert is_valid is False
        assert "num_results" in error.lower() or "results" in error.lower()

    @pytest.mark.unit
    def test_validate_search_input_missing_location(self, invalid_search_params_missing_location):
        """Test input validation with missing location."""
        is_valid, error = _validate_search_input(invalid_search_params_missing_location)

        assert is_valid is False
        assert "location" in error.lower()

    @pytest.mark.unit
    def test_validate_search_input_empty_location(self, invalid_search_params_empty_location):
        """Test input validation with empty location."""
        is_valid, error = _validate_search_input(invalid_search_params_empty_location)

        assert is_valid is False
        assert "location" in error.lower()

    @pytest.mark.unit
    def test_validate_search_input_non_integer_num_results(self, invalid_search_params_string_num_results):
        """Test input validation with non-integer num_results."""
        is_valid, error = _validate_search_input(invalid_search_params_string_num_results)

        assert is_valid is False

    @pytest.mark.unit
    def test_validate_search_input_zero_num_results(self, invalid_search_params_zero_results):
        """Test input validation with zero num_results."""
        is_valid, error = _validate_search_input(invalid_search_params_zero_results)

        assert is_valid is False

    @pytest.mark.unit
    def test_validate_search_input_negative_num_results(self, invalid_search_params_negative_results):
        """Test input validation with negative num_results."""
        is_valid, error = _validate_search_input(invalid_search_params_negative_results)

        assert is_valid is False

    @pytest.mark.unit
    def test_validate_search_input_boundary_num_results(self):
        """Test input validation at boundary values."""
        # Test minimum valid value
        params_min = {"role": "Engineer", "location": "SF", "num_results": 1}
        is_valid, _ = _validate_search_input(params_min)
        assert is_valid is True

        # Test maximum valid value
        params_max = {"role": "Engineer", "location": "SF", "num_results": 50}
        is_valid, _ = _validate_search_input(params_max)
        assert is_valid is True

        # Test below minimum
        params_below = {"role": "Engineer", "location": "SF", "num_results": 0}
        is_valid, _ = _validate_search_input(params_below)
        assert is_valid is False

        # Test above maximum
        params_above = {"role": "Engineer", "location": "SF", "num_results": 51}
        is_valid, _ = _validate_search_input(params_above)
        assert is_valid is False

    @pytest.mark.unit
    def test_validate_search_input_whitespace_only_role(self):
        """Test input validation with whitespace-only role."""
        params = {"role": "   ", "location": "San Francisco", "num_results": 5}
        is_valid, error = _validate_search_input(params)

        assert is_valid is False
        assert "role" in error.lower()

    @pytest.mark.unit
    def test_validate_search_input_whitespace_only_location(self):
        """Test input validation with whitespace-only location."""
        params = {"role": "Software Engineer", "location": "   ", "num_results": 5}
        is_valid, error = _validate_search_input(params)

        assert is_valid is False
        assert "location" in error.lower()


# =============================================================================
# API REQUEST WITH RETRY TESTS
# =============================================================================

class TestApiRequestWithRetry:
    """Test suite for API request with retry logic."""

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_success(self, mock_requests_get):
        """Test successful API request."""
        url = "https://api.example.com/test"
        result = _make_api_request_with_retry(url)

        assert result is not None
        assert "results" in result
        mock_requests_get.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_rate_limit(self):
        """Test API request with rate limiting."""
        with patch("requests.get") as mock_get:
            # First call returns 429, second call succeeds
            response_429 = MagicMock()
            response_429.status_code = 429
            response_429.raise_for_status.side_effect = requests.exceptions.HTTPError("429 Rate Limited")

            response_200 = MagicMock()
            response_200.status_code = 200
            response_200.json.return_value = {"results": []}
            response_200.raise_for_status = MagicMock()

            mock_get.side_effect = [response_429, response_200]

            with patch("time.sleep"):  # Speed up test by mocking sleep
                result = _make_api_request_with_retry("https://api.example.com/test", max_retries=2)

            assert result == {"results": []}
            assert mock_get.call_count == 2

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_server_error(self):
        """Test API request with server error and retry."""
        with patch("requests.get") as mock_get:
            # First call returns 500, second call succeeds
            response_500 = MagicMock()
            response_500.status_code = 500
            response_500.raise_for_status.side_effect = requests.exceptions.HTTPError("500 Server Error")

            response_200 = MagicMock()
            response_200.status_code = 200
            response_200.json.return_value = {"data": "success"}
            response_200.raise_for_status = MagicMock()

            mock_get.side_effect = [response_500, response_200]

            with patch("time.sleep"):
                result = _make_api_request_with_retry("https://api.example.com/test", max_retries=2)

            assert result == {"data": "success"}

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_timeout(self, mock_requests_get_timeout):
        """Test API request timeout with retries."""
        with patch("time.sleep"):
            result = _make_api_request_with_retry("https://api.example.com/test", max_retries=2)

        assert result is None
        assert mock_requests_get_timeout.call_count == 2

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_connection_error(self, mock_requests_get_connection_error):
        """Test API request connection error with retries."""
        with patch("time.sleep"):
            result = _make_api_request_with_retry("https://api.example.com/test", max_retries=2)

        assert result is None
        assert mock_requests_get_connection_error.call_count == 2

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_invalid_json(self):
        """Test API request with invalid JSON response."""
        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            result = _make_api_request_with_retry("https://api.example.com/test")

        assert result is None

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_with_retry_max_retries_exhausted(self):
        """Test API request exhausts all retries."""
        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("500 Server Error")
            mock_get.return_value = mock_response

            with patch("time.sleep"):
                result = _make_api_request_with_retry("https://api.example.com/test", max_retries=3)

            assert result is None
            assert mock_get.call_count == 3

    @pytest.mark.unit
    @pytest.mark.tools
    def test_make_api_request_client_error_no_retry(self):
        """Test that client errors (4xx except 429) don't retry."""
        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 400
            mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("400 Bad Request")
            mock_get.return_value = mock_response

            result = _make_api_request_with_retry("https://api.example.com/test", max_retries=3)

            assert result is None
            # Should not retry on 400 error
            assert mock_get.call_count == 1


# =============================================================================
# JOB FORMATTING TESTS
# =============================================================================

class TestJobFormatting:
    """Test suite for job listing formatting."""

    @pytest.mark.unit
    def test_format_job_listing_complete_data(self):
        """Test job listing formatting with complete data."""
        job = {
            "title": "Senior Software Engineer",
            "company": {"display_name": "TechCorp Inc."},
            "location": {"display_name": "San Francisco, CA"},
            "description": "We are looking for a talented engineer...",
            "salary_min": 120000,
            "salary_max": 180000,
            "redirect_url": "https://example.com/job/12345",
            "created": "2026-02-01T10:00:00Z",
        }

        formatted = _format_job_listing(job)

        assert "<job>" in formatted
        assert "</job>" in formatted
        assert "Senior Software Engineer" in formatted
        assert "TechCorp Inc." in formatted
        assert "$120,000 - $180,000" in formatted
        assert "https://example.com/job/12345" in formatted

    @pytest.mark.unit
    def test_format_job_listing_missing_salary(self):
        """Test job listing formatting with missing salary."""
        job = {
            "title": "Developer",
            "company": {"display_name": "Company"},
            "location": {"display_name": "Location"},
            "description": "Description",
            "redirect_url": "https://example.com",
            "created": "2026-02-01",
        }

        formatted = _format_job_listing(job)

        assert "Not specified" in formatted

    @pytest.mark.unit
    def test_format_job_listing_min_salary_only(self):
        """Test job listing formatting with only minimum salary."""
        job = {
            "title": "Developer",
            "company": {"display_name": "Company"},
            "location": {"display_name": "Location"},
            "description": "Description",
            "salary_min": 100000,
            "redirect_url": "https://example.com",
            "created": "2026-02-01",
        }

        formatted = _format_job_listing(job)

        assert "From $100,000" in formatted

    @pytest.mark.unit
    def test_format_job_listing_max_salary_only(self):
        """Test job listing formatting with only maximum salary."""
        job = {
            "title": "Developer",
            "company": {"display_name": "Company"},
            "location": {"display_name": "Location"},
            "description": "Description",
            "salary_max": 150000,
            "redirect_url": "https://example.com",
            "created": "2026-02-01",
        }

        formatted = _format_job_listing(job)

        assert "Up to $150,000" in formatted

    @pytest.mark.unit
    def test_format_job_listing_truncates_long_description(self):
        """Test job listing formatting truncates long descriptions."""
        long_description = "A" * 1000  # 1000 character description
        job = {
            "title": "Developer",
            "company": {"display_name": "Company"},
            "location": {"display_name": "Location"},
            "description": long_description,
            "redirect_url": "https://example.com",
            "created": "2026-02-01",
        }

        formatted = _format_job_listing(job)

        # Should be truncated to 500 chars + "..."
        assert "..." in formatted
        assert len(formatted) < len(long_description)

    @pytest.mark.unit
    def test_format_job_listing_missing_fields(self):
        """Test job listing formatting with missing optional fields."""
        job = {
            "title": "Developer",
        }

        formatted = _format_job_listing(job)

        assert "<job>" in formatted
        assert "Developer" in formatted
        assert "N/A" in formatted  # Missing fields should show N/A

    @pytest.mark.unit
    def test_format_linkedin_job(self, mock_linkedin_response):
        """Test LinkedIn job formatting."""
        job = mock_linkedin_response[0]

        formatted = _format_linkedin_job(job)

        assert "<job>" in formatted
        assert "</job>" in formatted
        assert "Backend Engineer" in formatted
        assert "BigTech Corp" in formatted
        assert "Seattle, WA" in formatted
        assert "LinkedIn" in formatted

    @pytest.mark.unit
    def test_format_linkedin_job_missing_fields(self):
        """Test LinkedIn job formatting with missing fields."""
        job = {
            "job_title": "Engineer",
        }

        formatted = _format_linkedin_job(job)

        assert "Engineer" in formatted
        assert "N/A" in formatted

    @pytest.mark.unit
    def test_format_jsearch_job(self, mock_jsearch_response):
        """Test JSearch job formatting."""
        job = mock_jsearch_response["data"][0]

        formatted = _format_jsearch_job(job)

        assert "<job>" in formatted
        assert "Full Stack Developer" in formatted
        assert "WebDev Inc" in formatted
        assert "JSearch" in formatted

    @pytest.mark.unit
    def test_format_jsearch_job_remote(self, mock_jsearch_response):
        """Test JSearch job formatting for remote jobs."""
        job = mock_jsearch_response["data"][1]  # The remote job

        formatted = _format_jsearch_job(job)

        assert "Remote" in formatted
        assert "Python Developer" in formatted

    @pytest.mark.unit
    def test_format_remoteok_job(self, mock_remoteok_response):
        """Test RemoteOK job formatting."""
        job = mock_remoteok_response[1]  # Skip API metadata

        formatted = _format_remoteok_job(job)

        assert "<job>" in formatted
        assert "Remote Software Engineer" in formatted
        assert "RemoteCo" in formatted
        assert "RemoteOK" in formatted

    @pytest.mark.unit
    def test_format_remoteok_job_url_normalization(self):
        """Test RemoteOK job URL normalization."""
        job = {
            "position": "Developer",
            "company": "Company",
            "location": "Remote",
            "description": "Description",
            "url": "/remote-jobs/123",
            "date": "2026-02-01",
            "tags": [],
        }

        formatted = _format_remoteok_job(job)

        assert "https://remoteok.com/remote-jobs/123" in formatted


# =============================================================================
# ADZUNA SEARCH TOOL TESTS
# =============================================================================

class TestSearchJobs:
    """Test suite for Adzuna job search tool."""

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jobs_success(self, mock_requests_get):
        """Test successful Adzuna job search."""
        result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

        assert result is not None
        assert isinstance(result, str)
        assert "Successfully" in result or "job" in result.lower()
        mock_requests_get.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_jobs_invalid_input(self):
        """Test Adzuna job search with invalid input."""
        result = call_tool(search_jobs, role="", location="San Francisco", num_results=5)

        assert "ERROR" in result
        assert "role" in result.lower() or "invalid" in result.lower()

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_jobs_missing_credentials(self, mock_missing_adzuna_credentials):
        """Test Adzuna job search with missing credentials."""
        with patch("src.tools.ADZUNA_APP_ID", None), \
             patch("src.tools.ADZUNA_API_KEY", None):
            result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

            assert "ERROR" in result
            assert "credentials" in result.lower() or "configured" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jobs_no_results(self, mock_requests_get_empty):
        """Test Adzuna job search with no results."""
        result = call_tool(search_jobs, role="Nonexistent Job Title", location="Antarctica", num_results=5)

        assert "No job listings found" in result or "No" in result

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jobs_api_error(self, mock_requests_get_error):
        """Test Adzuna job search with API error."""
        result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

        assert "ERROR" in result or "Failed" in result

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jobs_timeout(self, mock_requests_get_timeout):
        """Test Adzuna job search with timeout."""
        with patch("time.sleep"):  # Speed up retry delays
            result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

        assert "ERROR" in result or "Failed" in result

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jobs_formats_output_correctly(self, mock_requests_get, mock_adzuna_response):
        """Test that Adzuna search formats output correctly."""
        result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=3)

        # Should contain job information
        assert "TechCorp Inc." in result or "job" in result.lower()
        assert isinstance(result, str)
        assert len(result) > 0

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_jobs_num_results_boundary(self, mock_requests_get):
        """Test Adzuna job search with boundary num_results."""
        # Minimum valid
        result = call_tool(search_jobs, role="Engineer", location="NYC", num_results=1)
        assert "ERROR" not in result or "job" in result.lower()

        # Maximum valid
        result = call_tool(search_jobs, role="Engineer", location="NYC", num_results=50)
        assert isinstance(result, str)


# =============================================================================
# LINKEDIN SEARCH TOOL TESTS
# =============================================================================

class TestSearchLinkedInJobs:
    """Test suite for LinkedIn job search tool."""

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_linkedin_jobs_success(self, mock_requests_post):
        """Test successful LinkedIn job search."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result = call_tool(search_linkedin_jobs, role="Backend Engineer", location="Seattle", num_results=5)

            assert result is not None
            assert isinstance(result, str)
            assert "LinkedIn" in result or "Successfully" in result
            mock_requests_post.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_linkedin_jobs_invalid_input(self):
        """Test LinkedIn job search with invalid input."""
        result = call_tool(search_linkedin_jobs, role="", location="Seattle", num_results=5)

        assert "ERROR" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_linkedin_jobs_missing_credentials(self):
        """Test LinkedIn job search with missing API key."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", None):
            result = call_tool(search_linkedin_jobs, role="Backend Engineer", location="Seattle", num_results=5)

            assert "not configured" in result.lower() or "not set" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_linkedin_jobs_api_error(self, mock_requests_post_error):
        """Test LinkedIn job search with API error."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result = call_tool(search_linkedin_jobs, role="Backend Engineer", location="Seattle", num_results=5)

            assert "ERROR" in result
            assert "401" in result or "Invalid" in result or "error" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_linkedin_jobs_rate_limit(self, mock_requests_post_rate_limit):
        """Test LinkedIn job search with rate limit."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result = call_tool(search_linkedin_jobs, role="Backend Engineer", location="Seattle", num_results=5)

            assert "ERROR" in result
            assert "rate limit" in result.lower() or "429" in result

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_linkedin_jobs_no_results(self):
        """Test LinkedIn job search with no results."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"), \
             patch("requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = []
            mock_response.raise_for_status = MagicMock()
            mock_post.return_value = mock_response

            result = call_tool(search_linkedin_jobs, role="Nonexistent Job", location="Antarctica", num_results=5)

            assert "No" in result or "found" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_linkedin_jobs_timeout(self, mock_requests_post_timeout):
        """Test LinkedIn job search with timeout."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result = call_tool(search_linkedin_jobs, role="Backend Engineer", location="Seattle", num_results=5)

            assert "ERROR" in result
            assert "timed out" in result.lower() or "timeout" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_linkedin_jobs_formats_output(self, mock_requests_post, mock_linkedin_response):
        """Test that LinkedIn search formats output correctly."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result = call_tool(search_linkedin_jobs, role="Backend Engineer", location="Seattle", num_results=2)

            # Should contain job information
            assert "LinkedIn" in result or "job" in result.lower()
            assert isinstance(result, str)
            assert len(result) > 0


# =============================================================================
# JSEARCH TOOL TESTS
# =============================================================================

class TestSearchJSearchJobs:
    """Test suite for JSearch job search tool."""

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jsearch_jobs_success(self, mock_jsearch_response):
        """Test successful JSearch job search."""
        with patch("requests.get") as mock_get, patch("time.sleep"):
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_jsearch_response
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            result = call_tool(search_jsearch_jobs, role="Full Stack Developer", location="Los Angeles", num_results=5)

            assert result is not None
            assert isinstance(result, str)
            assert "JSearch" in result or "Successfully" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_jsearch_jobs_invalid_input(self):
        """Test JSearch job search with invalid input."""
        result = call_tool(search_jsearch_jobs, role="", location="Los Angeles", num_results=5)

        assert "ERROR" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_jsearch_jobs_missing_credentials(self):
        """Test JSearch job search with missing API key."""
        with patch("src.tools.JSEARCH_RAPIDAPI_KEY", None):
            result = call_tool(search_jsearch_jobs, role="Developer", location="NYC", num_results=5)

            assert "not configured" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jsearch_jobs_rate_limit(self):
        """Test JSearch job search with rate limit."""
        with patch("src.tools.JSEARCH_RAPIDAPI_KEY", "test_api_key"), \
             patch("requests.get") as mock_get, \
             patch("time.sleep"):  # Speed up retry delays
            mock_response = MagicMock()
            mock_response.status_code = 429
            mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("429")
            mock_get.return_value = mock_response

            result = call_tool(search_jsearch_jobs, role="Developer", location="NYC", num_results=5)

            assert "ERROR" in result
            assert "rate limit" in result.lower() or "429" in result

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_jsearch_jobs_forbidden(self):
        """Test JSearch job search with forbidden error."""
        with patch("src.tools.JSEARCH_RAPIDAPI_KEY", "test_api_key"), \
             patch("requests.get") as mock_get, \
             patch("time.sleep"):  # Speed up retry delays
            mock_response = MagicMock()
            mock_response.status_code = 403
            mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("403")
            mock_get.return_value = mock_response

            result = call_tool(search_jsearch_jobs, role="Developer", location="NYC", num_results=5)

            assert "ERROR" in result
            assert "forbidden" in result.lower() or "403" in result or "error" in result.lower()


# =============================================================================
# REMOTEOK TOOL TESTS
# =============================================================================

class TestSearchRemoteOKJobs:
    """Test suite for RemoteOK job search tool."""

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_remoteok_jobs_success(self, mock_remoteok_response):
        """Test successful RemoteOK job search."""
        with patch("requests.get") as mock_get, patch("time.sleep"):
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_remoteok_response
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            result = call_tool(search_remoteok_jobs, role="Software Engineer", location="Remote", num_results=5)

            assert result is not None
            assert isinstance(result, str)
            assert "RemoteOK" in result or "Successfully" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_remoteok_jobs_invalid_input(self):
        """Test RemoteOK job search with invalid input."""
        result = call_tool(search_remoteok_jobs, role="", location="Remote", num_results=5)

        assert "ERROR" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_search_remoteok_jobs_disabled(self):
        """Test RemoteOK job search when disabled."""
        with patch("src.tools.REMOTEOK_ENABLED", False):
            result = call_tool(search_remoteok_jobs, role="Developer", location="Remote", num_results=5)

            assert "disabled" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_remoteok_jobs_no_matches(self, mock_remoteok_response):
        """Test RemoteOK job search with no matching jobs."""
        with patch("requests.get") as mock_get, patch("time.sleep"):
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [{"legal": "API"}]  # Only metadata
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            result = call_tool(search_remoteok_jobs, role="Nonexistent Role XYZ123", location="Remote", num_results=5)

            assert "No" in result or "found" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_remoteok_jobs_timeout(self):
        """Test RemoteOK job search with timeout."""
        with patch("requests.get") as mock_get:
            mock_get.side_effect = requests.exceptions.Timeout("Timeout")

            result = call_tool(search_remoteok_jobs, role="Developer", location="Remote", num_results=5)

            assert "ERROR" in result
            assert "timed out" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    def test_search_remoteok_jobs_filters_by_role(self, mock_remoteok_response):
        """Test RemoteOK job search filters jobs by role."""
        with patch("requests.get") as mock_get, patch("time.sleep"):
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_remoteok_response
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            # Search for "software" should match "Remote Software Engineer"
            result = call_tool(search_remoteok_jobs, role="software", location="Remote", num_results=5)

            assert "Software" in result or "software" in result.lower()


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================

class TestToolsErrorHandling:
    """Test suite for tools error handling."""

    @pytest.mark.unit
    @pytest.mark.tools
    def test_tools_handle_network_errors_gracefully(self):
        """Test that tools handle network errors without crashing."""
        with patch("requests.get") as mock_get:
            mock_get.side_effect = requests.exceptions.ConnectionError("Network error")

            # Should not raise exception
            result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

            assert isinstance(result, str)
            assert "ERROR" in result or "Failed" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_tools_handle_unexpected_response_structure(self):
        """Test that tools handle unexpected API response structure."""
        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"unexpected": "structure"}
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            # Should handle gracefully
            result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

            assert isinstance(result, str)

    @pytest.mark.unit
    @pytest.mark.tools
    def test_tools_handle_request_exception(self):
        """Test that tools handle generic request exceptions."""
        with patch("requests.get") as mock_get:
            mock_get.side_effect = requests.exceptions.RequestException("Generic error")

            result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

            assert isinstance(result, str)
            assert "ERROR" in result or "Failed" in result

    @pytest.mark.unit
    @pytest.mark.tools
    def test_tools_handle_ssl_error(self):
        """Test that tools handle SSL errors."""
        with patch("requests.get") as mock_get:
            mock_get.side_effect = requests.exceptions.SSLError("SSL verification failed")

            result = call_tool(search_jobs, role="Software Engineer", location="San Francisco", num_results=5)

            assert isinstance(result, str)


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestToolsIntegration:
    """Integration tests for job search tools."""

    @pytest.mark.integration
    @pytest.mark.tools
    @pytest.mark.slow
    def test_search_jobs_end_to_end(self, mock_requests_get, mock_adzuna_response):
        """End-to-end test of Adzuna job search."""
        result = call_tool(search_jobs, role="Data Scientist", location="New York", num_results=5)

        # Verify output structure
        assert isinstance(result, str)
        assert len(result) > 0

        # Should contain key information
        assert "Data Scientist" in result or "job" in result.lower()

    @pytest.mark.integration
    @pytest.mark.tools
    @pytest.mark.slow
    def test_search_linkedin_jobs_end_to_end(self, mock_requests_post, mock_linkedin_response):
        """End-to-end test of LinkedIn job search."""
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result = call_tool(search_linkedin_jobs, role="DevOps Engineer", location="Austin", num_results=3)

            # Verify output structure
            assert isinstance(result, str)
            assert len(result) > 0

    @pytest.mark.integration
    @pytest.mark.tools
    def test_all_tools_return_strings(
        self,
        mock_requests_get,
        mock_requests_post,
        mock_jsearch_response,
        mock_remoteok_response,
    ):
        """Test that all tools return string outputs."""
        # Adzuna
        result_adzuna = call_tool(search_jobs, role="Engineer", location="NYC", num_results=3)
        assert isinstance(result_adzuna, str)

        # LinkedIn
        with patch("src.tools.LINKEDIN_RAPIDAPI_KEY", "test_api_key"):
            result_linkedin = call_tool(search_linkedin_jobs, role="Engineer", location="NYC", num_results=3)
            assert isinstance(result_linkedin, str)

        # JSearch
        with patch("src.tools.JSEARCH_RAPIDAPI_KEY", "test_api_key"), \
             patch("requests.get") as mock_get, \
             patch("time.sleep"):
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_jsearch_response
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            result_jsearch = call_tool(search_jsearch_jobs, role="Engineer", location="NYC", num_results=3)
            assert isinstance(result_jsearch, str)

        # RemoteOK
        with patch("requests.get") as mock_get, patch("time.sleep"):
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_remoteok_response
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response

            result_remoteok = call_tool(search_remoteok_jobs, role="Engineer", location="Remote", num_results=3)
            assert isinstance(result_remoteok, str)
