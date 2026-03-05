"""Networking Strategy Agent using CrewAI."""

from typing import Optional

from crewai import Agent, Task


def create_networking_agent() -> Agent:
    """
    Create a CrewAI agent specialized in networking strategy.

    Returns:
        Agent configured for networking research and suggestions.
    """
    return Agent(
        role="Networking Strategy Advisor",
        goal=(
            "Provide actionable networking strategies and research to help "
            "candidates build meaningful professional connections at target "
            "companies"
        ),
        backstory=(
            "You are a career networking expert who understands how to build "
            "genuine professional relationships. You know how to research "
            "companies, identify key contacts, find relevant events, and "
            "craft authentic conversation starters. You focus on building "
            "real connections rather than transactional networking."
        ),
        verbose=False,
        allow_delegation=False,
    )


def create_networking_task(
    agent: Agent,
    company: str,
    role: str,
    industry: Optional[str] = None,
) -> Task:
    """
    Create a task for the networking strategy agent.

    Args:
        agent: The networking agent to assign the task to.
        company: Target company to research.
        role: Target job title/role.
        industry: Optional industry context.

    Returns:
        Task configured for networking research.
    """
    industry_context = (
        f"\nIndustry: {industry}" if industry else ""
    )

    return Task(
        description=f"""Research and provide networking strategies for the following target:

Company: {company}
Role: {role}{industry_context}

Provide actionable networking guidance organized into these sections:

1. LINKEDIN SEARCH QUERIES
   - 3-5 specific LinkedIn search queries to find relevant contacts at or connected to the company

2. KEY ROLES TO CONNECT WITH
   - 5-7 specific job titles/roles of people who would be valuable connections
   - Brief explanation of why each role matters

3. RELEVANT EVENTS & COMMUNITIES
   - Types of industry events, meetups, or online communities where employees might be found
   - Specific conference names or community suggestions if applicable

4. CONVERSATION STARTERS
   - 3-5 natural, authentic conversation starters for cold outreach
   - Each should be personalized to the company/role context

5. OUTREACH STRATEGY
   - Step-by-step approach for initial outreach
   - Timeline recommendations
   - Do's and don'ts

Format each section with clear headers and bullet points.""",
        expected_output=(
            "Structured networking strategy with LinkedIn queries, "
            "key roles, events, conversation starters, and outreach strategy"
        ),
        agent=agent,
    )
