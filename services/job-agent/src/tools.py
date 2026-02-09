"""
Custom tools for the Job Search AI Agent System.

This module contains the JobSearchTool that integrates with the Adzuna API
to fetch real-time job listings. Tools in CrewAI are functions that agents
can use to interact with external systems.

Author: Claude Builder Club @ UC Irvine
Workshop: Intro to AI Agents (October 20, 2025)
"""

import json
import time
import requests
from typing import Any, Dict, List, Optional
from crewai.tools import tool

from src.config import (
    ADZUNA_APP_ID,
    ADZUNA_API_KEY,
    ADZUNA_BASE_URL,
    ADZUNA_COUNTRY,
    LINKEDIN_RAPIDAPI_KEY,
    LINKEDIN_BASE_URL,
    LINKEDIN_RAPIDAPI_HOST,
    JSEARCH_RAPIDAPI_KEY,
    JSEARCH_BASE_URL,
    JSEARCH_RAPIDAPI_HOST,
    REMOTEOK_ENABLED,
    REMOTEOK_BASE_URL,
    API_TIMEOUT,
    API_MAX_RETRIES,
    API_RETRY_DELAY,
    API_RATE_LIMIT_DELAY,
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _make_api_request_with_retry(
    url: str,
    max_retries: int = API_MAX_RETRIES,
    timeout: int = API_TIMEOUT
) -> Optional[Dict[str, Any]]:
    """
    Make an API request with retry logic for robustness.

    Args:
        url: The full URL to request
        max_retries: Maximum number of retry attempts
        timeout: Request timeout in seconds

    Returns:
        JSON response as dictionary, or None if all retries fail
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:  # Rate limit
                print(f"⚠️  Rate limited. Waiting {API_RETRY_DELAY}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(API_RETRY_DELAY)
                continue
            elif response.status_code >= 500:  # Server error
                print(f"⚠️  Server error. Retry {attempt + 1}/{max_retries}...")
                time.sleep(API_RETRY_DELAY)
                continue
            else:
                print(f"❌ HTTP Error {response.status_code}: {str(e)}")
                return None

        except requests.exceptions.Timeout:
            print(f"⚠️  Request timeout. Retry {attempt + 1}/{max_retries}...")
            if attempt < max_retries - 1:
                time.sleep(API_RETRY_DELAY)
                continue
            else:
                print("❌ Max retries reached. Request timed out.")
                return None

        except requests.exceptions.ConnectionError:
            print(f"⚠️  Connection error. Retry {attempt + 1}/{max_retries}...")
            if attempt < max_retries - 1:
                time.sleep(API_RETRY_DELAY)
                continue
            else:
                print("❌ Max retries reached. Connection failed.")
                return None

        except requests.exceptions.RequestException as e:
            print(f"❌ Request error: {str(e)}")
            return None

        except json.JSONDecodeError:
            print("❌ Invalid JSON response from API")
            return None

    return None


def _format_job_listing(job: Dict[str, Any]) -> str:
    """
    Format a single job listing into a readable string.

    Args:
        job: Job data dictionary from Adzuna API

    Returns:
        Formatted job listing string
    """
    title = job.get('title', 'N/A')
    company = job.get('company', {}).get('display_name', 'N/A')
    location = job.get('location', {}).get('display_name', 'N/A')
    description = job.get('description', 'No description available')
    salary_min = job.get('salary_min')
    salary_max = job.get('salary_max')
    url = job.get('redirect_url', 'N/A')
    created = job.get('created', 'N/A')

    # Format salary information
    salary_info = "Not specified"
    if salary_min and salary_max:
        salary_info = f"${salary_min:,.0f} - ${salary_max:,.0f}"
    elif salary_min:
        salary_info = f"From ${salary_min:,.0f}"
    elif salary_max:
        salary_info = f"Up to ${salary_max:,.0f}"

    # Truncate description
    max_description_length = 500
    if len(description) > max_description_length:
        description = description[:max_description_length] + "..."

    # Format using XML-style tags
    formatted = f"""
<job>
    <title>{title}</title>
    <company>{company}</company>
    <location>{location}</location>
    <salary>{salary_info}</salary>
    <posted_date>{created}</posted_date>
    <description>
        {description}
    </description>
    <apply_url>{url}</apply_url>
</job>
"""
    return formatted.strip()


def _validate_search_input(input_data: Dict[str, Any]) -> tuple[bool, str]:
    """
    Validate job search input parameters.

    Args:
        input_data: Dictionary with role, location, num_results

    Returns:
        Tuple of (is_valid, error_message)
    """
    required_fields = ['role', 'location', 'num_results']

    for field in required_fields:
        if field not in input_data:
            return False, f"Missing required field: '{field}'"

    role = input_data['role']
    if not isinstance(role, str) or len(role.strip()) == 0:
        return False, "Role must be a non-empty string"

    location = input_data['location']
    if not isinstance(location, str) or len(location.strip()) == 0:
        return False, "Location must be a non-empty string"

    num_results = input_data['num_results']
    if not isinstance(num_results, int):
        return False, "num_results must be an integer"
    if num_results < 1 or num_results > 50:
        return False, "num_results must be between 1 and 50"

    return True, ""


# =============================================================================
# CREWAI TOOL: JOB SEARCH
# =============================================================================

@tool("Job Search Tool")
def search_jobs(role: str, location: str, num_results: int) -> str:
    """
    Search for job listings using the Adzuna API.

    Args:
        role: Job title/role to search for (e.g., "Data Scientist")
        location: Location to search in (e.g., "Los Angeles")
        num_results: Number of job listings to return (1-50)

    Returns:
        Formatted string containing job listings or error message
    """

    input_data = {
        'role': role,
        'location': location,
        'num_results': num_results
    }

    is_valid, error_message = _validate_search_input(input_data)
    if not is_valid:
        return f"""
❌ ERROR: Invalid input parameters.

{error_message}

Please provide valid parameters:
- role: Job title (non-empty string)
- location: Search location (non-empty string)
- num_results: Number of results (1-50)
"""

    if not ADZUNA_APP_ID or not ADZUNA_API_KEY:
        return """
❌ ERROR: Adzuna API credentials not configured.

Please set the following environment variables:
- ADZUNA_APP_ID
- ADZUNA_API_KEY

See the .env.example file for details.
"""

    url = (
        f"{ADZUNA_BASE_URL}/{ADZUNA_COUNTRY}/search/1"
        f"?app_id={ADZUNA_APP_ID}"
        f"&app_key={ADZUNA_API_KEY}"
        f"&results_per_page={num_results}"
        f"&what={role}"
        f"&where={location}"
        f"&content-type=application/json"
    )

    print(f"\n🔍 Searching for {num_results} '{role}' jobs in {location}...")

    jobs_data = _make_api_request_with_retry(url)

    if jobs_data is None:
        return """
❌ ERROR: Failed to fetch job listings from Adzuna API.

Possible causes:
- Network connection issues
- API service temporarily unavailable
- Rate limit exceeded

Please try again in a few moments.
"""

    results = jobs_data.get('results', [])

    if not results or len(results) == 0:
        return f"""
ℹ️  No job listings found for '{role}' in {location}.

Suggestions:
- Try a broader search term (e.g., "Data" instead of "Senior Data Scientist")
- Try a different location
- Try searching for related roles
"""

    formatted_jobs = []
    for i, job in enumerate(results, 1):
        formatted_job = _format_job_listing(job)
        formatted_jobs.append(f"[Job {i}/{len(results)}]\n{formatted_job}")

    total_count = jobs_data.get('count', len(results))
    output = f"""
✅ Successfully found {len(results)} job listings (out of {total_count} total matches)

Search Parameters:
- Role: {role}
- Location: {location}

Job Listings:
{"=" * 80}

{"=" * 80}

""".join(formatted_jobs)

    print(f"✅ Found {len(results)} job listings!")

    return output


# =============================================================================
# CREWAI TOOL: LINKEDIN JOB SEARCH
# =============================================================================

def _format_linkedin_job(job: Dict[str, Any]) -> str:
    """
    Format a LinkedIn job listing into a readable string.

    Args:
        job: Job data dictionary from LinkedIn API

    Returns:
        Formatted job listing string
    """
    title = job.get('job_title', 'N/A')
    company = job.get('company_name', 'N/A')
    location = job.get('job_location', 'N/A')
    description = job.get('job_description', 'No description available')
    url = job.get('linkedin_job_url_cleaned', job.get('job_url', 'N/A'))
    posted = job.get('posted_date', 'N/A')
    employment_type = job.get('job_employment_type', 'Not specified')

    # Truncate description
    max_description_length = 500
    if len(description) > max_description_length:
        description = description[:max_description_length] + "..."

    formatted = f"""
<job>
    <title>{title}</title>
    <company>{company}</company>
    <location>{location}</location>
    <employment_type>{employment_type}</employment_type>
    <posted_date>{posted}</posted_date>
    <description>
        {description}
    </description>
    <apply_url>{url}</apply_url>
    <source>LinkedIn</source>
</job>
"""
    return formatted.strip()


@tool("LinkedIn Job Search Tool")
def search_linkedin_jobs(role: str, location: str, num_results: int) -> str:
    """
    Search for job listings on LinkedIn using RapidAPI.

    Args:
        role: Job title/role to search for (e.g., "Data Scientist")
        location: Location to search in (e.g., "San Francisco")
        num_results: Number of job listings to return (1-50)

    Returns:
        Formatted string containing LinkedIn job listings or error message
    """

    # Validate input
    input_data = {
        'role': role,
        'location': location,
        'num_results': num_results
    }

    is_valid, error_message = _validate_search_input(input_data)
    if not is_valid:
        return f"""
❌ ERROR: Invalid input parameters.

{error_message}

Please provide valid parameters:
- role: Job title (non-empty string)
- location: Search location (non-empty string)
- num_results: Number of results (1-50)
"""

    # Check API credentials
    if not LINKEDIN_RAPIDAPI_KEY:
        return """
⚠️  LinkedIn API not configured.

The LinkedIn Job Search Tool requires a RapidAPI key.
To enable LinkedIn job search:
1. Sign up at https://rapidapi.com
2. Subscribe to the LinkedIn Jobs Search API
3. Add your key to .env: LINKEDIN_RAPIDAPI_KEY=your_key

Falling back to other job search tools.
"""

    # Build request
    url = f"{LINKEDIN_BASE_URL}/"
    headers = {
        "X-RapidAPI-Key": LINKEDIN_RAPIDAPI_KEY,
        "X-RapidAPI-Host": LINKEDIN_RAPIDAPI_HOST,
        "Content-Type": "application/json"
    }

    payload = {
        "search_terms": role,
        "location": location,
        "page": "1"
    }

    print(f"\n🔍 Searching LinkedIn for {num_results} '{role}' jobs in {location}...")

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=API_TIMEOUT)
        response.raise_for_status()
        jobs_data = response.json()

    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            return "❌ ERROR: Invalid LinkedIn API key. Please check your LINKEDIN_RAPIDAPI_KEY."
        elif response.status_code == 429:
            return "❌ ERROR: LinkedIn API rate limit exceeded. Please try again later."
        else:
            return f"❌ ERROR: LinkedIn API returned status {response.status_code}: {str(e)}"

    except requests.exceptions.Timeout:
        return "❌ ERROR: LinkedIn API request timed out. Please try again."

    except requests.exceptions.RequestException as e:
        return f"❌ ERROR: Failed to connect to LinkedIn API: {str(e)}"

    except json.JSONDecodeError:
        return "❌ ERROR: Invalid JSON response from LinkedIn API"

    # Parse results
    results = jobs_data if isinstance(jobs_data, list) else jobs_data.get('jobs', [])

    if not results:
        return f"""
ℹ️  No LinkedIn job listings found for '{role}' in {location}.

Suggestions:
- Try a broader search term
- Try a different location format (e.g., "San Francisco, CA" or "San Francisco")
- Check if the role name is commonly used on LinkedIn
"""

    # Limit to requested number
    results = results[:num_results]

    # Format jobs
    formatted_jobs = []
    for i, job in enumerate(results, 1):
        formatted_job = _format_linkedin_job(job)
        formatted_jobs.append(f"[LinkedIn Job {i}/{len(results)}]\n{formatted_job}")

    output = f"""
✅ Successfully found {len(results)} LinkedIn job listings

Search Parameters:
- Role: {role}
- Location: {location}
- Source: LinkedIn

Job Listings:
{"=" * 80}

{"=" * 80}

""".join(formatted_jobs)

    print(f"✅ Found {len(results)} LinkedIn job listings!")

    return output


# =============================================================================
# CREWAI TOOL: JSEARCH JOB SEARCH (RapidAPI)
# =============================================================================

def _format_jsearch_job(job: Dict[str, Any]) -> str:
    """
    Format a JSearch job listing into a readable string.

    Args:
        job: Job data dictionary from JSearch API

    Returns:
        Formatted job listing string
    """
    title = job.get('job_title', 'N/A')
    company = job.get('employer_name', 'N/A')
    location = job.get('job_city', '')
    state = job.get('job_state', '')
    country = job.get('job_country', '')

    # Build location string
    location_parts = [p for p in [location, state, country] if p]
    location_str = ', '.join(location_parts) if location_parts else 'N/A'

    description = job.get('job_description', 'No description available')
    url = job.get('job_apply_link', job.get('job_google_link', 'N/A'))
    posted = job.get('job_posted_at_datetime_utc', 'N/A')
    employment_type = job.get('job_employment_type', 'Not specified')
    is_remote = job.get('job_is_remote', False)

    # Add remote indicator
    if is_remote:
        location_str = f"Remote - {location_str}"

    # Truncate description
    max_description_length = 500
    if len(description) > max_description_length:
        description = description[:max_description_length] + "..."

    formatted = f"""
<job>
    <title>{title}</title>
    <company>{company}</company>
    <location>{location_str}</location>
    <employment_type>{employment_type}</employment_type>
    <posted_date>{posted}</posted_date>
    <description>
        {description}
    </description>
    <apply_url>{url}</apply_url>
    <source>JSearch (Multi-Board)</source>
</job>
"""
    return formatted.strip()


@tool("JSearch Job Search Tool")
def search_jsearch_jobs(role: str, location: str, num_results: int) -> str:
    """
    Search for job listings across multiple job boards using JSearch API (via RapidAPI).

    JSearch aggregates jobs from Indeed, LinkedIn, Glassdoor, ZipRecruiter, BeBee, and more.

    Args:
        role: Job title/role to search for (e.g., "Data Scientist")
        location: Location to search in (e.g., "San Francisco, CA")
        num_results: Number of job listings to return (1-50)

    Returns:
        Formatted string containing job listings or error message
    """

    # Validate input
    input_data = {
        'role': role,
        'location': location,
        'num_results': num_results
    }

    is_valid, error_message = _validate_search_input(input_data)
    if not is_valid:
        return f"""
❌ ERROR: Invalid input parameters.

{error_message}

Please provide valid parameters:
- role: Job title (non-empty string)
- location: Search location (non-empty string)
- num_results: Number of results (1-50)
"""

    # Check API credentials
    if not JSEARCH_RAPIDAPI_KEY:
        return """
⚠️  JSearch API not configured.

The JSearch Job Search Tool requires a RapidAPI key.
To enable JSearch job search:
1. Sign up at https://rapidapi.com
2. Subscribe to the JSearch API
3. Add your key to .env: JSEARCH_RAPIDAPI_KEY=your_key

Falling back to other job search tools.
"""

    # Build request
    url = f"{JSEARCH_BASE_URL}/search"
    headers = {
        "X-RapidAPI-Key": JSEARCH_RAPIDAPI_KEY,
        "X-RapidAPI-Host": JSEARCH_RAPIDAPI_HOST
    }

    params = {
        "query": f"{role} in {location}",
        "page": "1",
        "num_pages": "1",
        "date_posted": "all"
    }

    print(f"\n🔍 Searching JSearch for {num_results} '{role}' jobs in {location}...")

    try:
        response = requests.get(url, headers=headers, params=params, timeout=API_TIMEOUT)
        response.raise_for_status()
        jobs_data = response.json()

    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            return "❌ ERROR: Invalid JSearch API key. Please check your JSEARCH_RAPIDAPI_KEY."
        elif response.status_code == 429:
            return "❌ ERROR: JSearch API rate limit exceeded. Please try again later."
        elif response.status_code == 403:
            return "❌ ERROR: JSearch API access forbidden. Check your subscription status."
        else:
            return f"❌ ERROR: JSearch API returned status {response.status_code}: {str(e)}"

    except requests.exceptions.Timeout:
        return "❌ ERROR: JSearch API request timed out. Please try again."

    except requests.exceptions.RequestException as e:
        return f"❌ ERROR: Failed to connect to JSearch API: {str(e)}"

    except json.JSONDecodeError:
        return "❌ ERROR: Invalid JSON response from JSearch API"

    # Parse results
    results = jobs_data.get('data', [])

    if not results:
        return f"""
ℹ️  No JSearch job listings found for '{role}' in {location}.

Suggestions:
- Try a broader search term
- Try a different location format
- Check if the role name is commonly used
"""

    # Limit to requested number
    results = results[:num_results]

    # Format jobs
    formatted_jobs = []
    for i, job in enumerate(results, 1):
        formatted_job = _format_jsearch_job(job)
        formatted_jobs.append(f"[JSearch Job {i}/{len(results)}]\n{formatted_job}")

    output = f"""
✅ Successfully found {len(results)} JSearch job listings

Search Parameters:
- Role: {role}
- Location: {location}
- Source: JSearch (Aggregates Indeed, LinkedIn, Glassdoor, ZipRecruiter, etc.)

Job Listings:
{"=" * 80}

{"=" * 80}

""".join(formatted_jobs)

    print(f"✅ Found {len(results)} JSearch job listings!")

    # Add rate limit delay
    time.sleep(API_RATE_LIMIT_DELAY)

    return output


# =============================================================================
# CREWAI TOOL: REMOTEOK JOB SEARCH
# =============================================================================

def _format_remoteok_job(job: Dict[str, Any]) -> str:
    """
    Format a RemoteOK job listing into a readable string.

    Args:
        job: Job data dictionary from RemoteOK API

    Returns:
        Formatted job listing string
    """
    title = job.get('position', 'N/A')
    company = job.get('company', 'N/A')
    location = job.get('location', 'Remote')
    description = job.get('description', 'No description available')
    url = job.get('url', 'N/A')
    if url != 'N/A' and not url.startswith('http'):
        url = f"https://remoteok.com{url}"

    posted = job.get('date', 'N/A')
    tags = job.get('tags', [])

    # Truncate description
    max_description_length = 500
    if len(description) > max_description_length:
        description = description[:max_description_length] + "..."

    # Format tags as skills
    skills = ', '.join(tags[:10]) if tags else 'Not specified'

    formatted = f"""
<job>
    <title>{title}</title>
    <company>{company}</company>
    <location>{location}</location>
    <skills>{skills}</skills>
    <posted_date>{posted}</posted_date>
    <description>
        {description}
    </description>
    <apply_url>{url}</apply_url>
    <source>RemoteOK</source>
</job>
"""
    return formatted.strip()


@tool("RemoteOK Job Search Tool")
def search_remoteok_jobs(role: str, location: str, num_results: int) -> str:
    """
    Search for remote job listings using the RemoteOK API.

    RemoteOK specializes in remote-first positions across tech, design, marketing, and more.
    This API is free and doesn't require authentication.

    Args:
        role: Job title/role to search for (e.g., "Software Engineer")
        location: Location preference (note: most jobs are remote, but can filter)
        num_results: Number of job listings to return (1-50)

    Returns:
        Formatted string containing remote job listings or error message
    """

    # Validate input
    input_data = {
        'role': role,
        'location': location,
        'num_results': num_results
    }

    is_valid, error_message = _validate_search_input(input_data)
    if not is_valid:
        return f"""
❌ ERROR: Invalid input parameters.

{error_message}

Please provide valid parameters:
- role: Job title (non-empty string)
- location: Search location (non-empty string)
- num_results: Number of results (1-50)
"""

    # Check if RemoteOK is enabled
    if not REMOTEOK_ENABLED:
        return """
⚠️  RemoteOK is disabled.

To enable RemoteOK job search, set REMOTEOK_ENABLED=true in your .env file.
This API is free and doesn't require authentication.
"""

    print(f"\n🔍 Searching RemoteOK for {num_results} remote '{role}' jobs...")

    try:
        # RemoteOK API returns all jobs, we filter client-side
        response = requests.get(REMOTEOK_BASE_URL, timeout=API_TIMEOUT)
        response.raise_for_status()
        jobs_data = response.json()

    except requests.exceptions.HTTPError as e:
        return f"❌ ERROR: RemoteOK API returned status {response.status_code}: {str(e)}"

    except requests.exceptions.Timeout:
        return "❌ ERROR: RemoteOK API request timed out. Please try again."

    except requests.exceptions.RequestException as e:
        return f"❌ ERROR: Failed to connect to RemoteOK API: {str(e)}"

    except json.JSONDecodeError:
        return "❌ ERROR: Invalid JSON response from RemoteOK API"

    # Filter jobs by role (case-insensitive)
    # Skip the first element (it's API metadata)
    all_jobs = jobs_data[1:] if len(jobs_data) > 1 and isinstance(jobs_data[0], dict) else jobs_data

    role_lower = role.lower()
    filtered_jobs = []

    for job in all_jobs:
        if not isinstance(job, dict):
            continue

        position = job.get('position', '').lower()
        company = job.get('company', '').lower()
        description = job.get('description', '').lower()
        tags = [tag.lower() for tag in job.get('tags', [])]

        # Check if role matches position, company, description, or tags
        if (role_lower in position or
            role_lower in description or
            any(role_lower in tag for tag in tags)):
            filtered_jobs.append(job)

        if len(filtered_jobs) >= num_results:
            break

    if not filtered_jobs:
        return f"""
ℹ️  No RemoteOK job listings found for '{role}'.

Suggestions:
- Try a broader search term (e.g., "Developer" instead of "Senior React Developer")
- Try related terms (e.g., "Engineer", "Designer", "Manager")
- RemoteOK focuses on remote-first tech positions
"""

    # Limit to requested number
    results = filtered_jobs[:num_results]

    # Format jobs
    formatted_jobs = []
    for i, job in enumerate(results, 1):
        formatted_job = _format_remoteok_job(job)
        formatted_jobs.append(f"[RemoteOK Job {i}/{len(results)}]\n{formatted_job}")

    output = f"""
✅ Successfully found {len(results)} RemoteOK job listings

Search Parameters:
- Role: {role}
- Source: RemoteOK (Remote-first positions)

Job Listings:
{"=" * 80}

{"=" * 80}

""".join(formatted_jobs)

    print(f"✅ Found {len(results)} RemoteOK job listings!")

    # Add rate limit delay
    time.sleep(API_RATE_LIMIT_DELAY)

    return output


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "search_jobs",
    "search_linkedin_jobs",
    "search_jsearch_jobs",
    "search_remoteok_jobs",
]
