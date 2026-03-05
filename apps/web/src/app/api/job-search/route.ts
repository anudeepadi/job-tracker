import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkBackendHealth,
  fetchWithRetry,
  BACKEND_URL,
} from "@/lib/backend-client";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const aiLimiter = rateLimit({ interval: 60_000, limit: 10 });

const PYTHON_BACKEND_URL = BACKEND_URL;

// Maximum time to wait for job search results (in ms)
// CrewAI runs 4 sequential agents which can take 5-10 minutes
const MAX_POLL_TIME = 600000; // 10 minutes
const POLL_INTERVAL = 3000; // 3 seconds

export interface JobSearchRequest {
  job_role: string;
  location: string;
  num_results?: number;
}

export interface JobResult {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary_range?: string;
  posted_date?: string;
  source: string;
}

export interface JobSearchResponse {
  status: "searching" | "completed" | "error";
  results: JobResult[];
  total_found: number;
  search_time_seconds?: number;
  error?: string;
}

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Poll for job search results
async function pollForResults(
  jobId: string,
): Promise<{ status: string; results?: JobResult[]; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_POLL_TIME) {
    // Check status with retry
    const statusResponse = await fetchWithRetry(`/api/search/${jobId}/status`, {
      method: "GET",
      retries: 2, // Fewer retries for polling
    });

    if (!statusResponse.ok) {
      throw new Error("Failed to check job status");
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "completed") {
      // Get results with retry
      const resultsResponse = await fetchWithRetry(
        `/api/search/${jobId}/results`,
        {
          method: "GET",
        },
      );

      if (!resultsResponse.ok) {
        throw new Error("Failed to fetch job results");
      }

      const resultsData = await resultsResponse.json();

      // Transform job_listings to match our JobResult format
      const results: JobResult[] = (resultsData.job_listings || []).map(
        (job: {
          title: string;
          company: string;
          location: string;
          apply_url?: string;
          description?: string;
          salary_range?: string;
          posted_date?: string;
        }) => ({
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.apply_url || "",
          description: job.description,
          salary_range: job.salary_range,
          posted_date: job.posted_date,
          source: "Adzuna",
        }),
      );

      return { status: "completed", results };
    }

    if (statusData.status === "failed") {
      return {
        status: "error",
        error: statusData.error || "Job search failed",
      };
    }

    // Wait before polling again
    await delay(POLL_INTERVAL);
  }

  return { status: "error", error: "Job search timed out" };
}

// POST - Start a new job search
export async function POST(request: NextRequest) {
  let dbSearchId: string | null = null;
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";
    const { success, retryAfter } = aiLimiter.check(userId);
    if (!success) {
      return rateLimitResponse(retryAfter);
    }

    const body: JobSearchRequest = await request.json();

    // Validate required fields
    if (!body.job_role || !body.location) {
      return NextResponse.json(
        { error: "job_role and location are required" },
        { status: 400 },
      );
    }

    // Check backend health before starting search
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "Job search service is currently unavailable. Please ensure the Python backend is running on port 8000.",
          results: [],
          total_found: 0,
        },
        { status: 503 },
      );
    }

    // Step 0: Create a DB record so this search shows up in history (even if it fails)
    const dbSearch = await prisma.jobSearch.create({
      data: {
        role: body.job_role,
        location: body.location,
        numResults: body.num_results || 10,
        status: "running",
      },
      select: { id: true },
    });
    dbSearchId = dbSearch.id;

    // Step 1: Initiate the search with the Python backend with retry
    // Python backend uses 'role' not 'job_role' and endpoint is /api/search
    const searchResponse = await fetchWithRetry("/api/search", {
      method: "POST",
      body: JSON.stringify({
        role: body.job_role,
        location: body.location,
        num_results: body.num_results || 10,
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Python backend error:", errorText);
      await prisma.jobSearch.update({
        where: { id: dbSearch.id },
        data: {
          status: "failed",
          errorMessage: errorText,
          completedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: "Failed to start job search", details: errorText },
        { status: searchResponse.status },
      );
    }

    const searchData = await searchResponse.json();
    const jobId = searchData.job_id;

    if (!jobId) {
      await prisma.jobSearch.update({
        where: { id: dbSearch.id },
        data: {
          status: "failed",
          errorMessage: "No job_id returned from backend",
          completedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: "No job_id returned from backend" },
        { status: 500 },
      );
    }

    // Step 2: Poll for results
    const pollResult = await pollForResults(jobId);

    if (pollResult.status === "error") {
      await prisma.jobSearch.update({
        where: { id: dbSearch.id },
        data: {
          status: "failed",
          errorMessage: pollResult.error || "Job search failed",
          completedAt: new Date(),
          agentOutputs: {
            create: {
              agentType: "job_searcher",
              prompt: `role=${body.job_role} location=${body.location}`,
              output: pollResult.error || "Job search failed",
              metadata: JSON.stringify({
                source: "Adzuna",
                backendJobId: jobId,
              }),
            },
          },
        },
      });
      return NextResponse.json(
        {
          status: "error",
          error: pollResult.error,
          results: [],
          total_found: 0,
        },
        { status: 200 }, // Return 200 with error status in body for graceful handling
      );
    }

    // Persist results
    const resultsToPersist = (pollResult.results || []).map((r) => ({
      searchId: dbSearch.id,
      title: r.title,
      company: r.company,
      location: r.location || null,
      salary: r.salary_range || null,
      description: r.description || null,
      applyUrl: r.url || null,
      sourceUrl: r.url || null,
      postedDate: r.posted_date || null,
      jobType: null,
      remote: r.location?.toLowerCase?.().includes("remote") ?? null,
    }));

    if (resultsToPersist.length) {
      await prisma.jobResult.createMany({ data: resultsToPersist });
    }

    await prisma.jobSearch.update({
      where: { id: dbSearch.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        agentOutputs: {
          create: {
            agentType: "job_searcher",
            prompt: `role=${body.job_role} location=${body.location}`,
            output: `Found ${pollResult.results?.length || 0} results`,
            metadata: JSON.stringify({ source: "Adzuna", backendJobId: jobId }),
          },
        },
      },
    });

    // Step 3: Return results
    return NextResponse.json({
      status: "completed",
      results: pollResult.results || [],
      total_found: pollResult.results?.length || 0,
    });
  } catch (error) {
    console.error("Error proxying job search request:", error);

    if (dbSearchId) {
      try {
        await prisma.jobSearch.update({
          where: { id: dbSearchId },
          data: {
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Internal server error",
            completedAt: new Date(),
          },
        });
      } catch (e) {
        console.error("Failed to mark db search as failed:", e);
      }
    }

    // Check if it's a connection error to the Python backend
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "Unable to connect to the job search service. Please ensure the Python backend is running on port 8000.",
          results: [],
          total_found: 0,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Internal server error",
        results: [],
        total_found: 0,
      },
      { status: 500 },
    );
  }
}

// GET - Check search status or get results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get("search_id");

    if (!searchId) {
      return NextResponse.json(
        { error: "search_id is required" },
        { status: 400 },
      );
    }

    // Proxy the status check to the Python backend with retry
    const response = await fetchWithRetry(`/api/search/${searchId}/status`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python backend error:", errorText);
      return NextResponse.json(
        { error: "Failed to get search status", details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking job search status:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Unable to connect to the job search service",
          details: "The Python backend service may not be running.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
