import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/applications/stats/route";

describe("Stats API - GET /api/applications/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if x-user-id header is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns stats with expected shape for authenticated user", async () => {
    const { prisma } = await import("@/lib/prisma");

    // Mock Promise.all results: [totalApplications, statusCounts, weeklyStats, monthlyStats, sourceStats]
    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(25 as any) // totalApplications
      .mockResolvedValueOnce(10 as any) // weeklyStats
      .mockResolvedValueOnce(20 as any); // monthlyStats

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([
        { status: "Applied", _count: { id: 10 } },
        { status: "Phone Screen", _count: { id: 5 } },
        { status: "Technical Interview", _count: { id: 3 } },
        { status: "Offer", _count: { id: 2 } },
        { status: "Rejected", _count: { id: 5 } },
      ] as any) // statusCounts
      .mockResolvedValueOnce([
        { source: "LinkedIn", _count: { id: 15 } },
        { source: "Indeed", _count: { id: 10 } },
      ] as any); // sourceStats

    // Mock findMany for recent applications
    vi.mocked(prisma.application.findMany).mockResolvedValue([
      {
        appliedDate: new Date("2026-02-15"),
        status: "Applied",
        source: "LinkedIn",
        salaryMin: 100000,
        salaryMax: 150000,
        currency: "USD",
      },
      {
        appliedDate: new Date("2026-02-20"),
        status: "Phone Screen",
        source: "LinkedIn",
        salaryMin: null,
        salaryMax: null,
        currency: null,
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("totalApplications");
    expect(data).toHaveProperty("statusCounts");
    expect(data).toHaveProperty("weeklyApplications");
    expect(data).toHaveProperty("monthlyApplications");
    expect(data).toHaveProperty("responseRate");
    expect(data).toHaveProperty("sourceStats");
    expect(data).toHaveProperty("timelineData");
    expect(data).toHaveProperty("weeklyTimelineData");
    expect(data).toHaveProperty("funnelData");
    expect(data).toHaveProperty("sourceResponseRate");
    expect(data).toHaveProperty("salaryAnalysis");
  });

  it("returns correct totalApplications count", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(42 as any)
      .mockResolvedValueOnce(5 as any)
      .mockResolvedValueOnce(15 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.totalApplications).toBe(42);
  });

  it("computes statusCounts as a flat map", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(10 as any)
      .mockResolvedValueOnce(3 as any)
      .mockResolvedValueOnce(8 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([
        { status: "Applied", _count: { id: 6 } },
        { status: "Offer", _count: { id: 4 } },
      ] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.statusCounts).toEqual({ Applied: 6, Offer: 4 });
  });

  it("computes funnelData from status counts", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(20 as any)
      .mockResolvedValueOnce(5 as any)
      .mockResolvedValueOnce(15 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([
        { status: "Applied", _count: { id: 10 } },
        { status: "Phone Screen", _count: { id: 4 } },
        { status: "Online Assessment", _count: { id: 1 } },
        { status: "Technical Interview", _count: { id: 3 } },
        { status: "Final Interview", _count: { id: 1 } },
        { status: "Offer", _count: { id: 1 } },
      ] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.funnelData).toEqual({
      applied: 20,
      screen: 5, // Phone Screen (4) + Online Assessment (1)
      interview: 4, // Technical Interview (3) + Final Interview (1)
      offer: 1,
    });
  });

  it("returns responseRate as a number", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(10 as any)
      .mockResolvedValueOnce(2 as any)
      .mockResolvedValueOnce(5 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([
        { status: "Applied", _count: { id: 7 } },
        { status: "Phone Screen", _count: { id: 2 } },
        { status: "Offer", _count: { id: 1 } },
      ] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(typeof data.responseRate).toBe("number");
    // responseRate = (Phone Screen + Tech Interview + Final Interview + Offer) / total * 100
    // = (2 + 0 + 0 + 1) / 10 * 100 = 30
    expect(data.responseRate).toBe(30);
  });

  it("returns 0 responseRate when no applications exist", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(0 as any)
      .mockResolvedValueOnce(0 as any)
      .mockResolvedValueOnce(0 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.responseRate).toBe(0);
    expect(data.totalApplications).toBe(0);
  });

  it("computes salaryAnalysis when salary data is present", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(2 as any)
      .mockResolvedValueOnce(1 as any)
      .mockResolvedValueOnce(2 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([
      {
        appliedDate: new Date("2026-02-15"),
        status: "Applied",
        source: "LinkedIn",
        salaryMin: 100000,
        salaryMax: 150000,
        currency: "USD",
      },
      {
        appliedDate: new Date("2026-02-20"),
        status: "Applied",
        source: "Indeed",
        salaryMin: 120000,
        salaryMax: 180000,
        currency: "USD",
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.salaryAnalysis).not.toBeNull();
    expect(data.salaryAnalysis.count).toBe(2);
    expect(data.salaryAnalysis.avgMin).toBe(110000);
    expect(data.salaryAnalysis.avgMax).toBe(165000);
    expect(data.salaryAnalysis.currency).toBe("USD");
  });

  it("returns null salaryAnalysis when no salary data exists", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count)
      .mockResolvedValueOnce(1 as any)
      .mockResolvedValueOnce(1 as any)
      .mockResolvedValueOnce(1 as any);

    vi.mocked(prisma.application.groupBy)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(prisma.application.findMany).mockResolvedValue([
      {
        appliedDate: new Date("2026-02-20"),
        status: "Applied",
        source: null,
        salaryMin: null,
        salaryMax: null,
        currency: null,
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.salaryAnalysis).toBeNull();
  });

  it("returns 500 on database error", async () => {
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.application.count).mockRejectedValue(
      new Error("Connection timeout"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/applications/stats",
      { headers: { "x-user-id": "user-123" } },
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch statistics");
    expect(data).toHaveProperty("details");
  });
});
