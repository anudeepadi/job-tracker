"""
Task definitions for the Job Search AI Agent System.

This module defines all tasks that will be executed by the agents.
Tasks are the specific pieces of work that agents perform.

Author: Claude Builder Club @ UC Irvine
Workshop: Intro to AI Agents (October 20, 2025)
"""

from datetime import datetime
from crewai import Task, Agent
from typing import Dict, List

from src.config import OUTPUT_DIR


# =============================================================================
# TASK 1: JOB SEARCH TASK
# =============================================================================

def create_job_search_task(
    agent: Agent,
    role: str,
    location: str,
    num_results: int = 5
) -> Task:
    """
    Create the job search task.

    Args:
        agent: The agent that will execute this task
        role: Job role to search for
        location: Location for the search
        num_results: Number of results to return

    Returns:
        Task configured for job searching
    """

    return Task(
        description=f"""
Search for {num_results} job listings for "{role}" positions in {location}.

Your objective:
1. Use ALL available job search tools to find relevant job listings:
   - Job Search Tool (Adzuna - general job board)
   - LinkedIn Job Search Tool (professional network)
   - JSearch Tool (aggregates Indeed, Glassdoor, ZipRecruiter, etc.)
   - RemoteOK Tool (remote-first positions)
2. Review and filter the results for quality
3. Present the job listings in a clear, structured format

Make sure to capture:
- Job title and company name
- Location (remote, hybrid, or onsite)
- Salary range if available
- Key requirements and qualifications
- Application URL
- Source (which platform the job is from)

Format each job clearly so it can be analyzed by the Skills Advisor.
Note: Some tools may not be available if API keys aren't configured - that's okay, use what's available.
""",

        expected_output="""
A comprehensive list of {num_results} job listings with:
- Structured job information (title, company, location, salary)
- Clear descriptions of each role
- Application links
- Key requirements highlighted
""".format(num_results=num_results),

        agent=agent,

        output_file=str(OUTPUT_DIR / f"job_search_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"),
    )


# =============================================================================
# TASK 2: SKILLS ANALYSIS TASK
# =============================================================================

def create_skills_analysis_task(
    agent: Agent,
    role: str,
    job_search_task: Task
) -> Task:
    """
    Create the skills analysis task.

    Args:
        agent: The agent that will execute this task
        role: Job role being analyzed
        job_search_task: The job search task (for context)

    Returns:
        Task configured for skills analysis
    """

    return Task(
        description=f"""
Analyze the job listings found for "{role}" positions and create a comprehensive skills development roadmap.

Your objective:
1. Extract ALL required and preferred skills from each job listing
2. Categorize skills by type:
   - Technical skills (programming languages, frameworks, tools)
   - Soft skills (communication, leadership, teamwork)
   - Domain knowledge (industry-specific expertise)
   - Certifications (if mentioned)
3. Identify patterns and common requirements across listings
4. Prioritize skills by:
   - Frequency (how often mentioned)
   - Importance (required vs preferred)
   - Market demand
5. Create a learning roadmap with:
   - Specific courses, books, or tutorials
   - Estimated time to learn each skill
   - Practical projects to demonstrate competency

Format your response clearly with sections for each skill category.
""",

        expected_output="""
A comprehensive skills analysis including:
1. Complete list of required and preferred skills
2. Skills categorized by type
3. Prioritized learning roadmap with:
   - Skill name
   - Priority level (High/Medium/Low)
   - Learning resources (courses, books, tutorials)
   - Estimated learning time
   - Practice projects
4. Key insights about skill gaps and opportunities
""",

        agent=agent,
        context=[job_search_task],
        output_file=str(OUTPUT_DIR / f"skills_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"),
    )


# =============================================================================
# TASK 3: INTERVIEW PREPARATION TASK
# =============================================================================

def create_interview_prep_task(
    agent: Agent,
    role: str,
    job_search_task: Task,
    skills_task: Task
) -> Task:
    """
    Create the interview preparation task.

    Args:
        agent: The agent that will execute this task
        role: Job role being prepared for
        job_search_task: The job search task (for context)
        skills_task: The skills analysis task (for context)

    Returns:
        Task configured for interview preparation
    """

    return Task(
        description=f"""
Create comprehensive interview preparation materials for "{role}" positions based on the job listings and skills analysis.

Your objective:
1. Generate 8-10 likely interview questions per job listing, covering:
   - Technical questions based on required skills
   - Behavioral questions using STAR method format
   - Situational/problem-solving questions
   - Company/role-specific questions (why this company, why this role)

2. For each question, provide:
   - The question itself
   - What the interviewer is evaluating
   - How to structure your answer
   - Key points to mention
   - Sample response outline

3. Include general preparation tips:
   - Research strategies for each company
   - Questions to ask the interviewer
   - Common pitfalls to avoid
   - Body language and presentation tips

Format each question with clear guidance on how to answer effectively.
""",

        expected_output="""
Complete interview preparation package including:
1. 8-10 interview questions per job listing with:
   - Question text
   - What's being evaluated
   - Answer framework
   - Key talking points
   - Sample response outline
2. General preparation strategies
3. Questions to ask interviewers
4. Tips for success
""",

        agent=agent,
        context=[job_search_task, skills_task],
        output_file=str(OUTPUT_DIR / f"interview_prep_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"),
    )


# =============================================================================
# TASK 4: CAREER ADVISORY TASK
# =============================================================================

def create_career_advisory_task(
    agent: Agent,
    role: str,
    job_search_task: Task,
    skills_task: Task,
    interview_task: Task
) -> Task:
    """
    Create the career advisory task.

    Args:
        agent: The agent that will execute this task
        role: Job role for career advice
        job_search_task: The job search task (for context)
        skills_task: The skills analysis task (for context)
        interview_task: The interview prep task (for context)

    Returns:
        Task configured for career advisory
    """

    return Task(
        description=f"""
Provide strategic career advice for successfully applying to "{role}" positions.

Your objective:
1. Resume Optimization:
   - Identify critical keywords from the job descriptions
   - Suggest resume structure and section priorities
   - Provide bullet point templates using action verbs
   - Recommend quantifiable achievements to highlight

2. LinkedIn Profile Optimization:
   - Headline optimization for recruiter searches
   - About section storytelling framework
   - Experience description improvements
   - Skills section priorities
   - Networking and engagement strategies

3. Application Strategy:
   - Best practices for each company (referrals, direct applications)
   - Cover letter talking points specific to each role
   - Application timing recommendations
   - Follow-up cadence and templates

4. Networking:
   - Strategies for connecting with employees at target companies
   - Informational interview templates
   - LinkedIn outreach messages
   - Professional community recommendations

Tailor all advice to the specific requirements found in the job listings.
""",

        expected_output="""
Comprehensive career strategy including:
1. Resume optimization guide with:
   - Keyword list from job descriptions
   - Section-by-section recommendations
   - Achievement templates
2. LinkedIn profile improvement plan:
   - Headline examples
   - About section framework
   - Experience bullet templates
3. Application strategy:
   - Company-specific recommendations
   - Cover letter templates
   - Timeline and follow-up plan
4. Networking strategy:
   - Outreach templates
   - Community recommendations
   - Connection strategies
""",

        agent=agent,
        context=[job_search_task, skills_task, interview_task],
        output_file=str(OUTPUT_DIR / f"career_advisory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"),
    )


# =============================================================================
# TASK FACTORY FUNCTION
# =============================================================================

def create_all_tasks(
    agents: Dict[str, Agent],
    role: str,
    location: str,
    num_results: int = 5
) -> List[Task]:
    """
    Create all tasks for the job search crew.

    Args:
        agents: Dictionary of agents
        role: Job role to search for
        location: Location for the search
        num_results: Number of results to return

    Returns:
        List of tasks in execution order
    """

    # Create tasks in dependency order
    job_search_task = create_job_search_task(
        agent=agents['job_searcher'],
        role=role,
        location=location,
        num_results=num_results
    )

    skills_task = create_skills_analysis_task(
        agent=agents['skills_advisor'],
        role=role,
        job_search_task=job_search_task
    )

    interview_task = create_interview_prep_task(
        agent=agents['interview_coach'],
        role=role,
        job_search_task=job_search_task,
        skills_task=skills_task
    )

    career_task = create_career_advisory_task(
        agent=agents['career_advisor'],
        role=role,
        job_search_task=job_search_task,
        skills_task=skills_task,
        interview_task=interview_task
    )

    return [job_search_task, skills_task, interview_task, career_task]


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    'create_job_search_task',
    'create_skills_analysis_task',
    'create_interview_prep_task',
    'create_career_advisory_task',
    'create_all_tasks',
]
