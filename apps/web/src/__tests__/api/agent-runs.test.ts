import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/agent-runs/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
    },
    jobSearch: {
      findMany: vi.fn(),
    },
  },
}));

const mockSearches = [
  {
    id: "search-1",
    role: "Software Engineer",
    location: "San Francisco",
    status: "completed",
    createdAt: new Date("2026-03-01T10:00:00Z"),
    completedAt: new Date("2026-03-01T10:05:00Z"),
    agentOutputs: [
      {
        id: "output-1",
        agentType: "job_searcher",
        output: "Found 5 results for Software Engineer in SF",
        createdAt: new Date("2026-03-01T10:05:00Z"),
      },
      {
        id: "output-2",
        agentType: "skills_advisor",
        output: "Key skills: React, TypeScript, Node.js",
        createdAt: new Date("2026-03-01T10:06:00Z"),
      },
    ],
    _count: { results: 5 },
  },
  {
    id: "search-2",
    role: "Product Manager",
    location: null,
    status: "running",
    createdAt: new Date("2026-03-02T12:00:00Z"),
    completedAt: null,
    agentOutputs: [],
    _count: { results: 0 },
  },
];

describe("GET /api/agent-runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if x-user-id header is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/agent-runs");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns agent runs for authenticated user", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.findMany).mockResolvedValue([
      { aiSearchId: "search-1" },
    ] as any);

    vi.mocked(prisma.jobSearch.findMany).mockResolvedValue(
      mockSearches as any,
    );

    const request = new NextRequest("http://localhost:3000/api/agent-runs", {
      headers: { "x-user-id": "user-123" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.agentRuns).toHaveLength(2);

    // First search
    expect(data.agentRuns[0].query).toBe("Software Engineer");
    expect(data.agentRuns[0].status).toBe("completed");
    expect(data.agentRuns[0].resultCount).toBe(5);
    expect(data.agentRuns[0].agentOutputs).toHaveLength(2);
    expect(data.agentRuns[0].agentOutputs[0].type).toBe("job_searcher");

    // Second search (running, no outputs)
    expect(data.agentRuns[1].query).toBe("Product Manager");
    expect(data.agentRuns[1].status).toBe("running");
    expect(data.agentRuns[1].agentOutputs).toHaveLength(0);
  });

  it("returns empty array when no linked searches exist", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.findMany).mockResolvedValue([]);
    vi.mocked(prisma.jobSearch.findMany).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/agent-runs", {
      headers: { "x-user-id": "user-123" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.agentRuns).toHaveLength(0);
  });

  it("handles prisma errors gracefully", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.findMany).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const request = new NextRequest("http://localhost:3000/api/agent-runs", {
      headers: { "x-user-id": "user-123" },
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch agent runs");
  });
});
