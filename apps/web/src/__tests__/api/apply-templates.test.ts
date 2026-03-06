import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    applyTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

import { GET, POST } from "@/app/api/apply-templates/route";
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/apply-templates/[id]/route";

const mockTemplate = {
  id: "template-1",
  userId: "user-123",
  name: "Default Application",
  personalInfo: '{"name":"John Doe","email":"john@example.com"}',
  coverLetter: "Dear Hiring Manager...",
  resumePath: "/resumes/john-doe.pdf",
  createdAt: new Date("2026-02-01T00:00:00Z"),
  updatedAt: new Date("2026-02-01T00:00:00Z"),
};

describe("Apply Templates API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/apply-templates", () => {
    it("returns 401 if not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Not authenticated");
    });

    it("returns templates for authenticated user", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findMany).mockResolvedValue([
        mockTemplate,
      ] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("templates");
      expect(data.templates).toHaveLength(1);
      expect(data.templates[0].name).toBe("Default Application");
    });

    it("queries templates with correct userId", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
      );
      await GET(request);

      expect(prisma.applyTemplate.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("returns empty array when no templates exist", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates).toEqual([]);
    });

    it("returns 500 on database error", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findMany).mockRejectedValue(
        new Error("DB error"),
      );

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch templates");
    });
  });

  describe("POST /api/apply-templates", () => {
    it("returns 401 if not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
        {
          method: "POST",
          body: JSON.stringify({ name: "My Template" }),
        },
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Not authenticated");
    });

    it("returns 400 for missing name", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
        {
          method: "POST",
          body: JSON.stringify({ coverLetter: "Dear..." }),
        },
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Template name is required");
    });

    it("creates template with valid data", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.create).mockResolvedValue(
        mockTemplate as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Default Application",
            personalInfo: { name: "John Doe", email: "john@example.com" },
            coverLetter: "Dear Hiring Manager...",
            resumePath: "/resumes/john-doe.pdf",
          }),
        },
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe("Default Application");
    });

    it("passes personalInfo as JSON string to prisma", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.create).mockResolvedValue(
        mockTemplate as any,
      );

      const personalInfo = { name: "John Doe", email: "john@example.com" };
      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
        {
          method: "POST",
          body: JSON.stringify({ name: "Template", personalInfo }),
        },
      );
      await POST(request);

      expect(prisma.applyTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          name: "Template",
          personalInfo: JSON.stringify(personalInfo),
        }),
      });
    });

    it("creates template with only name (optional fields null)", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.create).mockResolvedValue({
        ...mockTemplate,
        personalInfo: null,
        coverLetter: null,
        resumePath: null,
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates",
        {
          method: "POST",
          body: JSON.stringify({ name: "Minimal Template" }),
        },
      );
      await POST(request);

      expect(prisma.applyTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          personalInfo: null,
          coverLetter: null,
          resumePath: null,
        }),
      });
    });
  });

  describe("GET /api/apply-templates/[id]", () => {
    it("returns 401 if not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(401);
    });

    it("returns template for owner", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(
        mockTemplate as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("Default Application");
    });

    it("returns 404 for non-existent template", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/nonexistent",
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Template not found");
    });

    it("returns 403 if user does not own the template", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "different-user",
        email: "other@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(
        mockTemplate as any, // owned by user-123
      );

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("PUT /api/apply-templates/[id]", () => {
    it("returns 401 if not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(401);
    });

    it("updates template with new data", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(
        mockTemplate as any,
      );
      vi.mocked(prisma.applyTemplate.update).mockResolvedValue({
        ...mockTemplate,
        name: "Updated Template",
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated Template" }),
        },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("Updated Template");
    });

    it("returns 404 if template not found or not owned", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/nonexistent",
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/apply-templates/[id]", () => {
    it("returns 401 if not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(401);
    });

    it("deletes template owned by user", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(
        mockTemplate as any,
      );
      vi.mocked(prisma.applyTemplate.delete).mockResolvedValue(
        mockTemplate as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("returns 404 if template not found or not owned", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/nonexistent",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns 404 if user does not own the template", async () => {
      const { getSession } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(getSession).mockResolvedValue({
        userId: "different-user",
        email: "other@example.com",
      });
      vi.mocked(prisma.applyTemplate.findUnique).mockResolvedValue(
        mockTemplate as any, // owned by user-123
      );

      const request = new NextRequest(
        "http://localhost:3000/api/apply-templates/template-1",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "template-1" }),
      });

      expect(response.status).toBe(404);
    });
  });
});
