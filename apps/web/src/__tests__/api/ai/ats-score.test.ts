import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/ats-score/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  generateJSON: vi.fn(),
}));

describe("POST /api/ai/ats-score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/ai/ats-score", {
      method: "POST",
      body: JSON.stringify({
        resumeText: "My resume content",
        jobDescription: "Looking for a React developer",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for missing resumeText", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest("http://localhost:3000/api/ai/ats-score", {
      method: "POST",
      body: JSON.stringify({
        // Missing resumeText
        jobDescription: "Looking for a React developer",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing jobDescription", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest("http://localhost:3000/api/ai/ats-score", {
      method: "POST",
      body: JSON.stringify({
        resumeText: "My resume content",
        // Missing jobDescription
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns ATS score for valid input", async () => {
    const { getSession } = await import("@/lib/auth");
    const { generateJSON } = await import("@/lib/gemini");

    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const mockAtsResult = {
      score: 72,
      matchedKeywords: ["React", "TypeScript", "Node.js"],
      missingKeywords: ["Kubernetes", "AWS"],
      suggestions: [
        "Add quantified achievements for your React experience",
        "Include specific cloud platform certifications",
      ],
    };
    vi.mocked(generateJSON).mockResolvedValue(mockAtsResult);

    const request = new NextRequest("http://localhost:3000/api/ai/ats-score", {
      method: "POST",
      body: JSON.stringify({
        resumeText: "Experienced React developer with TypeScript and Node.js",
        jobDescription:
          "Looking for a React developer with Kubernetes and AWS experience",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.score).toBe(72);
    expect(data.data.matchedKeywords).toEqual([
      "React",
      "TypeScript",
      "Node.js",
    ]);
    expect(data.data.missingKeywords).toEqual(["Kubernetes", "AWS"]);
    expect(data.data.suggestions).toHaveLength(2);
  });

  it("clamps score to 0-100 range", async () => {
    const { getSession } = await import("@/lib/auth");
    const { generateJSON } = await import("@/lib/gemini");

    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    vi.mocked(generateJSON).mockResolvedValue({
      score: 150,
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: [],
    });

    const request = new NextRequest("http://localhost:3000/api/ai/ats-score", {
      method: "POST",
      body: JSON.stringify({
        resumeText: "My resume",
        jobDescription: "A job description",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.score).toBe(100);
  });

  it("returns 400 for empty resumeText", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValue({
      userId: "user123",
      email: "test@example.com",
    });

    const request = new NextRequest("http://localhost:3000/api/ai/ats-score", {
      method: "POST",
      body: JSON.stringify({
        resumeText: "",
        jobDescription: "Looking for a developer",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
