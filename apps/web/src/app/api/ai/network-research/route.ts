/**
 * Network Research API Endpoint
 *
 * Proxies requests to the Python agent backend to generate
 * AI-powered networking strategies for target companies.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Rate limiter (shared budget with other AI endpoints: 10 req/min)
// ---------------------------------------------------------------------------
const aiLimiter = rateLimit({ interval: 60_000, limit: 10 });

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------
const networkResearchRequestSchema = z.object({
  company: z.string().min(1, "company is required"),
  role: z.string().min(1, "role is required"),
  industry: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/ai/network-research
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate-limit by user (or IP for anonymous)
    const userId = request.headers.get("x-user-id") || "anonymous";
    const { success, retryAfter } = aiLimiter.check(userId);
    if (!success) {
      return rateLimitResponse(retryAfter);
    }

    // Authenticate
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate input
    const body = await request.json();
    const parsed = networkResearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Invalid request body",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const { company, role, industry } = parsed.data;

    // Forward to Python agent backend
    const agentUrl =
      process.env.AGENT_API_URL || "http://localhost:8000";

    const agentResponse = await fetch(
      `${agentUrl}/api/agents/network-research`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          industry: industry ?? null,
        }),
      },
    );

    if (!agentResponse.ok) {
      const errorData = await agentResponse.json().catch(() => null);
      return NextResponse.json(
        {
          error: "Failed to generate networking research",
          details: errorData?.detail?.message ?? "Agent service error",
        },
        { status: agentResponse.status },
      );
    }

    const result = await agentResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        research: result.research,
        generatedAt: result.generated_at,
      },
    });
  } catch (error) {
    console.error("[NETWORK-RESEARCH] Error generating research:", error);

    if (
      error instanceof TypeError &&
      (error.message.includes("fetch") || error.message.includes("ECONNREFUSED"))
    ) {
      return NextResponse.json(
        {
          error: "AI agent service is unavailable. Please try again later.",
          code: "AGENT_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate networking research",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
