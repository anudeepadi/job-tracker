import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { AgentActivityPanel } from "@/components/dashboard/agent-activity-panel";
import { AgentRunCard } from "@/components/dashboard/agent-run-card";
import type { AgentRun } from "@/components/dashboard/agent-run-card";

// ── Test Data ──────────────────────────────────────────────────────

const mockRuns: AgentRun[] = [
  {
    id: "run-1",
    query: "Frontend Developer",
    location: "Remote",
    status: "completed",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resultCount: 8,
    agentOutputs: [
      {
        id: "out-1",
        type: "job_searcher",
        output: "Found 8 frontend developer positions",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "out-2",
        type: "skills_advisor",
        output: "Key skills: React, TypeScript, CSS",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "run-2",
    query: "Data Scientist",
    location: "New York",
    status: "running",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    resultCount: 0,
    agentOutputs: [],
  },
  {
    id: "run-3",
    query: "Backend Engineer",
    location: null,
    status: "failed",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    resultCount: 0,
    agentOutputs: [],
  },
];

// ── Tests ──────────────────────────────────────────────────────────

describe("AgentActivityPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders empty state when no runs exist", async () => {
    server.use(
      http.get("/api/agent-runs", () => {
        return HttpResponse.json({ agentRuns: [] });
      }),
    );

    render(<AgentActivityPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("agent-empty-state")).toBeDefined();
    });

    expect(
      screen.getByText(
        "No agent activity yet. Start a job search to see your AI agents in action.",
      ),
    ).toBeDefined();
  });

  it("renders agent run cards with status badges", async () => {
    server.use(
      http.get("/api/agent-runs", () => {
        return HttpResponse.json({ agentRuns: mockRuns });
      }),
    );

    render(<AgentActivityPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("agent-activity-list")).toBeDefined();
    });

    const cards = screen.getAllByTestId("agent-run-card");
    expect(cards).toHaveLength(3);

    const statuses = screen.getAllByTestId("agent-run-status");
    expect(statuses[0].textContent).toContain("Completed");
    expect(statuses[1].textContent).toContain("Running");
    expect(statuses[2].textContent).toContain("Failed");
  });

  it("renders search query as title on each card", async () => {
    server.use(
      http.get("/api/agent-runs", () => {
        return HttpResponse.json({ agentRuns: mockRuns });
      }),
    );

    render(<AgentActivityPanel />);

    await waitFor(() => {
      expect(screen.getByText("Frontend Developer")).toBeDefined();
    });

    expect(screen.getByText("Data Scientist")).toBeDefined();
    expect(screen.getByText("Backend Engineer")).toBeDefined();
  });

  it("shows error state on fetch failure", async () => {
    server.use(
      http.get("/api/agent-runs", () => {
        return HttpResponse.json(
          { error: "Server error" },
          { status: 500 },
        );
      }),
    );

    render(<AgentActivityPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch agent runs (500)"),
      ).toBeDefined();
    });

    expect(screen.getByText("Try again")).toBeDefined();
  });

  it("shows count of recent searches", async () => {
    server.use(
      http.get("/api/agent-runs", () => {
        return HttpResponse.json({ agentRuns: mockRuns });
      }),
    );

    render(<AgentActivityPanel />);

    await waitFor(() => {
      expect(screen.getByText("3 recent searches")).toBeDefined();
    });
  });
});

describe("AgentRunCard", () => {
  it("renders query, location, and status", () => {
    render(<AgentRunCard run={mockRuns[0]} />);

    expect(screen.getByText("Frontend Developer")).toBeDefined();
    expect(screen.getByText("Remote")).toBeDefined();
    expect(screen.getByText("8 jobs found")).toBeDefined();
  });

  it("renders agent output sections", () => {
    render(<AgentRunCard run={mockRuns[0]} />);

    expect(screen.getByText("Job Search Results")).toBeDefined();
    expect(screen.getByText("Skills Analysis")).toBeDefined();
  });

  it("shows running status with pulse animation class", () => {
    render(<AgentRunCard run={mockRuns[1]} />);

    const badge = screen.getByTestId("agent-run-status");
    expect(badge.textContent).toContain("Running");
    const pulseElement = badge.querySelector(".animate-pulse");
    expect(pulseElement).not.toBeNull();
  });

  it("handles run with no agent outputs", () => {
    render(<AgentRunCard run={mockRuns[2]} />);

    expect(screen.getByText("Backend Engineer")).toBeDefined();
    expect(screen.queryByText("Job Search Results")).toBeNull();
  });
});
