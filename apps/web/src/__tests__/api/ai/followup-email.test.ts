import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/followup-email/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

describe("POST /api/ai/followup-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/ai/followup-email",
      {
        method: "POST",
        body: JSON.stringify({
          company: "Acme Corp",
          role: "Software Engineer",
          applicationDate: "2026-02-15",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for missing company", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/followup-email",
      {
        method: "POST",
        body: JSON.stringify({
          // Missing company
          role: "Software Engineer",
          applicationDate: "2026-02-15",
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
      "http://localhost:3000/api/ai/followup-email",
      {
        method: "POST",
        body: JSON.stringify({
          company: "Acme Corp",
          // Missing role
          applicationDate: "2026-02-15",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing applicationDate", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/followup-email",
      {
        method: "POST",
        body: JSON.stringify({
          company: "Acme Corp",
          role: "Software Engineer",
          // Missing applicationDate
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for empty company string", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/ai/followup-email",
      {
        method: "POST",
        body: JSON.stringify({
          company: "",
          role: "Software Engineer",
          applicationDate: "2026-02-15",
        }),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
