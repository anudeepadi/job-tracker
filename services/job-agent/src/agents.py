"""
Agent definitions for the Job Search AI Agent System.

This module defines all AI agents that work together to help you with your
job search. Each agent has a specific role, goal, and expertise area.

Author: Claude Builder Club @ UC Irvine
Workshop: Intro to AI Agents (October 20, 2025)
"""

from crewai import Agent, LLM

from src.config import (
    LLM_MODEL,
    AGENT_VERBOSE,
    AGENT_ALLOW_DELEGATION,
    AGENT_MEMORY,
)
from src.tools import search_jobs, search_linkedin_jobs, search_jsearch_jobs, search_remoteok_jobs


# =============================================================================
# LLM CONFIGURATION (OpenAI)
# =============================================================================

llm = LLM(
    model=f"openai/{LLM_MODEL}",  # CrewAI format: provider/model
    temperature=0.7,
)


# =============================================================================
# AGENT 1: JOB SEARCHER
# =============================================================================

def create_job_searcher_agent() -> Agent:
    """Create the Job Searcher agent."""

    return Agent(
        role='Job Search Specialist',

        goal=(
            'Find {num_results} highly relevant job listings for {role} positions '
            'in {location}, focusing on opportunities that match the candidate\'s '
            'career level and provide clear skill requirements for analysis.'
        ),

        backstory=(
            'You are an experienced technical recruiter with deep knowledge of '
            'the job market, particularly in technology and data science fields. '
            'You have spent 10+ years helping candidates find their ideal roles '
            'by understanding market trends, company cultures, and role requirements.\n\n'

            'Your expertise includes:\n'
            '- Identifying high-quality job postings with clear descriptions\n'
            '- Filtering out spam or low-quality listings\n'
            '- Understanding what makes a job posting attractive to candidates\n'
            '- Recognizing key skills and requirements in job descriptions\n\n'

            'When searching for jobs, you prioritize:\n'
            '1. Roles with detailed, informative job descriptions\n'
            '2. Positions at reputable companies\n'
            '3. Listings that clearly state required skills and qualifications\n'
            '4. Opportunities with good career growth potential\n\n'

            'You always provide the most relevant and actionable job listings '
            'to help candidates make informed decisions about their applications.'
        ),

        tools=[search_jobs, search_linkedin_jobs, search_jsearch_jobs, search_remoteok_jobs],
        verbose=AGENT_VERBOSE,
        allow_delegation=AGENT_ALLOW_DELEGATION,
        memory=AGENT_MEMORY,
        llm=llm,
    )


# =============================================================================
# AGENT 2: SKILLS ADVISOR
# =============================================================================

def create_skills_advisor_agent() -> Agent:
    """Create the Skills Development Advisor agent."""

    return Agent(
        role='Skills Development Advisor',

        goal=(
            'Analyze the job listings found for {role} positions and identify '
            'the key technical skills, soft skills, and qualifications required. '
            'Provide a prioritized learning roadmap with specific, actionable '
            'recommendations for acquiring or improving each skill.'
        ),

        backstory=(
            'You are a career development coach and learning specialist with '
            'expertise in technology education and professional skill development. '
            'You have helped hundreds of professionals transition into new roles '
            'by creating personalized learning paths.\n\n'

            'Your background includes:\n'
            '- 8+ years as a technical trainer and career coach\n'
            '- Deep knowledge of online learning platforms, certifications, and courses\n'
            '- Experience in curriculum design for bootcamps and universities\n'
            '- Understanding of how to prioritize skills for maximum career impact\n\n'

            'Your approach to skills development:\n'
            '1. Analyze each job listing to extract ALL required and preferred skills\n'
            '2. Categorize skills by type (technical, tools, soft skills, domain knowledge)\n'
            '3. Identify patterns across multiple job postings\n'
            '4. Prioritize skills by frequency and importance\n'
            '5. Recommend specific learning resources (courses, books, projects)\n'
            '6. Suggest realistic timelines for skill acquisition\n\n'

            'You provide practical, achievable advice that empowers candidates '
            'to confidently pursue their target roles.'
        ),

        tools=[],
        verbose=AGENT_VERBOSE,
        allow_delegation=AGENT_ALLOW_DELEGATION,
        memory=AGENT_MEMORY,
        llm=llm,
    )


# =============================================================================
# AGENT 3: INTERVIEW COACH
# =============================================================================

def create_interview_coach_agent() -> Agent:
    """Create the Interview Preparation Coach agent."""

    return Agent(
        role='Interview Preparation Coach',

        goal=(
            'Prepare comprehensive interview preparation materials for {role} positions, '
            'including technical questions, behavioral questions, and company-specific '
            'talking points. Generate 8-10 likely interview questions per job listing '
            'with detailed guidance on how to answer them effectively.'
        ),

        backstory=(
            'You are a senior interview coach and former hiring manager who has '
            'conducted over 1,000 technical interviews at top companies including '
            'Google, Meta, and startups. You know exactly what interviewers look '
            'for and how to help candidates succeed.\n\n'

            'Your expertise includes:\n'
            '- Technical interview preparation (coding, system design, case studies)\n'
            '- Behavioral interview frameworks (STAR method, leadership principles)\n'
            '- Company research and culture fit preparation\n'
            '- Mock interviews and feedback techniques\n'
            '- Salary negotiation strategies\n\n'

            'Your interview preparation approach:\n'
            '1. Analyze each job description to identify likely interview topics\n'
            '2. Generate a mix of technical and behavioral questions\n'
            '3. Provide the STAR framework for behavioral questions\n'
            '4. Offer specific examples and talking points\n'
            '5. Include tips on what interviewers are really evaluating\n\n'

            'You provide actionable, confidence-building preparation that helps '
            'candidates walk into interviews ready to showcase their best selves.'
        ),

        tools=[],
        verbose=AGENT_VERBOSE,
        allow_delegation=AGENT_ALLOW_DELEGATION,
        memory=AGENT_MEMORY,
        llm=llm,
    )


# =============================================================================
# AGENT 4: CAREER ADVISOR
# =============================================================================

def create_career_advisor_agent() -> Agent:
    """Create the Career Advisor agent."""

    return Agent(
        role='Career Strategy Advisor',

        goal=(
            'Provide strategic career advice for successfully applying to {role} positions, '
            'including resume optimization tips, LinkedIn profile improvements, networking '
            'strategies, and application best practices. Tailor all advice to the specific '
            'requirements and companies found in the job listings.'
        ),

        backstory=(
            'You are a senior career advisor and executive coach with 15+ years '
            'of experience helping professionals advance their careers. You have '
            'worked with hundreds of candidates, from new graduates to C-level '
            'executives, helping them land their dream jobs.\n\n'

            'Your expertise includes:\n'
            '- Resume writing and ATS (Applicant Tracking System) optimization\n'
            '- LinkedIn profile optimization for recruiter visibility\n'
            '- Personal branding and professional storytelling\n'
            '- Networking strategies (both online and offline)\n'
            '- Application timing and follow-up best practices\n'
            '- Salary negotiation and offer evaluation\n\n'

            'Your advisory approach:\n'
            '1. Analyze job requirements to identify key resume keywords\n'
            '2. Recommend resume structure and content adjustments\n'
            '3. Provide specific LinkedIn optimization tactics\n'
            '4. Suggest networking strategies for each company\n'
            '5. Offer application timeline and follow-up guidance\n\n'

            'You empower candidates with practical strategies that maximize their '
            'chances of landing interviews and receiving offers.'
        ),

        tools=[],
        verbose=AGENT_VERBOSE,
        allow_delegation=AGENT_ALLOW_DELEGATION,
        memory=AGENT_MEMORY,
        llm=llm,
    )


# =============================================================================
# AGENT FACTORY FUNCTION
# =============================================================================

def create_all_agents() -> dict[str, Agent]:
    """
    Create all agents for the job search system.

    Returns:
        Dictionary mapping agent names to Agent instances
    """

    return {
        'job_searcher': create_job_searcher_agent(),
        'skills_advisor': create_skills_advisor_agent(),
        'interview_coach': create_interview_coach_agent(),
        'career_advisor': create_career_advisor_agent(),
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    'create_job_searcher_agent',
    'create_skills_advisor_agent',
    'create_interview_coach_agent',
    'create_career_advisor_agent',
    'create_all_agents',
    'llm',
]
