import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    reminder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
    },
  },
}));

// Import route handlers
import { GET, POST } from "@/app/api/reminders/route";
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/reminders/[id]/route";
import { PATCH } from "@/app/api/reminders/[id]/complete/route";
import { GET as GET_UPCOMING } from "@/app/api/reminders/upcoming/route";

const mockReminder = {
  id: "reminder-1",
  applicationId: "app-1",
  title: "Follow up with recruiter",
  description: "Send a thank you email",
  dueDate: new Date("2026-03-10T10:00:00Z"),
  completed: false,
  application: {
    id: "app-1",
    company: "TechCorp",
    jobTitle: "Software Engineer",
    status: "Applied",
  },
};

describe("Reminders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reminders", () => {
    it("returns reminders list", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([
        mockReminder,
      ] as any);

      const request = new NextRequest("http://localhost:3000/api/reminders");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("reminders");
      expect(data.reminders).toHaveLength(1);
      expect(data.reminders[0].title).toBe("Follow up with recruiter");
    });

    it("passes applicationId filter to prisma query", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders?applicationId=app-1",
      );
      await GET(request);

      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ applicationId: "app-1" }),
        }),
      );
    });

    it("passes completed filter to prisma query", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders?completed=true",
      );
      await GET(request);

      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ completed: true }),
        }),
      );
    });

    it("applies upcoming filter (dueDate >= now, completed = false)", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders?upcoming=true",
      );
      await GET(request);

      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completed: false,
            dueDate: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });

    it("respects limit parameter", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders?limit=5",
      );
      await GET(request);

      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it("returns 500 when prisma throws", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockRejectedValue(
        new Error("DB error"),
      );

      const request = new NextRequest("http://localhost:3000/api/reminders");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch reminders");
    });
  });

  describe("POST /api/reminders", () => {
    it("creates reminder with valid data", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: "app-1",
      } as any);
      vi.mocked(prisma.reminder.create).mockResolvedValue(mockReminder as any);

      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          applicationId: "app-1",
          title: "Follow up with recruiter",
          dueDate: "2026-03-10T10:00:00Z",
          description: "Send a thank you email",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe("Follow up with recruiter");
    });

    it("returns 400 for missing applicationId", async () => {
      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          title: "Follow up",
          dueDate: "2026-03-10T10:00:00Z",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("returns 400 for missing title", async () => {
      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          applicationId: "app-1",
          dueDate: "2026-03-10T10:00:00Z",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("returns 400 for missing dueDate", async () => {
      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          applicationId: "app-1",
          title: "Follow up",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("returns 404 when application does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          applicationId: "nonexistent",
          title: "Follow up",
          dueDate: "2026-03-10T10:00:00Z",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Application not found");
    });
  });

  describe("GET /api/reminders/[id]", () => {
    it("returns a specific reminder by id", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        mockReminder as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1",
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("reminder-1");
      expect(data.title).toBe("Follow up with recruiter");
    });

    it("returns 404 for non-existent reminder", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/nonexistent",
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Reminder not found");
    });
  });

  describe("PUT /api/reminders/[id]", () => {
    it("updates a reminder with new data", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        mockReminder as any,
      );
      const updatedReminder = {
        ...mockReminder,
        title: "Updated title",
      };
      vi.mocked(prisma.reminder.update).mockResolvedValue(
        updatedReminder as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1",
        {
          method: "PUT",
          body: JSON.stringify({ title: "Updated title" }),
        },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.title).toBe("Updated title");
    });

    it("returns 404 when reminder does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/nonexistent",
        {
          method: "PUT",
          body: JSON.stringify({ title: "Updated" }),
        },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Reminder not found");
    });

    it("preserves existing fields when not provided in update", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        mockReminder as any,
      );
      vi.mocked(prisma.reminder.update).mockResolvedValue(
        mockReminder as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1",
        {
          method: "PUT",
          body: JSON.stringify({ title: "New title" }),
        },
      );
      await PUT(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(prisma.reminder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "New title",
            description: mockReminder.description,
            dueDate: mockReminder.dueDate,
            completed: mockReminder.completed,
          }),
        }),
      );
    });
  });

  describe("DELETE /api/reminders/[id]", () => {
    it("deletes a reminder", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        mockReminder as any,
      );
      vi.mocked(prisma.reminder.delete).mockResolvedValue(
        mockReminder as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("returns 404 when reminder does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/nonexistent",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Reminder not found");
    });
  });

  describe("PATCH /api/reminders/[id]/complete", () => {
    it("marks a reminder as completed", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        mockReminder as any,
      );
      const completedReminder = { ...mockReminder, completed: true };
      vi.mocked(prisma.reminder.update).mockResolvedValue(
        completedReminder as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1/complete",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.completed).toBe(true);
    });

    it("defaults to completed=true when body has no completed field", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        mockReminder as any,
      );
      vi.mocked(prisma.reminder.update).mockResolvedValue({
        ...mockReminder,
        completed: true,
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1/complete",
        {
          method: "PATCH",
          body: JSON.stringify({}),
        },
      );
      await PATCH(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(prisma.reminder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { completed: true },
        }),
      );
    });

    it("returns 404 for non-existent reminder", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/nonexistent/complete",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Reminder not found");
    });

    it("can un-complete a reminder by setting completed=false", async () => {
      const { prisma } = await import("@/lib/prisma");
      const completedReminder = { ...mockReminder, completed: true };
      vi.mocked(prisma.reminder.findUnique).mockResolvedValue(
        completedReminder as any,
      );
      vi.mocked(prisma.reminder.update).mockResolvedValue(
        mockReminder as any,
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/reminder-1/complete",
        {
          method: "PATCH",
          body: JSON.stringify({ completed: false }),
        },
      );
      await PATCH(request, {
        params: Promise.resolve({ id: "reminder-1" }),
      });

      expect(prisma.reminder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { completed: false },
        }),
      );
    });
  });

  describe("GET /api/reminders/upcoming", () => {
    it("returns upcoming reminders", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([
        mockReminder,
      ] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/upcoming",
      );
      const response = await GET_UPCOMING(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("reminders");
      expect(data).toHaveProperty("count");
      expect(data.count).toBe(1);
    });

    it("respects days parameter", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/upcoming?days=14",
      );
      await GET_UPCOMING(request);

      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completed: false,
            dueDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it("returns 500 on database error", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.reminder.findMany).mockRejectedValue(
        new Error("DB error"),
      );

      const request = new NextRequest(
        "http://localhost:3000/api/reminders/upcoming",
      );
      const response = await GET_UPCOMING(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch upcoming reminders");
    });
  });
});
