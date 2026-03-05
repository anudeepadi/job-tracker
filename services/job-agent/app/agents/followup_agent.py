"""Follow-up Email Generation Agent using CrewAI."""

from typing import Optional

from crewai import Agent, Task


def create_followup_agent() -> Agent:
    """
    Create a CrewAI agent specialized in follow-up email writing.

    Returns:
        Agent configured for follow-up email generation.
    """
    return Agent(
        role="Follow-up Email Specialist",
        goal=(
            "Draft professional, concise follow-up emails that maintain "
            "candidate visibility without being pushy or intrusive"
        ),
        backstory=(
            "You are an expert in professional communication and job search "
            "etiquette. You understand the fine line between persistence and "
            "pushiness. You craft follow-up emails that are brief, respectful, "
            "and strategically timed to maximize the candidate's chances of "
            "getting a response. You adapt tone and urgency based on the time "
            "elapsed since the original application."
        ),
        verbose=False,
        allow_delegation=False,
    )


def create_followup_task(
    agent: Agent,
    company: str,
    role: str,
    application_date: str,
    previous_contact: Optional[str] = None,
) -> Task:
    """
    Create a task for the follow-up email agent.

    Args:
        agent: The follow-up email agent to assign the task to.
        company: Company name the candidate applied to.
        role: Job title the candidate applied for.
        application_date: Date the application was submitted (ISO string).
        previous_contact: Optional notes about prior communication.

    Returns:
        Task configured for follow-up email generation.
    """
    previous_context = (
        f"\nPrevious Contact Notes:\n{previous_contact}"
        if previous_contact
        else "\nNo previous follow-up communication."
    )

    return Task(
        description=f"""Draft a professional follow-up email for the following application:

Company: {company}
Role: {role}
Application Date: {application_date}
{previous_context}

Write a follow-up email that:
1. Has a clear, professional subject line
2. References the specific role and application date
3. Briefly reiterates interest and key qualifications
4. Is concise (under 150 words for the body)
5. Has a polite, non-pushy tone appropriate for the time elapsed
6. Includes a clear but gentle call to action

Format the output as:
Subject: [subject line]

[email body]

Output ONLY the email, no metadata or explanations.""",
        expected_output="A professional follow-up email with subject line and body",
        agent=agent,
    )
