"""Cover Letter Generation Agent using CrewAI."""

from crewai import Agent, Task


def create_cover_letter_agent() -> Agent:
    """
    Create a CrewAI agent specialized in cover letter writing.

    Returns:
        Agent configured for cover letter generation.
    """
    return Agent(
        role="Cover Letter Specialist",
        goal=(
            "Generate compelling, tailored cover letters that match "
            "candidate experience to job requirements"
        ),
        backstory=(
            "You are an expert cover letter writer with deep knowledge of "
            "hiring practices. You craft personalized cover letters that "
            "highlight relevant experience, demonstrate genuine interest in "
            "the company, and address specific job requirements. You avoid "
            "generic templates and create authentic, professional letters."
        ),
        verbose=False,
        allow_delegation=False,
    )


def create_cover_letter_task(
    agent: Agent,
    job_description: str,
    resume_text: str,
    company: str,
    role: str,
) -> Task:
    """
    Create a task for the cover letter agent.

    Args:
        agent: The cover letter agent to assign the task to.
        job_description: Full job description text.
        resume_text: Candidate's resume content.
        company: Target company name.
        role: Target job title/role.

    Returns:
        Task configured for cover letter generation.
    """
    return Task(
        description=f"""Generate a tailored cover letter for the following:

Company: {company}
Role: {role}

Job Description:
{job_description}

Candidate Resume:
{resume_text}

Write a professional cover letter that:
1. Opens with a compelling hook specific to the company
2. Highlights 2-3 most relevant experiences from the resume
3. Addresses specific requirements from the job description
4. Shows genuine interest in the company and role
5. Closes with a clear call to action

Output ONLY the cover letter text, no metadata or explanations.""",
        expected_output="A professional, tailored cover letter",
        agent=agent,
    )
