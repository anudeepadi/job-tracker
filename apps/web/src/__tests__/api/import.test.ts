import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    jobResult: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

import { POST as POST_OPT } from "@/app/api/import/opt-results/route";
import { POST as POST_BULK } from "@/app/api/job-results/bulk-import/route";

describe("Import APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/import/opt-results", () => {
    it("returns 400 for empty body", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/import/opt-results",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await POST_OPT(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Missing markdown");
    });

    it("returns 400 for empty markdown string", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/import/opt-results",
        {
          method: "POST",
          body: JSON.stringify({ markdown: "   " }),
        },
      );

      const response = await POST_OPT(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Missing markdown");
    });

    it("returns 400 when markdown has no parseable jobs", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/import/opt-results",
        {
          method: "POST",
          body: JSON.stringify({ markdown: "Just some random text with no jobs" }),
        },
      );

      const response = await POST_OPT(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("No jobs found");
    });

    it("successfully parses and imports markdown with jobs", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });

      // Mock $transaction to execute the callback
      vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
        return cb({
          application: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "new-app-1" }),
          },
          activity: {
            create: vi.fn().mockResolvedValue({ id: "activity-1" }),
          },
        });
      });

      const markdown = `
1. **Senior Data Scientist** ⭐
   Company: DataCorp
   Apply: https://example.com/apply/123

2. **ML Engineer**
   Company: AIStartup
   Apply: https://example.com/apply/456
`;

      const request = new NextRequest(
        "http://localhost:3000/api/import/opt-results",
        {
          method: "POST",
          body: JSON.stringify({ markdown }),
        },
      );

      const response = await POST_OPT(request);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
      expect(data.parsed).toBe(2);
      expect(data).toHaveProperty("created");
      expect(data).toHaveProperty("skipped");
    });

    it("handles request with non-JSON body gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/import/opt-results",
        {
          method: "POST",
          body: "not json at all",
          headers: { "Content-Type": "text/plain" },
        },
      );

      const response = await POST_OPT(request);
      // Should return 400 since markdown will be empty
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/job-results/bulk-import", () => {
    it("returns 401 if x-user-id header is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/job-results/bulk-import",
        {
          method: "POST",
          body: JSON.stringify({ jobResultIds: ["jr-1"] }),
        },
      );

      const response = await POST_BULK(request);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for empty jobResultIds array", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/job-results/bulk-import",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({ jobResultIds: [] }),
        },
      );

      const response = await POST_BULK(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("jobResultIds must be a non-empty array");
    });

    it("returns 400 when jobResultIds is not an array", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/job-results/bulk-import",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({ jobResultIds: "not-an-array" }),
        },
      );

      const response = await POST_BULK(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("jobResultIds must be a non-empty array");
    });

    it("returns 404 when no job results are found", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.jobResult.findMany).mockResolvedValue([] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/job-results/bulk-import",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({ jobResultIds: ["nonexistent-1"] }),
        },
      );

      const response = await POST_BULK(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("No job results found");
    });

    it("imports job results successfully", async () => {
      const { prisma } = await import("@/lib/prisma");

      const mockJobResults = [
        {
          id: "jr-1",
          company: "TechCorp",
          title: "Developer",
          location: "Remote",
          remote: true,
          applyUrl: "https://example.com/apply",
          sourceUrl: null,
          salary: "$100k-$150k",
          jobType: "Full-time",
          postedDate: "2026-03-01",
          description: "Build things",
          searchId: "search-1",
          importedAsApplicationId: null,
          search: { id: "search-1" },
        },
      ];

      vi.mocked(prisma.jobResult.findMany).mockResolvedValue(
        mockJobResults as any,
      );

      // No existing apps for duplicate check
      vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
        return cb({
          application: {
            create: vi.fn().mockResolvedValue({ id: "new-app-1" }),
          },
          jobResult: {
            update: vi.fn().mockResolvedValue({}),
          },
          activity: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      const request = new NextRequest(
        "http://localhost:3000/api/job-results/bulk-import",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({ jobResultIds: ["jr-1"] }),
        },
      );

      const response = await POST_BULK(request);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data).toHaveProperty("summary");
      expect(data.summary.total).toBe(1);
    });

    it("skips already imported job results", async () => {
      const { prisma } = await import("@/lib/prisma");

      const mockJobResults = [
        {
          id: "jr-1",
          company: "TechCorp",
          title: "Developer",
          importedAsApplicationId: "existing-app-1", // Already imported
          searchId: "search-1",
          search: { id: "search-1" },
        },
      ];

      vi.mocked(prisma.jobResult.findMany).mockResolvedValue(
        mockJobResults as any,
      );
      vi.mocked(prisma.application.findMany).mockResolvedValue([] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/job-results/bulk-import",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({ jobResultIds: ["jr-1"] }),
        },
      );

      const response = await POST_BULK(request);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.summary.skipped).toBe(1);
      expect(data.summary.imported).toBe(0);
    });
  });
});
