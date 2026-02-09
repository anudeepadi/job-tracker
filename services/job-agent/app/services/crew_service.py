"""
CrewAI integration service for the Job Agent API.

This module provides a service layer that wraps the existing CrewAI job search
agent functionality, managing job searches asynchronously and caching results.

Author: Backend API Designer
"""

import asyncio
import sys
import uuid
import requests
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add the job-agent src directory to the path for imports
JOB_AGENT_SRC = Path(__file__).parent.parent.parent
if str(JOB_AGENT_SRC) not in sys.path:
    sys.path.insert(0, str(JOB_AGENT_SRC))

from crewai import Crew, Process

# Import from the local src package
from src.agents import create_all_agents
from src.tasks import create_all_tasks
from src.config import (
    validate_config,
    OUTPUT_DIR,
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
    API_RATE_LIMIT_DELAY,
)

from app.models.schemas import (
    JobSearchStatus,
    JobListing,
    MarketInsights,
    AgentInfo,
    AgentCapability,
)


# =============================================================================
# JOB STORAGE (In-Memory Cache)
# =============================================================================

class JobStore:
    """
    In-memory storage for job search results.

    In a production system, this would be replaced with Redis or a database.
    For this service, we use a simple dictionary with thread-safe access.
    """

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, job_id: str, params: Dict[str, Any]) -> None:
        """Create a new job entry."""
        async with self._lock:
            self._jobs[job_id] = {
                "job_id": job_id,
                "status": JobSearchStatus.PENDING,
                "params": params,
                "created_at": datetime.utcnow(),
                "started_at": None,
                "completed_at": None,
                "progress": "Waiting to start",
                "result": None,
                "error": None,
            }

    async def update_job(self, job_id: str, updates: Dict[str, Any]) -> None:
        """Update a job entry."""
        async with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(updates)

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job entry by ID."""
        async with self._lock:
            return self._jobs.get(job_id)

    async def list_jobs(self) -> List[Dict[str, Any]]:
        """List all jobs."""
        async with self._lock:
            return list(self._jobs.values())


# Global job store instance
job_store = JobStore()


# =============================================================================
# THREAD POOL FOR CREW EXECUTION
# =============================================================================

# ThreadPoolExecutor for running synchronous CrewAI code
executor = ThreadPoolExecutor(max_workers=3)


# =============================================================================
# CREW SERVICE
# =============================================================================

class CrewService:
    """
    Service class for managing CrewAI job searches.

    This service provides methods to:
    - Start asynchronous job searches
    - Check job status
    - Retrieve job results
    - Get agent information
    """

    def __init__(self):
        self.store = job_store
        self._agents_cache: Optional[List[AgentInfo]] = None

    # -------------------------------------------------------------------------
    # Configuration Validation
    # -------------------------------------------------------------------------

    def validate_configuration(self) -> tuple[bool, List[str]]:
        """
        Validate that the CrewAI configuration is valid.

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        return validate_config()

    # -------------------------------------------------------------------------
    # Job Search Management
    # -------------------------------------------------------------------------

    async def start_job_search(
        self,
        role: str,
        location: str,
        num_results: int = 5
    ) -> str:
        """
        Start an asynchronous job search.

        Args:
            role: Job role to search for
            location: Location for the search
            num_results: Number of results to return

        Returns:
            Job ID for tracking the search
        """
        # Generate unique job ID
        job_id = str(uuid.uuid4())

        # Store job parameters
        params = {
            "role": role,
            "location": location,
            "num_results": num_results,
        }

        await self.store.create_job(job_id, params)

        # Start the crew execution in a background thread
        asyncio.create_task(self._execute_crew(job_id, params))

        return job_id

    async def _execute_crew(self, job_id: str, params: Dict[str, Any]) -> None:
        """
        Execute the CrewAI crew in a background thread.

        Args:
            job_id: Unique job identifier
            params: Search parameters
        """
        try:
            # Update status to running
            await self.store.update_job(job_id, {
                "status": JobSearchStatus.RUNNING,
                "started_at": datetime.utcnow(),
                "progress": "Creating agents...",
            })

            # Run the synchronous crew execution in a thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                executor,
                self._run_crew_sync,
                params
            )

            # Update with success result
            await self.store.update_job(job_id, {
                "status": JobSearchStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "progress": "Completed successfully",
                "result": result,
            })

        except Exception as e:
            # Update with error
            await self.store.update_job(job_id, {
                "status": JobSearchStatus.FAILED,
                "completed_at": datetime.utcnow(),
                "progress": "Failed",
                "error": str(e),
            })

    def _fetch_adzuna_jobs(self, role: str, location: str, num_results: int) -> List[Dict[str, Any]]:
        """
        Fetch job listings directly from Adzuna API.

        This ensures we have structured job data regardless of how agents format output.

        Args:
            role: Job role to search for
            location: Location for the search
            num_results: Number of results to return

        Returns:
            List of job dictionaries from Adzuna API with 'source' field added
        """
        if not ADZUNA_APP_ID or not ADZUNA_API_KEY:
            print("⚠️  Adzuna credentials not configured, skipping Adzuna search")
            return []

        try:
            # Handle "remote" location - Adzuna doesn't support it directly
            # Search without location filter and add "remote" to the job title search
            location_lower = location.lower().strip()
            is_remote = 'remote' in location_lower

            if is_remote:
                # For remote jobs, search for "remote {role}" without location filter
                search_term = f"remote {role}"
                url = (
                    f"{ADZUNA_BASE_URL}/{ADZUNA_COUNTRY}/search/1"
                    f"?app_id={ADZUNA_APP_ID}"
                    f"&app_key={ADZUNA_API_KEY}"
                    f"&results_per_page={num_results}"
                    f"&what={requests.utils.quote(search_term)}"
                    f"&content-type=application/json"
                )
            else:
                # Normal location-based search
                url = (
                    f"{ADZUNA_BASE_URL}/{ADZUNA_COUNTRY}/search/1"
                    f"?app_id={ADZUNA_APP_ID}"
                    f"&app_key={ADZUNA_API_KEY}"
                    f"&results_per_page={num_results}"
                    f"&what={requests.utils.quote(role)}"
                    f"&where={requests.utils.quote(location)}"
                    f"&content-type=application/json"
                )

            print(f"🔍 Fetching jobs from Adzuna: role='{role}', location='{location}', remote={is_remote}")
            response = requests.get(url, timeout=API_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            results = data.get('results', [])

            # Add source field to each job
            for job in results:
                job['source'] = 'Adzuna'

            print(f"✅ Adzuna returned {len(results)} results")
            return results

        except Exception as e:
            print(f"❌ Error fetching from Adzuna API: {e}")
            return []

    def _fetch_linkedin_jobs(self, role: str, location: str, num_results: int) -> List[Dict[str, Any]]:
        """
        Fetch job listings from LinkedIn via RapidAPI.

        Args:
            role: Job role to search for
            location: Location for the search
            num_results: Number of results to return

        Returns:
            List of job dictionaries from LinkedIn API with 'source' field added
        """
        if not LINKEDIN_RAPIDAPI_KEY:
            print("⚠️  LinkedIn API key not configured, skipping LinkedIn search")
            return []

        try:
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

            print(f"🔍 Fetching jobs from LinkedIn: role='{role}', location='{location}'")
            response = requests.post(url, json=payload, headers=headers, timeout=API_TIMEOUT)
            response.raise_for_status()
            data = response.json()

            results = data if isinstance(data, list) else data.get('jobs', [])
            results = results[:num_results]

            # Normalize LinkedIn data structure and add source
            normalized_results = []
            for job in results:
                normalized_job = {
                    'title': job.get('job_title', 'Unknown'),
                    'company': {'display_name': job.get('company_name', 'Unknown')},
                    'location': {'display_name': job.get('job_location', 'Unknown')},
                    'description': job.get('job_description', ''),
                    'redirect_url': job.get('linkedin_job_url_cleaned', job.get('job_url')),
                    'created': job.get('posted_date'),
                    'source': 'LinkedIn'
                }
                normalized_results.append(normalized_job)

            print(f"✅ LinkedIn returned {len(normalized_results)} results")
            import time
            time.sleep(API_RATE_LIMIT_DELAY)
            return normalized_results

        except Exception as e:
            print(f"❌ Error fetching from LinkedIn API: {e}")
            return []

    def _fetch_jsearch_jobs(self, role: str, location: str, num_results: int) -> List[Dict[str, Any]]:
        """
        Fetch job listings from JSearch (aggregates multiple job boards) via RapidAPI.

        Args:
            role: Job role to search for
            location: Location for the search
            num_results: Number of results to return

        Returns:
            List of job dictionaries from JSearch API with 'source' field added
        """
        if not JSEARCH_RAPIDAPI_KEY:
            print("⚠️  JSearch API key not configured, skipping JSearch search")
            return []

        try:
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

            print(f"🔍 Fetching jobs from JSearch: role='{role}', location='{location}'")
            response = requests.get(url, headers=headers, params=params, timeout=API_TIMEOUT)
            response.raise_for_status()
            data = response.json()

            results = data.get('data', [])[:num_results]

            # Normalize JSearch data structure and add source
            normalized_results = []
            for job in results:
                location_parts = [p for p in [
                    job.get('job_city', ''),
                    job.get('job_state', ''),
                    job.get('job_country', '')
                ] if p]
                location_str = ', '.join(location_parts) if location_parts else 'Unknown'

                if job.get('job_is_remote', False):
                    location_str = f"Remote - {location_str}"

                normalized_job = {
                    'title': job.get('job_title', 'Unknown'),
                    'company': {'display_name': job.get('employer_name', 'Unknown')},
                    'location': {'display_name': location_str},
                    'description': job.get('job_description', ''),
                    'redirect_url': job.get('job_apply_link', job.get('job_google_link')),
                    'created': job.get('job_posted_at_datetime_utc'),
                    'source': 'JSearch'
                }
                normalized_results.append(normalized_job)

            print(f"✅ JSearch returned {len(normalized_results)} results")
            import time
            time.sleep(API_RATE_LIMIT_DELAY)
            return normalized_results

        except Exception as e:
            print(f"❌ Error fetching from JSearch API: {e}")
            return []

    def _fetch_remoteok_jobs(self, role: str, location: str, num_results: int) -> List[Dict[str, Any]]:
        """
        Fetch job listings from RemoteOK (free API, no auth required).

        Args:
            role: Job role to search for
            location: Location for the search (mostly ignored as RemoteOK is remote-first)
            num_results: Number of results to return

        Returns:
            List of job dictionaries from RemoteOK API with 'source' field added
        """
        if not REMOTEOK_ENABLED:
            print("⚠️  RemoteOK is disabled, skipping RemoteOK search")
            return []

        try:
            print(f"🔍 Fetching jobs from RemoteOK: role='{role}'")
            response = requests.get(REMOTEOK_BASE_URL, timeout=API_TIMEOUT)
            response.raise_for_status()
            data = response.json()

            # Skip first element (API metadata)
            all_jobs = data[1:] if len(data) > 1 and isinstance(data[0], dict) else data

            # Filter by role
            role_lower = role.lower()
            filtered_jobs = []

            for job in all_jobs:
                if not isinstance(job, dict):
                    continue

                position = job.get('position', '').lower()
                description = job.get('description', '').lower()
                tags = [tag.lower() for tag in job.get('tags', [])]

                if (role_lower in position or
                    role_lower in description or
                    any(role_lower in tag for tag in tags)):
                    filtered_jobs.append(job)

                if len(filtered_jobs) >= num_results:
                    break

            # Normalize RemoteOK data structure and add source
            normalized_results = []
            for job in filtered_jobs[:num_results]:
                url = job.get('url', '')
                if url and not url.startswith('http'):
                    url = f"https://remoteok.com{url}"

                normalized_job = {
                    'title': job.get('position', 'Unknown'),
                    'company': {'display_name': job.get('company', 'Unknown')},
                    'location': {'display_name': job.get('location', 'Remote')},
                    'description': job.get('description', ''),
                    'redirect_url': url,
                    'created': job.get('date'),
                    'source': 'RemoteOK'
                }
                normalized_results.append(normalized_job)

            print(f"✅ RemoteOK returned {len(normalized_results)} results")
            import time
            time.sleep(API_RATE_LIMIT_DELAY)
            return normalized_results

        except Exception as e:
            print(f"❌ Error fetching from RemoteOK API: {e}")
            return []

    def _deduplicate_jobs(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Deduplicate job listings by URL and title+company combination.

        Args:
            jobs: List of job dictionaries

        Returns:
            Deduplicated list of jobs
        """
        seen_urls = set()
        seen_title_company = set()
        deduplicated = []

        for job in jobs:
            url = job.get('redirect_url', '').strip().lower()
            title = job.get('title', '').strip().lower()
            company = job.get('company', {}).get('display_name', '').strip().lower()

            title_company_key = f"{title}|{company}"

            # Skip if we've seen this URL or title+company combo
            if url and url in seen_urls:
                continue
            if title_company_key in seen_title_company:
                continue

            # Add to seen sets
            if url:
                seen_urls.add(url)
            seen_title_company.add(title_company_key)

            deduplicated.append(job)

        return deduplicated

    def _aggregate_jobs_from_all_sources(
        self, role: str, location: str, num_results: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch and aggregate jobs from all available sources.

        This method gracefully handles failures from individual sources and
        combines results with deduplication.

        Args:
            role: Job role to search for
            location: Location for the search
            num_results: Number of results to return per source

        Returns:
            Aggregated and deduplicated list of job dictionaries
        """
        all_jobs = []
        sources_used = []

        # Fetch from Adzuna
        adzuna_jobs = self._fetch_adzuna_jobs(role, location, num_results)
        if adzuna_jobs:
            all_jobs.extend(adzuna_jobs)
            sources_used.append('Adzuna')

        # Fetch from LinkedIn
        linkedin_jobs = self._fetch_linkedin_jobs(role, location, num_results)
        if linkedin_jobs:
            all_jobs.extend(linkedin_jobs)
            sources_used.append('LinkedIn')

        # Fetch from JSearch
        jsearch_jobs = self._fetch_jsearch_jobs(role, location, num_results)
        if jsearch_jobs:
            all_jobs.extend(jsearch_jobs)
            sources_used.append('JSearch')

        # Fetch from RemoteOK
        remoteok_jobs = self._fetch_remoteok_jobs(role, location, num_results)
        if remoteok_jobs:
            all_jobs.extend(remoteok_jobs)
            sources_used.append('RemoteOK')

        # Deduplicate
        deduplicated_jobs = self._deduplicate_jobs(all_jobs)

        print(f"\n{'='*80}")
        print(f"📊 JOB AGGREGATION SUMMARY")
        print(f"{'='*80}")
        print(f"  Sources used: {', '.join(sources_used) if sources_used else 'None'}")
        print(f"  Total jobs fetched: {len(all_jobs)}")
        print(f"  After deduplication: {len(deduplicated_jobs)}")
        print(f"{'='*80}\n")

        return deduplicated_jobs

    def _run_crew_sync(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run the CrewAI crew synchronously.

        This method is executed in a thread pool to avoid blocking the async event loop.

        Args:
            params: Search parameters

        Returns:
            Dictionary containing crew results
        """
        # Fetch job listings from all available sources
        # This ensures we have structured data regardless of agent output
        aggregated_jobs = self._aggregate_jobs_from_all_sources(
            role=params["role"],
            location=params["location"],
            num_results=params["num_results"]
        )

        # Create agents
        agents_dict = create_all_agents()

        # Create tasks
        tasks = create_all_tasks(
            agents=agents_dict,
            role=params["role"],
            location=params["location"],
            num_results=params["num_results"]
        )

        # Create crew
        crew = Crew(
            agents=list(agents_dict.values()),
            tasks=tasks,
            process=Process.sequential,
            verbose=True,
        )

        # Execute the crew
        crew_output = crew.kickoff()

        # Parse and structure the results
        result = {
            "raw_output": str(crew_output),
            "task_outputs": [],
            "aggregated_jobs": aggregated_jobs,  # Store aggregated data from all sources
        }

        # Extract individual task outputs if available
        if hasattr(crew_output, 'tasks_output'):
            for task_output in crew_output.tasks_output:
                result["task_outputs"].append({
                    "description": getattr(task_output, 'description', 'Unknown'),
                    "output": getattr(task_output, 'raw', str(task_output)),
                })

        return result

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a job search.

        Args:
            job_id: Job identifier

        Returns:
            Job status dictionary or None if not found
        """
        job = await self.store.get_job(job_id)
        if not job:
            return None

        return {
            "job_id": job["job_id"],
            "status": job["status"],
            "progress": job.get("progress"),
            "started_at": job.get("started_at"),
            "completed_at": job.get("completed_at"),
            "error": job.get("error"),
        }

    async def get_job_results(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the results of a completed job search.

        Args:
            job_id: Job identifier

        Returns:
            Job results dictionary or None if not found
        """
        job = await self.store.get_job(job_id)
        if not job:
            return None

        # Extract section-specific outputs
        task_outputs = job.get("result", {}).get("task_outputs", [])
        skills_analysis = None
        interview_prep = None
        career_advice = None

        for task_output in task_outputs:
            desc = task_output.get("description", "").lower()
            output = task_output.get("output", "")

            if "skill" in desc:
                skills_analysis = output
            elif "interview" in desc:
                interview_prep = output
            elif "career" in desc or "advisory" in desc:
                career_advice = output

        # Use aggregated jobs from all sources (structured data)
        aggregated_jobs = job.get("result", {}).get("aggregated_jobs", [])
        job_listings = self._convert_aggregated_jobs(aggregated_jobs)

        raw_output = job.get("result", {}).get("raw_output", "")

        return {
            "job_id": job["job_id"],
            "status": job["status"],
            "search_params": job.get("params", {}),
            "job_listings": job_listings,
            "market_insights": self._extract_market_insights(job_listings),
            "skills_analysis": skills_analysis,
            "interview_prep": interview_prep,
            "career_advice": career_advice,
            "raw_output": raw_output,
            "completed_at": job.get("completed_at"),
        }

    def _convert_aggregated_jobs(self, jobs: List[Dict[str, Any]]) -> List[JobListing]:
        """
        Convert aggregated job data from multiple sources to JobListing objects.

        This method handles normalized job data from Adzuna, LinkedIn, JSearch, and RemoteOK.

        Args:
            jobs: List of job dictionaries (already normalized)

        Returns:
            List of JobListing objects
        """
        listings = []
        for job in jobs:
            try:
                # Extract salary info (some sources may not have this)
                salary_min = job.get('salary_min')
                salary_max = job.get('salary_max')
                salary_range = None
                if salary_min and salary_max:
                    salary_range = f"${salary_min:,.0f} - ${salary_max:,.0f}"
                elif salary_min:
                    salary_range = f"From ${salary_min:,.0f}"
                elif salary_max:
                    salary_range = f"Up to ${salary_max:,.0f}"

                # Get source for tracking
                source = job.get('source', 'Unknown')

                listings.append(JobListing(
                    title=job.get('title', 'Unknown'),
                    company=job.get('company', {}).get('display_name', 'Unknown'),
                    location=job.get('location', {}).get('display_name', 'Unknown'),
                    salary_range=salary_range,
                    description=job.get('description', '')[:500],  # Truncate
                    posted_date=job.get('created'),
                    apply_url=job.get('redirect_url'),
                    required_skills=[],
                    # Note: source field not in JobListing model, but data is preserved in conversion
                ))
            except Exception as e:
                print(f"❌ Error converting job: {e}")
                continue

        print(f"✅ Converted {len(listings)} job listings from aggregated data")
        return listings

    def _parse_job_listings(self, raw_output: str) -> List[JobListing]:
        """
        Parse job listings from the raw crew output.

        This is a simplified parser that extracts job listings from the
        XML-style formatted output.

        Args:
            raw_output: Raw output from the crew

        Returns:
            List of JobListing objects
        """
        listings = []

        # Simple parsing logic - in production, use a more robust parser
        import re

        # Find all <job>...</job> blocks (handle whitespace variations)
        job_pattern = r'<job>\s*(.*?)\s*</job>'
        job_blocks = re.findall(job_pattern, raw_output, re.DOTALL | re.IGNORECASE)

        for block in job_blocks:
            try:
                title = self._extract_tag_content(block, 'title') or 'Unknown'
                company = self._extract_tag_content(block, 'company') or 'Unknown'
                location = self._extract_tag_content(block, 'location') or 'Unknown'
                salary = self._extract_tag_content(block, 'salary')
                description = self._extract_tag_content(block, 'description') or ''
                posted_date = self._extract_tag_content(block, 'posted_date')
                apply_url = self._extract_tag_content(block, 'apply_url')

                listings.append(JobListing(
                    title=title.strip(),
                    company=company.strip(),
                    location=location.strip(),
                    salary_range=salary.strip() if salary else None,
                    description=description.strip(),
                    posted_date=posted_date.strip() if posted_date else None,
                    apply_url=apply_url.strip() if apply_url else None,
                    required_skills=[],  # Would need more parsing to extract
                ))
            except Exception as e:
                print(f"Warning: Failed to parse job block: {e}")
                continue

        # Debug logging
        if not listings:
            print(f"Warning: No job listings parsed. Output length: {len(raw_output)}")
            # Check if there are any <job> tags at all
            job_tag_count = raw_output.lower().count('<job>')
            print(f"Found {job_tag_count} <job> tags in output")

        return listings

    def _extract_tag_content(self, text: str, tag: str) -> Optional[str]:
        """Extract content from an XML-style tag."""
        import re
        pattern = f'<{tag}>(.*?)</{tag}>'
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1) if match else None

    def _extract_market_insights(self, listings: List[JobListing]) -> Optional[MarketInsights]:
        """Extract market insights from job listings."""
        if not listings:
            return None

        companies = list(set(listing.company for listing in listings if listing.company != 'Unknown'))

        return MarketInsights(
            total_jobs_found=len(listings),
            common_skills=[],  # Would need skills extraction
            experience_levels=[],  # Would need parsing
            salary_trends=None,
            notable_companies=companies[:5],
        )

    # -------------------------------------------------------------------------
    # Agent Information
    # -------------------------------------------------------------------------

    def get_agents_info(self) -> List[AgentInfo]:
        """
        Get information about all available agents.

        Returns:
            List of AgentInfo objects
        """
        if self._agents_cache is not None:
            return self._agents_cache

        agents = [
            AgentInfo(
                id="job_searcher",
                name="Job Search Specialist",
                role="Job Search Specialist",
                goal="Find highly relevant job listings matching the candidate's criteria",
                capabilities=[
                    AgentCapability(
                        name="Job Search",
                        description="Search for jobs using the Adzuna API"
                    ),
                    AgentCapability(
                        name="Market Analysis",
                        description="Analyze job market trends and patterns"
                    ),
                    AgentCapability(
                        name="Filtering",
                        description="Filter and rank job listings by relevance"
                    ),
                ],
                has_tools=True,
                tools=[
                    "Job Search Tool (Adzuna API)",
                    "LinkedIn Job Search Tool (RapidAPI)",
                    "JSearch Job Search Tool (Multi-Board Aggregator via RapidAPI)",
                    "RemoteOK Job Search Tool (Free, Remote-First Jobs)"
                ],
            ),
            AgentInfo(
                id="skills_advisor",
                name="Skills Development Advisor",
                role="Skills Development Advisor",
                goal="Analyze job requirements and create personalized learning roadmaps",
                capabilities=[
                    AgentCapability(
                        name="Skills Extraction",
                        description="Extract and categorize skills from job descriptions"
                    ),
                    AgentCapability(
                        name="Gap Analysis",
                        description="Identify skill gaps and prioritize learning"
                    ),
                    AgentCapability(
                        name="Learning Roadmap",
                        description="Create personalized learning paths with resources"
                    ),
                ],
                has_tools=False,
                tools=[],
            ),
            AgentInfo(
                id="interview_coach",
                name="Interview Preparation Coach",
                role="Interview Preparation Coach",
                goal="Prepare candidates with interview questions and strategies",
                capabilities=[
                    AgentCapability(
                        name="Question Generation",
                        description="Generate likely interview questions based on job requirements"
                    ),
                    AgentCapability(
                        name="Answer Coaching",
                        description="Provide STAR method guidance and answer frameworks"
                    ),
                    AgentCapability(
                        name="Company Research",
                        description="Prepare company-specific talking points"
                    ),
                ],
                has_tools=False,
                tools=[],
            ),
            AgentInfo(
                id="career_advisor",
                name="Career Strategy Advisor",
                role="Career Strategy Advisor",
                goal="Provide strategic career advice for job applications",
                capabilities=[
                    AgentCapability(
                        name="Resume Optimization",
                        description="ATS optimization and keyword integration"
                    ),
                    AgentCapability(
                        name="LinkedIn Optimization",
                        description="Profile optimization for recruiter visibility"
                    ),
                    AgentCapability(
                        name="Application Strategy",
                        description="Application timing and follow-up guidance"
                    ),
                    AgentCapability(
                        name="Networking",
                        description="Networking strategies and outreach templates"
                    ),
                ],
                has_tools=False,
                tools=[],
            ),
        ]

        self._agents_cache = agents
        return agents


# =============================================================================
# SERVICE SINGLETON
# =============================================================================

# Global service instance
crew_service = CrewService()


def get_crew_service() -> CrewService:
    """Get the global CrewService instance."""
    return crew_service


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "CrewService",
    "get_crew_service",
    "job_store",
]
