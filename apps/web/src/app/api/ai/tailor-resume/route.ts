/**
 * AI Resume Tailoring API Endpoint
 *
 * Uses Gemini AI to generate customized resume content based on job descriptions
 * and the user's resume inventory.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

interface TailorResumeRequest {
  jobTitle: string;
  jobDescription: string;
  company?: string;
  applicationId?: string; // Optional: link to existing application
}

interface TailoredResumeResponse {
  summary: string;
  keySkills: string[];
  experienceHighlights: {
    original: string;
    tailored: string;
    reasoning: string;
  }[];
  projectHighlights: {
    original: string;
    tailored: string;
    reasoning: string;
  }[];
  additionalTips: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as TailorResumeRequest;
    const { jobTitle, jobDescription, company, applicationId } = body;

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "jobTitle and jobDescription are required" },
        { status: 400 }
      );
    }

    // Fetch user's resume inventory from preferences
    const resumeInventoryPref = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId: session.userId,
          key: "resume_inventory",
        },
      },
    });

    if (!resumeInventoryPref) {
      return NextResponse.json(
        {
          error: "Resume inventory not found. Please add your resume details in Settings.",
          code: "NO_RESUME_INVENTORY"
        },
        { status: 404 }
      );
    }

    const resumeInventory = JSON.parse(resumeInventoryPref.value);

    // Build AI prompt for resume tailoring
    const prompt = `You are an expert resume writer and career coach. Your task is to help tailor a resume for a specific job application.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company || "Not specified"}
- Description:
${jobDescription}

CANDIDATE'S RESUME INVENTORY:
${JSON.stringify(resumeInventory, null, 2)}

TASK:
Analyze the job description and the candidate's resume inventory. Generate tailored resume content that:
1. Emphasizes the most relevant skills and experiences for this specific role
2. Rewrites bullet points to better match the job requirements while staying truthful
3. Highlights projects that align with the job's technical needs
4. Creates a compelling professional summary tailored to this position

IMPORTANT GUIDELINES:
- Stay truthful - only rephrase existing accomplishments, never fabricate
- Use keywords from the job description naturally
- Quantify achievements where possible
- Keep bullet points concise (1-2 lines max)
- Focus on impact and results

Respond with a JSON object containing:
{
  "summary": "Tailored professional summary (2-3 sentences)",
  "keySkills": ["skill1", "skill2", ...],
  "experienceHighlights": [
    {
      "original": "Original bullet point from resume",
      "tailored": "Rewritten bullet point emphasizing relevant aspects",
      "reasoning": "Why this change helps"
    }
  ],
  "projectHighlights": [
    {
      "original": "Original project description",
      "tailored": "Rewritten project description",
      "reasoning": "Why this change helps"
    }
  ],
  "additionalTips": ["Tip 1", "Tip 2", ...]
}`;

    // Call Gemini AI to generate tailored content
    const tailoredContent = await generateJSON<TailoredResumeResponse>(
      prompt,
      undefined,
      "gemini-1.5-flash" // Fast model for cost-effectiveness
    );

    // If applicationId provided, log this activity
    if (applicationId) {
      try {
        await prisma.activity.create({
          data: {
            applicationId,
            type: "AI Resume Tailoring",
            description: `Generated AI-tailored resume for ${jobTitle} at ${company || "this company"}`,
            date: new Date(),
          },
        });
      } catch (error) {
        console.error("[AI-RESUME] Failed to log activity:", error);
        // Don't fail the request if activity logging fails
      }
    }

    return NextResponse.json({
      success: true,
      data: tailoredContent,
      metadata: {
        jobTitle,
        company,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[AI-RESUME] Error tailoring resume:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) {
        return NextResponse.json(
          {
            error: "AI service not configured. Please contact support.",
            code: "API_KEY_MISSING"
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate tailored resume",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if resume inventory exists
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resumeInventoryPref = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId: session.userId,
          key: "resume_inventory",
        },
      },
    });

    return NextResponse.json({
      hasInventory: !!resumeInventoryPref,
      lastUpdated: resumeInventoryPref?.updatedAt,
    });
  } catch (error) {
    console.error("[AI-RESUME] Error checking inventory:", error);
    return NextResponse.json(
      { error: "Failed to check resume inventory" },
      { status: 500 }
    );
  }
}
