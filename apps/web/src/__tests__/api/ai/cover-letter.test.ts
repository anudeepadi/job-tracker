import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/cover-letter/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

describe("POST /api/ai/cover-letter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/ai/cover-letter",
      {
        method: "POST",
        body: JSON.stringify({
          jobDescription: "Looking for a developer",
          resumeText: "5 years experience",
          company: "Acme",
          role: "Developer",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for missing jobDescription", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/cover-letter",
      {
        method: "POST",
        body: JSON.stringify({
          // Missing jobDescription
          resumeText: "5 years experience",
          company: "Acme",
          role: "Developer",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing resumeText", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/cover-letter",
      {
        method: "POST",
        body: JSON.stringify({
          jobDescription: "Looking for a developer",
          // Missing resumeText
          company: "Acme",
          role: "Developer",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing company", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/cover-letter",
      {
        method: "POST",
        body: JSON.stringify({
          jobDescription: "Looking for a developer",
          resumeText: "5 years experience",
          // Missing company
          role: "Developer",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing role", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/cover-letter",
      {
        method: "POST",
        body: JSON.stringify({
          jobDescription: "Looking for a developer",
          resumeText: "5 years experience",
          company: "Acme",
          // Missing role
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for empty strings", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/cover-letter",
      {
        method: "POST",
        body: JSON.stringify({
          jobDescription: "",
          resumeText: "5 years experience",
          company: "Acme",
          role: "Developer",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
