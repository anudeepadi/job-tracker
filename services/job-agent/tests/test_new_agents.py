"""
Tests for the new specialized CrewAI agents and their schemas.

Covers:
- Cover Letter Agent (B2)
- Follow-up Email Agent (B3)
- Networking Strategy Agent (B5)
- Request/response model validation
"""

import pytest
from datetime import datetime
from crewai import Agent, Task
from pydantic import ValidationError

from app.agents.cover_letter_agent import (
    create_cover_letter_agent,
    create_cover_letter_task,
)
from app.agents.followup_agent import (
    create_followup_agent,
    create_followup_task,
)
from app.agents.networking_agent import (
    create_networking_agent,
    create_networking_task,
)
from app.models.schemas import (
    CoverLetterRequest,
    CoverLetterResponse,
    FollowupEmailRequest,
    FollowupEmailResponse,
    NetworkResearchRequest,
    NetworkResearchResponse,
)


# =============================================================================
# COVER LETTER AGENT TESTS
# =============================================================================


class TestCoverLetterAgent:
    """Tests for cover letter agent creation and task setup."""

    def test_create_cover_letter_agent_returns_agent(self):
        """Cover letter agent factory returns a valid Agent."""
        agent = create_cover_letter_agent()
        assert isinstance(agent, Agent)

    def test_cover_letter_agent_has_correct_role(self):
        """Cover letter agent has the expected role."""
        agent = create_cover_letter_agent()
        assert agent.role == "Cover Letter Specialist"

    def test_cover_letter_agent_no_delegation(self):
        """Cover letter agent should not delegate tasks."""
        agent = create_cover_letter_agent()
        assert agent.allow_delegation is False

    def test_create_cover_letter_task_returns_task(self):
        """Cover letter task factory returns a valid Task."""
        agent = create_cover_letter_agent()
        task = create_cover_letter_task(
            agent=agent,
            job_description="We need a Python developer",
            resume_text="5 years of Python experience",
            company="Acme Corp",
            role="Python Developer",
        )
        assert isinstance(task, Task)

    def test_cover_letter_task_description_includes_inputs(self):
        """Task description should include all provided inputs."""
        agent = create_cover_letter_agent()
        task = create_cover_letter_task(
            agent=agent,
            job_description="Looking for React expertise",
            resume_text="Built 10 React applications",
            company="TechStart",
            role="Frontend Engineer",
        )
        desc = task.description
        assert "TechStart" in desc
        assert "Frontend Engineer" in desc
        assert "Looking for React expertise" in desc
        assert "Built 10 React applications" in desc


# =============================================================================
# FOLLOW-UP EMAIL AGENT TESTS
# =============================================================================


class TestFollowupAgent:
    """Tests for follow-up email agent creation and task setup."""

    def test_create_followup_agent_returns_agent(self):
        """Follow-up agent factory returns a valid Agent."""
        agent = create_followup_agent()
        assert isinstance(agent, Agent)

    def test_followup_agent_has_correct_role(self):
        """Follow-up agent has the expected role."""
        agent = create_followup_agent()
        assert agent.role == "Follow-up Email Specialist"

    def test_followup_agent_no_delegation(self):
        """Follow-up agent should not delegate tasks."""
        agent = create_followup_agent()
        assert agent.allow_delegation is False

    def test_create_followup_task_returns_task(self):
        """Follow-up task factory returns a valid Task."""
        agent = create_followup_agent()
        task = create_followup_task(
            agent=agent,
            company="BigCorp",
            role="Data Engineer",
            application_date="2026-02-15",
        )
        assert isinstance(task, Task)

    def test_followup_task_includes_previous_contact(self):
        """Task description should include previous contact notes when provided."""
        agent = create_followup_agent()
        task = create_followup_task(
            agent=agent,
            company="BigCorp",
            role="Data Engineer",
            application_date="2026-02-15",
            previous_contact="Spoke with recruiter Jane on 2026-02-20",
        )
        assert "Spoke with recruiter Jane" in task.description

    def test_followup_task_handles_no_previous_contact(self):
        """Task description should handle missing previous contact gracefully."""
        agent = create_followup_agent()
        task = create_followup_task(
            agent=agent,
            company="BigCorp",
            role="Data Engineer",
            application_date="2026-02-15",
        )
        assert "No previous follow-up communication" in task.description


# =============================================================================
# NETWORKING AGENT TESTS
# =============================================================================


class TestNetworkingAgent:
    """Tests for networking strategy agent creation and task setup."""

    def test_create_networking_agent_returns_agent(self):
        """Networking agent factory returns a valid Agent."""
        agent = create_networking_agent()
        assert isinstance(agent, Agent)

    def test_networking_agent_has_correct_role(self):
        """Networking agent has the expected role."""
        agent = create_networking_agent()
        assert agent.role == "Networking Strategy Advisor"

    def test_networking_agent_no_delegation(self):
        """Networking agent should not delegate tasks."""
        agent = create_networking_agent()
        assert agent.allow_delegation is False

    def test_create_networking_task_returns_task(self):
        """Networking task factory returns a valid Task."""
        agent = create_networking_agent()
        task = create_networking_task(
            agent=agent,
            company="Google",
            role="ML Engineer",
        )
        assert isinstance(task, Task)

    def test_networking_task_includes_industry(self):
        """Task description should include industry when provided."""
        agent = create_networking_agent()
        task = create_networking_task(
            agent=agent,
            company="Google",
            role="ML Engineer",
            industry="Artificial Intelligence",
        )
        assert "Artificial Intelligence" in task.description

    def test_networking_task_handles_no_industry(self):
        """Task description should not crash when industry is omitted."""
        agent = create_networking_agent()
        task = create_networking_task(
            agent=agent,
            company="Google",
            role="ML Engineer",
        )
        assert "Google" in task.description
        assert "ML Engineer" in task.description


# =============================================================================
# REQUEST MODEL VALIDATION TESTS
# =============================================================================


class TestCoverLetterRequestModel:
    """Tests for CoverLetterRequest validation."""

    def test_valid_request(self):
        """Valid data passes validation."""
        req = CoverLetterRequest(
            job_description="Build REST APIs",
            resume_text="5 years backend experience",
            company="Acme",
            role="Backend Dev",
        )
        assert req.company == "Acme"

    def test_missing_job_description_raises(self):
        """Missing job_description should raise ValidationError."""
        with pytest.raises(ValidationError):
            CoverLetterRequest(
                resume_text="resume",
                company="Acme",
                role="Dev",
            )

    def test_empty_company_raises(self):
        """Empty company string should raise ValidationError."""
        with pytest.raises(ValidationError):
            CoverLetterRequest(
                job_description="desc",
                resume_text="resume",
                company="",
                role="Dev",
            )


class TestFollowupEmailRequestModel:
    """Tests for FollowupEmailRequest validation."""

    def test_valid_request_without_previous_contact(self):
        """Valid data without optional field passes validation."""
        req = FollowupEmailRequest(
            company="Corp",
            role="SWE",
            application_date="2026-02-15",
        )
        assert req.previous_contact is None

    def test_valid_request_with_previous_contact(self):
        """Valid data with optional field passes validation."""
        req = FollowupEmailRequest(
            company="Corp",
            role="SWE",
            application_date="2026-02-15",
            previous_contact="Called on Monday",
        )
        assert req.previous_contact == "Called on Monday"

    def test_missing_application_date_raises(self):
        """Missing application_date should raise ValidationError."""
        with pytest.raises(ValidationError):
            FollowupEmailRequest(
                company="Corp",
                role="SWE",
            )


class TestNetworkResearchRequestModel:
    """Tests for NetworkResearchRequest validation."""

    def test_valid_request_without_industry(self):
        """Valid data without optional industry passes."""
        req = NetworkResearchRequest(company="Stripe", role="SRE")
        assert req.industry is None

    def test_valid_request_with_industry(self):
        """Valid data with industry passes."""
        req = NetworkResearchRequest(
            company="Stripe",
            role="SRE",
            industry="FinTech",
        )
        assert req.industry == "FinTech"

    def test_missing_company_raises(self):
        """Missing company should raise ValidationError."""
        with pytest.raises(ValidationError):
            NetworkResearchRequest(role="SRE")


# =============================================================================
# RESPONSE MODEL VALIDATION TESTS
# =============================================================================


class TestResponseModels:
    """Tests for response model serialization."""

    def test_cover_letter_response(self):
        """CoverLetterResponse serializes correctly."""
        now = datetime.utcnow()
        resp = CoverLetterResponse(
            cover_letter="Dear hiring manager...",
            generated_at=now,
        )
        assert resp.cover_letter == "Dear hiring manager..."
        assert resp.generated_at == now

    def test_followup_email_response(self):
        """FollowupEmailResponse serializes correctly."""
        now = datetime.utcnow()
        resp = FollowupEmailResponse(email="Subject: Following up", generated_at=now)
        assert "Following up" in resp.email

    def test_network_research_response(self):
        """NetworkResearchResponse serializes correctly."""
        now = datetime.utcnow()
        resp = NetworkResearchResponse(
            research="1. LINKEDIN SEARCH QUERIES...",
            generated_at=now,
        )
        assert "LINKEDIN" in resp.research


# =============================================================================
# AGENTS REGISTRATION TESTS
# =============================================================================


class TestAgentsRegistration:
    """Tests that new agents appear in crew_service.get_agents_info()."""

    def test_new_agents_registered(self):
        """All three new agents should be in get_agents_info()."""
        from app.services.crew_service import CrewService

        service = CrewService()
        agents = service.get_agents_info()
        agent_ids = [a.id for a in agents]

        assert "cover_letter_specialist" in agent_ids
        assert "followup_specialist" in agent_ids
        assert "networking_advisor" in agent_ids

    def test_total_agent_count(self):
        """Total agent count should be 7 (4 original + 3 new)."""
        from app.services.crew_service import CrewService

        service = CrewService()
        agents = service.get_agents_info()
        assert len(agents) == 7
