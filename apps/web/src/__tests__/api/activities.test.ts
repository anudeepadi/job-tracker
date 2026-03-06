import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findFirst: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import {
  GET,
  POST,
} from "@/app/api/applications/[id]/activities/route";

const mockActivity = {
  id: "activity-1",
  applicationId: "app-1",
  type: "Interview",
  description: "Phone screen with hiring manager",
  date: new Date("2026-03-05T14:00:00Z"),
};

const mockApplication = {
  id: "app-1",
  userId: "user-123",
  company: "TechCorp",
  jobTitle: "Software Engineer",
};

describe("Activities API - /api/applications/[id]/activities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/applications/[id]/activities", () => {
    it("returns 401 if x-user-id header is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 if application does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/nonexistent/activities",
        { headers: { "x-user-id": "user-123" } },
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Application not found");
    });

    it("returns 404 if user does not own the application", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        { headers: { "x-user-id": "different-user" } },
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns activities for a valid application", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(
        mockApplication as any,
      );
      vi.mocked(prisma.activity.findMany).mockResolvedValue([
        mockActivity,
      ] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        { headers: { "x-user-id": "user-123" } },
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("activities");
      expect(data.activities).toHaveLength(1);
      expect(data.activities[0].type).toBe("Interview");
    });

    it("verifies ownership by passing userId to findFirst", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(
        mockApplication as any,
      );
      vi.mocked(prisma.activity.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        { headers: { "x-user-id": "user-123" } },
      );
      await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(prisma.application.findFirst).toHaveBeenCalledWith({
        where: { id: "app-1", userId: "user-123" },
      });
    });

    it("filters activities by type query parameter", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(
        mockApplication as any,
      );
      vi.mocked(prisma.activity.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities?type=Interview",
        { headers: { "x-user-id": "user-123" } },
      );
      await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicationId: "app-1", type: "Interview" },
        }),
      );
    });

    it("respects limit parameter", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(
        mockApplication as any,
      );
      vi.mocked(prisma.activity.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities?limit=5",
        { headers: { "x-user-id": "user-123" } },
      );
      await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it("returns 500 on database error", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockRejectedValue(
        new Error("Connection refused"),
      );

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        { headers: { "x-user-id": "user-123" } },
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch activities");
    });
  });

  describe("POST /api/applications/[id]/activities", () => {
    it("returns 401 if x-user-id header is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        {
          method: "POST",
          body: JSON.stringify({
            type: "Interview",
            description: "Phone screen",
            date: "2026-03-05T14:00:00Z",
          }),
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for missing type field", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({
            description: "Phone screen",
            date: "2026-03-05T14:00:00Z",
          }),
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("returns 400 for missing description field", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({
            type: "Interview",
            date: "2026-03-05T14:00:00Z",
          }),
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("returns 400 for missing date field", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({
            type: "Interview",
            description: "Phone screen",
          }),
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 404 if application does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/applications/nonexistent/activities",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({
            type: "Interview",
            description: "Phone screen",
            date: "2026-03-05T14:00:00Z",
          }),
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Application not found");
    });

    it("creates activity with valid data", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(
        mockApplication as any,
      );
      vi.mocked(prisma.activity.create).mockResolvedValue(
        mockActivity as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({
            type: "Interview",
            description: "Phone screen with hiring manager",
            date: "2026-03-05T14:00:00Z",
          }),
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.type).toBe("Interview");
      expect(data.description).toBe("Phone screen with hiring manager");
    });

    it("passes correct data to prisma create", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findFirst).mockResolvedValue(
        mockApplication as any,
      );
      vi.mocked(prisma.activity.create).mockResolvedValue(
        mockActivity as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1/activities",
        {
          method: "POST",
          headers: { "x-user-id": "user-123" },
          body: JSON.stringify({
            type: "Note",
            description: "Sent follow-up email",
            date: "2026-03-05T14:00:00Z",
          }),
        },
      );
      await POST(request, {
        params: Promise.resolve({ id: "app-1" }),
      });

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          applicationId: "app-1",
          type: "Note",
          description: "Sent follow-up email",
          date: expect.any(Date),
        },
      });
    });
  });
});
