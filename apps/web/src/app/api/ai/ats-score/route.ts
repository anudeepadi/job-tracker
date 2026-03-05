/**
 * ATS Score API Endpoint
 *
 * Analyzes a resume against a job description using Gemini AI
 * to produce an ATS compatibility score, matched/missing keywords,
 * and actionable improvement suggestions.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Rate limiter (shared budget with other AI endpoints: 10 req/min)
// ---------------------------------------------------------------------------
const aiLimiter = rateLimit({ interval: 60_000, limit: 10 });

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------
const atsScoreRequestSchema = z.object({
  resumeText: z.string().min(1, "resumeText is required"),
  jobDescription: z.string().min(1, "jobDescription is required"),
});

// ---------------------------------------------------------------------------
// Response shape returned by the AI model
// ---------------------------------------------------------------------------
interface ATSScoreResponse {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// POST /api/ai/ats-score
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
    const parsed = atsScoreRequestSchema.safeParse(body);

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

    const { resumeText, jobDescription } = parsed.data;

    // Build AI prompt
    const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze the following resume text against the provided job description and return a compatibility assessment.

RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK:
1. Calculate an ATS compatibility score from 0 to 100 based on keyword match, skill alignment, and overall relevance.
2. List the keywords and skills from the job description that ARE present in the resume.
3. List the keywords and skills from the job description that are MISSING from the resume.
4. Provide 3-5 specific, actionable suggestions to improve ATS compatibility.

SCORING GUIDELINES:
- 0-30: Very poor match — major skills and keywords missing
- 31-50: Below average — several important keywords missing
- 51-75: Moderate match — core skills present but gaps remain
- 76-90: Strong match — most keywords present with minor gaps
- 91-100: Excellent match — nearly all keywords and skills aligned

Respond with valid JSON only (no markdown), matching this exact structure:
{
  "score": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

    // Call Gemini AI
    const atsResult = await generateJSON<ATSScoreResponse>(
      prompt,
      undefined,
      "gemini-1.5-flash",
    );

    // Clamp score to valid range
    const clampedScore = Math.max(
      0,
      Math.min(100, Math.round(atsResult.score)),
    );

    return NextResponse.json({
      success: true,
      data: {
        ...atsResult,
        score: clampedScore,
      },
    });
  } catch (error) {
    console.error("[ATS-SCORE] Error analyzing resume:", error);

    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error: "AI service not configured. Please contact support.",
          code: "API_KEY_MISSING",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze ATS score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
