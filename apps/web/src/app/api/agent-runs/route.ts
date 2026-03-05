import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agent-runs
 *
 * Returns the last 20 job searches (with nested agent outputs) that belong
 * to the authenticated user. Ownership is determined via the Application
 * model's aiSearchId foreign key, or — for searches that haven't been
 * imported as applications yet — we return all recent searches so the user
 * can still see their agent activity.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find search IDs linked to this user's applications
    const userApplications = await prisma.application.findMany({
      where: {
        userId,
        aiSearchId: { not: null },
      },
      select: { aiSearchId: true },
    });

    const linkedSearchIds = userApplications
      .map((app) => app.aiSearchId)
      .filter((id): id is string => id !== null);

    // Query searches that are linked to user apps OR recent unlinked searches
    // (JobSearch has no userId, so unlinked searches are returned for visibility)
    const searches = await prisma.jobSearch.findMany({
      where:
        linkedSearchIds.length > 0
          ? { id: { in: linkedSearchIds } }
          : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        agentOutputs: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            agentType: true,
            output: true,
            createdAt: true,
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    const agentRuns = searches.map((search) => ({
      id: search.id,
      query: search.role,
      location: search.location,
      status: search.status,
      createdAt: search.createdAt.toISOString(),
      updatedAt: (search.completedAt ?? search.createdAt).toISOString(),
      resultCount: search._count.results,
      agentOutputs: search.agentOutputs.map((output) => ({
        id: output.id,
        type: output.agentType,
        output: output.output,
        createdAt: output.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ agentRuns });
  } catch (error) {
    console.error("[AGENT-RUNS] Error fetching agent runs:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to fetch agent runs", details: message },
      { status: 500 },
    );
  }
}
